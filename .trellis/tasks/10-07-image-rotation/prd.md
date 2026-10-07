# Image rotation

Parent: `10-07-editor-toolbar-optimization` (decisions T3, T4).
Depends on: `10-07-hand-tool-and-size-reset` committed (both change `Viewport.tsx`).

## Goal

The user turns a sideways image upright in 90 degree steps, applies mosaic in the upright view, and exports the image in the upright orientation.

## Requirements

### Rotation

- G1. Two icon-only toolbar buttons after undo/redo: "向左旋转" (lucide `RotateCcw`, 90 degrees counter-clockwise) and "向右旋转" (lucide `RotateCw`, 90 degrees clockwise). Each has a Chinese `aria-label` and a tooltip.
- G2. The buttons show only when the current document is a ready image. PDF documents never show them.
- G3. Rotation is stored per document with the values 0, 90, 180, 270 (clockwise). Four clicks in one direction return to 0.
- G4. After a rotation, the view fits the rotated image to the window.
- G5. The status bar shows the size of the rotated image (width and height swap at 90 and 270).
- G6. Rotation is kept when the user switches documents and when an image is decoded again after it left the bitmap cache.

### Editing on a rotated image

- G7. Rectangle and brush ops drawn on a rotated image cover the screen region the user dragged over. The dashed rect preview and the brush circle line up with the pointer.
- G8. Ops drawn before a rotation stay on the same image content after the rotation.
- G9. Undo/redo acts on mosaic ops only; it does not change the rotation (T4).

### Edit state and export

- G10. A document with a rotation other than 0 counts as edited, also without ops: the export button is enabled, it is included in "全部导出", the sidebar shows the edited marker, and closing the window asks for confirmation (T4).
- G11. A rotation change increments `doc.version`, so the edited marker returns after an export followed by a rotation.
- G12. Export writes the image in the rotated orientation (T3). "导出", "另存为…", and "全部导出" all apply the rotation. The output has no orientation metadata (existing behavior of `export_image`).

## Acceptance Criteria

- [x] G1/G2: open a JPG: both rotate buttons show; open a PDF: neither shows.
- [x] G3/G5: on a 4000 x 3000 JPG, click "向右旋转": status bar shows `3000 × 4000`; click 3 more times: `4000 × 3000`.
- [x] G7: rotate a JPG 90 degrees right, drag a rect over a visible word: the mosaic covers the word on screen and in the export.
- [ ] G8: draw a rect on an unrotated JPG, rotate left: the mosaic stays on the same content. (inferred: not run; `rotate` does not touch `pages`)
- [x] G9: rotate right, draw a rect, press `Ctrl+Z`: the rect disappears and the image stays rotated.
- [ ] G10: open an unedited JPG, rotate right: the export button is enabled and the sidebar marker shows; close the window: the confirmation dialog shows. Rotate left back to 0: the export button is disabled and the marker clears. (verified in browser preview except the close dialog: needs the Tauri window; not run)
- [x] G11: rotate right, export, rotate right again: the marker shows again.
- [x] G12: export a 400 x 300 PNG rotated 90 degrees right: the output is 300 x 400; the output pixel (0, 0) equals the source pixel (0, 299). Export with 180 and 270 degrees and check one corner pixel each.
- [ ] G12: "另存为…" a rotated JPG as PNG: the PNG has the rotated orientation. (inferred: not run; Save as uses the same `exportImage` path verified for 90/180/270)
- [x] Unit tests (vitest): rotated size, point and rect mapping and its inverse for 0/90/180/270; `rotate` store action (cycle, version increment, no change for a PDF document); `hasEdits` / `isUnexported` with rotation and no ops.
- [x] `pnpm typecheck && pnpm lint && pnpm test` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` pass.

## Out of Scope

- PDF page rotation.
- Free-angle rotation, flip, crop.
- Rotation in undo/redo history; rotation shortcuts.
- Re-snapping existing ops to a new grid after rotation (the block grid stays aligned to the source image, see `design.md`).
