# Design: PDF page mosaic and export

Shared contracts: `../10-06-mosaic-mvp/design.md` 3.2-3.4. Mechanism follows CoverUP (`ref/CoverUP/coverup/document_loader.py:22`, `ref/CoverUP/coverup/main.py:363-410`).

## Modules

```
src/features/pdf/
  pdfLoader.ts     loadPdf(bytes) -> PdfHandle { pageCount, pageSize(i) in points (rotation applied) }
                   pdfjs-dist with its worker bundled via Vite `?url`; isEvalSupported = false
  pageCache.ts     renderPage(handle, i) -> ImageBitmap at scale = min(200/72, 8192 / max(wPt, hPt) * ...)
                   LRU of 3 bitmaps; evicted bitmaps are close()d
  exportPdf.ts     registered in exporters as "pdf"
src/components/layout/PageNav.tsx   status-bar page navigation
```

## Loading

1. `loadDocument` (file-import) calls `loadPdf(bytes)` for `kind: "pdf"`.
2. `PageState[]` is created for all pages with `width/height` computed from point size and the render scale (no rendering yet), `pdfPointSize` from `page.view` and `page.rotate`.
3. pdf.js `PasswordException` -> P9 message; other load errors -> "无法打开此 PDF".
4. The `PdfHandle` lives in a `Map<docId, PdfHandle>` outside the store; it is destroyed when the document is removed.

## Editing

The editor's `PageRenderer` takes a base bitmap. For PDF, the base bitmap is `renderPage(handle, currentPage)`. Changing page drops the old `PageRenderer` and creates one for the new page. No editor change is needed beyond reading `doc.pages[doc.currentPage]` (the editor already uses `currentPage`, which is 0 for images).

## Export

1. Create `PDFDocument` with pdf-lib.
2. For each page i, sequentially: render at 200 DPI (bypassing the LRU so the cache is not flushed), create a `PageRenderer`, `rebuild(ops)`, `convertToBlob({ type: "image/jpeg", quality: 0.9 })`, `embedJpg`, `addPage([wPt, hPt])`, `drawImage` full page, release bitmaps. Yield to the event loop between pages (`await` a `setTimeout(0)`) and update the progress toast.
3. `pdf.save({ useObjectStreams: true })` -> `invoke("write_export", bytes, { headers: { "x-source", "x-target" } })` (shared 3.2; the automatic name keeps `.pdf`).
4. Metadata: set Producer "Mosaic"; set no title, author, or subject. Original metadata is not copied.

## Memory

200-page export: at most one page raster (A4 at 200 DPI ≈ 15 MB RGBA) plus its composite and one mosaic cache at a time; JPEG bytes accumulate in pdf-lib (≈ 0.3-0.8 MB per page, ≈ 160 MB for 200 pages). Within the 1.5 GB budget.

## Risks

- pdf.js worker under Tauri CSP: requires `worker-src 'self' blob:` (set by app-shell S8).
- pdf.js fonts: set `cMapUrl` and `standardFontDataUrl` to bundled assets copied from `pdfjs-dist` so CJK PDFs render correctly offline.
- Coordinate precision: ops are in raster pixels at a fixed scale per page; export uses the same scale, so no coordinate conversion exists.
