# Editor toolbar optimization: hand tool, size reset, image rotation

Follows `10-06-mosaic-mvp` (archived). Shared design reference: `.trellis/tasks/archive/2026-10/10-06-mosaic-mvp/design.md` sections 3.3, 3.4, 4.

## Goal

Make the editor toolbar easier to use: one click restores the default block and brush sizes, a hand tool pans and zooms the page, and image documents can be rotated in 90 degree steps with the rotation kept in the exported file.

## Source Requirements (user request, 2026-10-07)

1. The toolbar group with the tools and the size sliders needs a "restore default" button. Add a third tool, the hand ("小手"), for dragging and zooming the page.
2. Images must support rotation. PDF documents do not need rotation.

## Decisions (user, 2026-10-07)

| ID  | Decision                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | "恢复默认" restores the block size and the brush size of the current document to the defaults of shared design 3.4. It does not change zoom, rotation, or existing ops.                                                                                                                        |
| T2  | Hand tool: left-button drag pans; the plain mouse wheel zooms at the cursor (no `Ctrl` needed); shortcut `H`. With the rectangle and brush tools the wheel keeps its current behavior (pan), and `Space+drag` / middle-button drag still pan.                                                  |
| T3  | Rotation is applied in export: the exported file has the orientation shown on screen; width and height swap for 90 and 270 degrees.                                                                                                                                                            |
| T4  | Rotation counts as an edit: a rotated image without ops can be exported, shows the "edited, not exported" marker, and triggers the close confirmation. Rotation is not in the undo/redo history; the rotate-left and rotate-right buttons reverse each other. `Ctrl+Z` undoes mosaic ops only. |

## Confirmed Facts (code read, 2026-10-07)

- `Tool` is `"rect" | "brush"` in `src/store/editorStore.ts`. `Viewport.tsx` treats every tool that is not `"rect"` as the brush when a gesture starts.
- Sizes per document live in `editorStore.sizes[doc.id]`; an absent entry means the defaults (`sizesOf`). Removing the entry restores the defaults.
- Ops are stored in page raster pixels; `PageRenderer` composites at raster resolution; `exportImage` encodes `renderer.composite` as PNG, and Rust `export_image` re-encodes it without reading orientation metadata.
- "Edited" is `hasOps(doc)`; "unexported" is `hasOps && version !== exportedVersion`. Both are used by the toolbar, the sidebar marker, `exportActions`, and the close guard.

## Task Map

| Child                            | Deliverable                                       | Order                                                               |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| `10-07-hand-tool-and-size-reset` | T1 reset button, T2 hand tool                     | 1                                                                   |
| `10-07-image-rotation`           | T3/T4 rotation of image documents, rotated export | 2 (after child 1: both change `Viewport.tsx` gesture and draw code) |

## Cross-Child Acceptance Criteria

- [x] X1. The toolbar order is: open file, open folder | rectangle, brush, hand | block size, brush size (brush tool only), restore default | undo, redo | rotate left, rotate right (image documents only) | export.
- [x] X2. The keyboard shortcut table in shared design 4 gets `H` (hand tool). Existing shortcuts keep their behavior.
- [x] X3. On a rotated image, the hand tool, `Space+drag`, `Ctrl+wheel`, `Ctrl+0`, and the status bar zoom buttons work the same as on an unrotated image.
- [x] X4. `pnpm typecheck && pnpm lint && pnpm test` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` pass.
- [x] X5. All new visible text is Chinese; icon-only buttons have a Chinese `aria-label` and a tooltip.

## Out of Scope

- Rotation of PDF pages.
- Free-angle rotation, flip/mirror, crop.
- Rotation in the undo/redo history.
- Keyboard shortcuts for rotation and for "restore default".
- Click-to-zoom with the hand tool.
