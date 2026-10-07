# Image mosaic editor and export

Parent: `10-06-mosaic-mvp` (decisions D2, D5, D6, D7; shared design sections 3.2 `export_image`, 3.3, 3.4, 4).
Depends on: `10-06-app-shell` archived. Integrates with `10-06-file-import` (the current document comes from `docStore`).

## Goal

On the current image, the user selects regions with a rectangle or a brush, the regions become mosaic immediately, and the user exports the result next to the original.

## Requirements

### Editing

- E1. Rectangle tool (`R`): drag to draw; on release, the rectangle (snapped outward to the block grid) becomes mosaic. A dashed preview outline shows during the drag.
- E2. Brush tool (`B`): press and drag to paint mosaic along the path. The cursor is a circle with the brush diameter at the current zoom. Mosaic shows while painting. One press-to-release is one op.
- E3. Block size slider "颗粒大小" (4-96 px, image pixels). Default per document from shared 3.4. The value applies to new ops only.
- E4. Brush size slider "笔刷大小" (4-400 px radius, image pixels), visible only with the brush tool. `[` and `]` change it by 10 %.
- E5. Undo (`Ctrl+Z`) and redo (`Ctrl+Shift+Z`, `Ctrl+Y`) per page, unlimited within the session. Toolbar buttons are disabled when there is nothing to undo or redo.
- E6. Zoom: fit to window on open; `Ctrl+wheel` zooms at the cursor; `Ctrl+=` / `Ctrl+-`; `Ctrl+0` fit; range 5 %-800 %; status bar shows the percent and the image size. Plain wheel scrolls vertically, `Shift+wheel` horizontally.
- E7. Pan: `Space+drag` or middle-button drag.
- E8. Ops outside the image bounds are clipped to the image.

### Export

- E9. "导出" button and `Ctrl+S`: write `<stem>_mosaic.<ext>` next to the source; on collision `_mosaic_2`, `_mosaic_3`, ... Format = source format (D7). Toast "已导出：<file name>" with an "打开文件夹" action that reveals the file in Explorer.
- E10. "另存为…": system save dialog, default name `<stem>_mosaic.<ext>`, filters JPG/PNG/WebP/BMP; the format follows the chosen extension. Choosing the source path is rejected with the message "不能覆盖原文件".
- E11. "全部导出": exports every edited document (E9 naming). A progress toast shows "正在导出 i / n"; the final toast reports successes and failures. Unedited documents are skipped. PDF documents are exported by the exporter registered by `10-06-pdf-mosaic`; until then they are skipped with a note.
- E12. Export buttons are disabled when the current document has no ops ("全部导出" is disabled when no document has ops).
- E13. After a successful export, the document's edited dot clears until the next op.
- E14. Export never modifies the source file.

### Close confirmation (D9)

- E15. When the user closes the window and at least one document has ops and is not exported since its last op, the close is blocked and a dialog shows "有 N 个文件已打码但未导出，确定退出吗？" with buttons "取消" and "退出". "退出" closes the app; "取消" keeps it open. With no such document, the window closes at once.

## Acceptance Criteria

- [x] E1/E2: draw one rectangle and one brush stroke on a 4000 x 3000 JPG; mosaic appears within 100 ms of releasing the mouse (rect) and follows the cursor while painting (brush) without visible lag.
- [x] E3: two rectangles with block sizes 8 and 40 show visibly different cell sizes; both stay after undo of a later op.
- [x] E5: undo 2 times, redo 1 time; the canvas matches the expected state.
- [x] E9/E14: export a JPG twice; `a_mosaic.jpg` and `a_mosaic_2.jpg` exist; `a.jpg` size and modified time are unchanged.
- [x] E10: Save as PNG from a JPG source produces a valid PNG.
- [x] Export of a BMP and a WebP source produces files of the same format that open in Windows Photos.
- [x] E15: edit a file and close the window: the dialog appears; "取消" keeps the app open; export the file and close again: the app closes without a dialog.
- [x] Exported image has the same pixel size as the source and no EXIF data.
- [x] Unit tests (vitest): block mean on a known 4 x 4 image; rect snap to grid; op replay equals incremental application; export name generation is covered by `cargo test` (collision numbering, source-path rejection).

## Out of Scope

- Lasso, ellipse, blur, fill, move/resize of existing ops, selection of existing ops.
- Mosaic preview of block size changes on existing ops.
- PDF rendering and PDF export (`10-06-pdf-mosaic`).
