# Design: Image mosaic editor and export

Shared contracts: `../10-06-mosaic-mvp/design.md` 3.2-3.4, 4.

## Modules

```
src/features/editor/
  mosaicEngine.ts     pure functions: blockMean(ImageData, b) -> ImageData; snapRect; defaultBlock; defaultRadius
  mosaic.worker.ts    runs blockMean for pages > 4 MP
  pageRenderer.ts     PageRenderer class per page: base bitmap, mosaic cache Map<b, ImageBitmap>,
                      composite OffscreenCanvas; applyOp(op), rebuild(ops), getComposite()
  Viewport.tsx        visible <canvas>; transform (scale, tx, ty); pointer handling; cursor overlay
  tools/rectTool.ts   pointer -> preview rect -> MosaicOp
  tools/brushTool.ts  pointer -> live stroke points -> MosaicOp
  useShortcuts.ts     keyboard map from shared design 4
src/store/editorStore.ts   tool, blockSize, brushRadius, zoom/pan per doc
src/features/export/
  exporters.ts        registry: Record<DocKind, (doc, target?) => Promise<string>>
  exportImage.ts      composite -> PNG bytes -> invoke("export_image")
  exportAll.ts        loops edited docs, progress toast
src-tauri/src/commands/export.rs
  export_image, write_export, unique_target_path(src, ext) (pure, tested), reveal_in_folder
```

## Implementation notes (2026-10-06)

The modules above were built with these differences:

- `PageRenderer` exposes `sync(ops)` instead of `applyOp` / `rebuild`. `opsDelta` compares the drawn ops with the store ops by identity: a prefix match draws the new ops, anything else replays from the base. `listen(fn)` replaces an `onChange` property (React Compiler lint). The composite is the `composite` field.
- Live brush: `beginStroke`, `paintSegment`, `endStroke`. A live stroke differs from a replay at the anti-aliased edge (measured: 2013 pixels, max channel difference 47 on a 4000 x 3000 page), so `endStroke` marks the composite stale and the stroke op replays all ops (about 20 ms on 4000 x 3000). Item 5 below is replaced by this.
- `tools/types.ts` holds the shared `ToolContext` / `ToolSession` types.
- `exportAll` lives in `exportActions.ts` with `exportCurrent` and `saveAsCurrent`; the dialog for E15 is `CloseGuard.tsx`.
- Rust: `target_name(src, n)` (pure, tested) and `create_unique(src)` replace `unique_target_path`. Commands return the written path as a string.
- Export of a document that is not shown renders off screen with `renderComposite(base, ops)`; the base comes from the bitmap cache or `readImageBitmap` (not cached, closed after use).

## Rendering pipeline

1. On document ready: `PageRenderer` draws the base bitmap into the composite canvas, then `rebuild(page.ops)`.
2. `getMosaic(b)`: from cache, else `blockMean` (worker if > 4 MP) -> `ImageBitmap`, cached. Cache limit: 4 block sizes per page (LRU).
3. Rect op: `ctx.save(); ctx.beginPath(); ctx.rect(snapped); ctx.clip(); ctx.drawImage(mosaic, 0, 0); ctx.restore()`.
4. Stroke op: draw the polyline into a reusable mask canvas (`lineCap/lineJoin = "round"`, `lineWidth = 2r`, opaque); `globalCompositeOperation = "source-in"`; draw mosaic; then draw the mask canvas onto the composite. To limit work, use the stroke bounding box only.
5. Live brush: each pointermove appends a segment and applies only the new segment's bounding box to the composite; on pointerup the full op is pushed to the store. Live painting and the final op produce the same pixels because both draw the same mosaic cells.
6. Viewport draws the composite with `setTransform(scale, 0, 0, scale, tx, ty)`; `imageSmoothingEnabled = scale < 1` so zoom-in shows sharp mosaic cells.
7. Undo/redo: store update -> `rebuild(ops)`.

## Export

- `exportImage(doc, target?)`: `composite.convertToBlob({ type: "image/png" })` -> `Uint8Array` -> `invoke("export_image", bytes, { headers: { "x-source": enc(path), "x-target": enc(target ?? "") } })`.
- Rust `export_image`: decode PNG with `image`, choose encoder from the target extension (shared 3.2), write with `create_new(true)` for automatic names or `File::create` for Save as. Return the final path.
- `unique_target_path(src, ext)`: `<dir>/<stem>_mosaic.<ext>`, then `_mosaic_2`, `_3` ... up to 9999, else error.
- `reveal_in_folder(path)`: Windows `explorer /select,<path>`. Implemented with `std::process::Command` inside Rust (no shell plugin).
- `exporters` registry: image exporter registered here; `10-06-pdf-mosaic` registers `pdf`. `exportAll` skips kinds without an exporter.

## Close confirmation (E15)

`src/features/export/useCloseGuard.ts`: `getCurrentWindow().onCloseRequested(e => ...)`. When `docStore` has unexported edited documents, call `e.preventDefault()` and open a shadcn `AlertDialog`; on "退出" call `getCurrentWindow().destroy()`. Capability: `core:window:allow-destroy`.

## Performance budget

- 4000 x 3000 image: `blockMean` about 50 ms in a worker (one pass over 48 M bytes). Rect op draw < 16 ms.
- Composite and mosaic caches per page: base 48 MB + composite 48 MB + up to 4 mosaic bitmaps. Only the current document keeps a `PageRenderer`; others drop it on deselect (ops stay in the store).

## Risks

- `OffscreenCanvas.convertToBlob` support in WebView2: supported (Chromium). Fallback not required for Windows.
- Large stroke point arrays: simplify points closer than 1 image px to the previous point.
