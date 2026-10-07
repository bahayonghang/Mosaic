# Design: PDF page mosaic and export

Shared contracts: `../10-06-mosaic-mvp/design.md` 3.2-3.4. Mechanism follows CoverUP (`ref/CoverUP/coverup/document_loader.py:22`, `ref/CoverUP/coverup/main.py:363-410`).

## Modules

```
src/features/pdf/
  pageGeometry.ts  pageGeometry(view, rotate) -> point size (rotation applied), scale = min(200/72, 8192 / max side), raster size
  pdfLoader.ts     loadPdf(docId, bytes) -> PageState[]; the PDFDocumentProxy stays in a Map by docId (getPdf, releasePdf)
                   pdfjs-dist with its worker bundled via Vite `?url`
  pageCache.ts     rasterize(pdf, i) -> ImageBitmap; renderPage(pdf, docId, i) adds an LRU of 3; evicted bitmaps are close()d
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
3. `pdf.save({ useObjectStreams: true })` -> `invoke("write_export", chunk, { headers: { "x-source", "x-target", "x-offset" } })` in 8 MB chunks (shared 3.2; the automatic name keeps `.pdf`).
4. Metadata: set Producer "Mosaic"; set no title, author, or subject. Original metadata is not copied.

## Memory

200-page export: at most one page raster (A4 at 200 DPI ≈ 15 MB RGBA) plus its composite and one mosaic cache at a time; JPEG bytes accumulate in pdf-lib (≈ 0.3-0.8 MB per page, ≈ 160 MB for 200 pages). Within the 1.5 GB budget.

## Risks

- pdf.js worker under Tauri CSP: requires `worker-src 'self' blob:` (set by app-shell S8).
- pdf.js fonts: set `cMapUrl` and `standardFontDataUrl` to bundled assets copied from `pdfjs-dist` so CJK PDFs render correctly offline.
- Coordinate precision: ops are in raster pixels at a fixed scale per page; export uses the same scale, so no coordinate conversion exists.

## Implementation notes

- pdf.js 6: `isEvalSupported` no longer exists; `PDFDocumentProxy` has no `destroy`, so `releasePdf` calls `loadingTask.destroy()`. Password errors are detected by `e.name === "PasswordException"` (verified with a pypdf-encrypted file).
- Assets: in dev, cMaps, standard fonts, ICC profiles, and wasm decoders load from `/node_modules/pdfjs-dist/`; the `pdfjsAssets` plugin in `vite.config.ts` copies them to `dist/pdfjs/` for builds. The CSP `connect-src` includes `'self'` so pdf.js can fetch them.
- Export memory, measured on a 200-page A4 PDF (whole process tree, private bytes): the first version reached 2.0-2.9 GB. Two causes were measured and fixed. (1) A GPU-backed `OffscreenCanvas` per page kept 16 MB until GC; `renderComposite` now uses a CPU canvas (`willReadFrequently`). (2) WebView2 held about 15 times the 78 MB request body; `write_export` now takes 8 MB chunks. After both fixes: peak 893 MB with page 1 mosaicked, 1,022 MB with every page mosaicked; the event loop lag stayed below 50 ms; 200 pages export in about 7 s.
- Output size: about 390 KB per text page at JPEG quality 0.9 (78 MB for 200 pages).
