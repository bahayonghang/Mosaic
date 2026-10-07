# PDF page mosaic and export

Parent: `10-06-mosaic-mvp` (decision D4; shared design sections 3.2 `write_export`, 3.3, 3.4). Reference: `../10-06-mosaic-mvp/research/reference-repos.md` (CoverUP).
Depends on: `10-06-image-mosaic-editor` archived (reuses Viewport, tools, PageRenderer, exporters registry). `10-06-file-import` archived (PDF branch of `loadDocument`).

## Goal

The user opens a PDF, moves between pages, applies mosaic on any page with the same tools as images, and exports a fully rasterized PDF next to the original.

## Requirements

- P1. Opening a PDF reads it with pdf.js and shows page 1 rendered at 200 DPI (longest side clamped to 8192 px).
- P2. Page navigation in the status bar: previous / next buttons, editable page number "3 / 12", `PageUp` / `PageDown`. Zoom fits each newly shown page.
- P3. Rectangle, brush, block size, brush size, undo, and redo work on the current page exactly as for images. Undo and redo are per page.
- P4. Default block size and brush radius are computed from the first page and shared by all pages of the document.
- P5. Pages with ops show a small marker next to the page number when that page is shown ("本页已打码").
- P6. Export (`导出`, `Ctrl+S`, `全部导出`): output `<stem>_mosaic.pdf` (collision numbering as images). Every page is rendered at 200 DPI, ops applied, encoded as JPEG quality 0.9, and placed on a page with the source page size in points. Pages without ops are also rasterized (D4).
- P7. Save as: system save dialog filtered to PDF.
- P8. Export shows a progress toast "正在导出第 i / n 页" and keeps the UI responsive.
- P9. Password-protected PDFs show the error "暂不支持受密码保护的 PDF". Corrupt PDFs show "无法打开此 PDF".
- P10. Memory: at most 3 rendered pages are kept in memory; others are released and re-rendered on demand.
- P11. Page rotation (`/Rotate`) is applied: the page displays and exports upright with rotated dimensions.

## Acceptance Criteria

- [ ] P1/P2: open a 12-page PDF; navigate to page 12 and back with buttons, keys, and the page number field.
- [ ] P6: export a text PDF after mosaic on page 1; the output has the same page count and page sizes (points, ±0.5); `pdftotext` on the output returns only whitespace.
- [ ] P6: page 2 (no ops) in the output looks the same as the source at 100 % zoom.
- [ ] P8/P10: export a 200-page PDF; the UI stays responsive; the app's memory stays below 1.5 GB during export (Task Manager).
- [ ] P9: a password-protected PDF and a corrupt PDF each show the correct error; other documents still work.
- [ ] P11: a PDF with a 90° rotated page displays and exports upright.
- [ ] The mosaic region in the exported page matches the editor view.

## Out of Scope

- Password entry, keeping text or vector content, compressed export mode, page thumbnails, page insert/delete/reorder, annotations and form fields in the output.
