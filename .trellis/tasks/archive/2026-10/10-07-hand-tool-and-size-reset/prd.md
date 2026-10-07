# Hand tool and size reset

Parent: `10-07-editor-toolbar-optimization` (decisions T1, T2).

## Goal

The user restores the default block and brush sizes with one click, and pans and zooms the page with a hand tool instead of holding `Space` or `Ctrl`.

## Requirements

### Restore default sizes (T1)

- R1. A ghost text button "恢复默认" sits after the size sliders in the toolbar. Tooltip: "恢复默认颗粒和笔刷大小".
- R2. A click sets the block size and the brush size of the current document to `defaultBlock` / `defaultRadius` of its first page (shared design 3.4, same rule as `sizesOf`).
- R3. The button is disabled when no document is ready, or when both sizes already equal the defaults.
- R4. The reset changes later ops only. Existing ops, zoom, pan, and the selected tool do not change.

### Hand tool (T2)

- H1. A third item "抓手" with the lucide `Hand` icon joins the tool toggle group after "画笔". Tooltip "抓手（平移和缩放）" with shortcut `H`. Shortcut `H` selects it.
- H2. With the hand tool, a left-button drag pans the page. The cursor is `grab`, and `grabbing` during the drag. No op is created and the brush circle is hidden.
- H3. With the hand tool, the plain mouse wheel zooms at the cursor, with the same factor and the same 5 %-800 % range as `Ctrl+wheel`. `Ctrl+wheel` also zooms. `Shift+wheel` pans horizontally.
- H4. With the rectangle and brush tools, wheel behavior does not change (plain wheel pans vertically, `Shift+wheel` horizontally, `Ctrl+wheel` zooms). `Space+drag` and middle-button drag pan with every tool.
- H5. The block size slider stays visible with the hand tool; the brush size slider stays brush-only.

## Acceptance Criteria

- [x] R1-R3: open a 4000 x 3000 JPG: the button is disabled. Set block size 20 and brush size 120, click "恢复默认": the sliders show 40 and 100 (defaults for a 4000 px long side: block `clamp(round(4000 / 100), 8, 48)` = 40, radius `clamp(round(4000 / 40), 8, 200)` = 100) and the button becomes disabled again.
- [x] R4: draw one rect with block 20, click "恢复默认": the rect keeps its 20 px cells; the zoom percent in the status bar does not change.
- [x] H1: press `H`: the hand item is pressed; press `R`: the rectangle item is pressed.
- [x] H2: with the hand tool, drag on the page: the page moves with the pointer, the op count stays the same (undo button stays disabled on a fresh document).
- [x] H3: with the hand tool, wheel up over a point of the image: the zoom percent increases and the image point under the cursor stays under the cursor.
- [x] H4: with the rectangle tool, the plain wheel scrolls the page vertically and does not change the zoom percent.
- [x] Unit test (vitest): the reset action on `editorStore` removes the stored sizes of the document, and `sizesOf` then returns the defaults.
- [x] `pnpm typecheck && pnpm lint && pnpm test` pass.

## Out of Scope

- Click-to-zoom and `Alt+click` zoom out with the hand tool.
- A shortcut for "恢复默认".
- Image rotation (`10-07-image-rotation`).
