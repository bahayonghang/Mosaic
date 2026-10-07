# Design: Image rotation

## Core decision: ops stay in source raster coordinates

Rotation is a view and export transform. The base bitmap, `PageRenderer`, the mosaic copies, and every stored op keep the unrotated source raster coordinates. Only three places apply the rotation:

1. `Viewport` draw and pointer mapping (screen <-> source).
2. The status bar size label.
3. `exportImage`, which rotates the finished composite before PNG encoding.

Reasons:

- A rotation does not touch ops, so G8 holds without rewriting op coordinates, and `PageRenderer.sync` sees no op change (no replay, no mosaic recompute).
- 90 degree steps map the pixel grid onto itself, so mosaic cells stay square and sharp in the view and in the export.
- The block grid stays anchored at source pixel (0, 0). On a rotated view the grid origin appears at another corner. This is invisible to the user except that partial edge cells sit on a different edge; AC4 of the MVP (pixels inside a region are block averages) still holds.

Rejected alternative: rotate the base bitmap and transform all op coordinates on each rotation. It needs a new base bitmap per rotation, a full replay, mosaic recompute, and coordinate rewrite of every op, and it breaks the object identity that `opsDelta` relies on.

## Data model (`src/store/types.ts`, `src/store/docStore.ts`)

```ts
export type Rotation = 0 | 90 | 180 | 270; // clockwise
interface MosaicDoc {
  // ...
  /** Image only: clockwise view and export rotation; absent means 0. */
  rotation?: Rotation;
}
```

- `rotate(docId, dir: 1 | -1)`: for `kind === "image"` only, `rotation = (rotation + dir * 90 + 360) % 360`, `version + 1`. A PDF document is not changed.
- `hasEdits(doc) = hasOps(doc) || (doc.rotation ?? 0) !== 0`.
- `isUnexported(doc) = hasEdits(doc) && doc.version !== doc.exportedVersion`.
- Replace `hasOps` with `hasEdits` where it means "can export / is edited": `Toolbar.tsx` (`anyEdited`, `canExport`), `exportActions.ts` (`exportCurrent`, `saveAsCurrent`, `exportAll`). `hasOps` stays for code that means "has mosaic ops".
- The field lives on `MosaicDoc`, so `loadDocument` keeps it across cache reloads (G6): `update` merges, and the loader never writes `rotation`.

## Rotation math (`src/features/editor/rotation.ts`, pure, unit-tested)

Source size `W x H`, rotation `r` clockwise. Rotated size: `r` of 90 or 270 swaps to `H x W`.

| r   | source (x, y) -> rotated (qx, qy) | canvas matrix `a b c d e f` |
| --- | --------------------------------- | --------------------------- |
| 0   | (x, y)                            | 1 0 0 1 0 0                 |
| 90  | (H - y, x)                        | 0 1 -1 0 H 0                |
| 180 | (W - x, H - y)                    | -1 0 0 -1 W H               |
| 270 | (y, W - x)                        | 0 -1 1 0 0 W                |

Matrix convention: `qx = a*x + c*y + e`, `qy = b*x + d*y + f` (Canvas `setTransform(a, b, c, d, e, f)`).

Exports:

- `rotatedSize(w, h, r)`.
- `rotationMatrix(w, h, r)`: the six values above.
- `toRotated([x, y], w, h, r)` and `fromRotated([qx, qy], w, h, r)` (inverse).
- `rotateRect(rect, w, h, r)`: map two opposite corners and take min/max (axis-aligned for 90 degree steps).

## Viewport (`src/features/editor/Viewport.tsx`)

- Read `doc.rotation ?? 0` into `live.current`.
- The transform `{ s, tx, ty }` stays in screen space of the rotated image. `fit`, `apply` (`clampAxis`), and the white page rect use `rotatedSize(renderer.width, renderer.height, r)`.
- `draw`: `ctx.setTransform(dpr*s*a, dpr*s*b, dpr*s*c, dpr*s*d, dpr*(s*e + tx), dpr*(s*f + ty))`, then `drawImage(r.composite, 0, 0)`.
- `toImage`: screen -> rotated `((px - tx) / s, (py - ty) / s)` -> `fromRotated`.
- `showRect`: `rotateRect` of the source rect, then scale and translate.
- Brush circle: a circle, unchanged.
- An effect on `rotation` calls `handles.current.fit()` (G4). The renderer is not rebuilt.

## Status bar (`src/components/layout/StatusBar.tsx`)

- Size label uses `rotatedSize(page.width, page.height, doc.rotation ?? 0)` for image documents.

## Toolbar (`src/components/layout/Toolbar.tsx`)

- After the undo/redo group: a separator and two `icon-sm` ghost buttons, rendered only when `doc?.kind === "image" && page`. `onClick={() => rotate(doc.id, -1 | 1)}`.

## Export (`src/features/export/exportImage.ts`)

- After the composite is ready: when `rotation !== 0`, create a CPU-backed `OffscreenCanvas` of the rotated size (`getContext("2d", { willReadFrequently: true })`), `setTransform(...rotationMatrix)`, `drawImage(composite, 0, 0)`, `convertToBlob({ type: "image/png" })`, then set the canvas width and height to 0 (frontend quality guideline "Canvas memory").
- `rotation === 0` keeps the current path.
- Rust `export_image` does not change: it reads the PNG size and writes no metadata.

## Compatibility and risk

- No persisted state; no migration.
- Memory: a rotated export holds a second RGBA copy of the image during encoding (48 MB for 4000 x 3000). The decode limit stays `MAX_PIXELS`; the largest allowed image doubles its peak during a rotated export. Accepted for this task; record the peak in the check notes if a large-image test is run.
- PDF code paths do not read `rotation`.

## Rollback

`git revert` of the rotation commits. Ops and documents created without rotation are unaffected.
