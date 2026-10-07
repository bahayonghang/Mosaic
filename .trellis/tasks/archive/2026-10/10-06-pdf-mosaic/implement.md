# Implement: PDF page mosaic and export

Precondition: `10-06-image-mosaic-editor` and `10-06-file-import` archived.

1. [x] Add `pdfjs-dist` and `pdf-lib`; bundle the pdf.js worker, cMaps, and standard fonts as Vite assets.
2. [x] `pdfLoader.ts` (P1, P9, P11) and replace the PDF stub in `loadDocument`.
3. [x] `pageCache.ts` with LRU 3 (P10).
4. [x] Editor page switching via `currentPage`; `PageNav` in the status bar; `PageUp` / `PageDown`; per-page marker (P2-P5).
5. [x] `exportPdf.ts` registered in `exporters`; Save as PDF filter; progress toast (P6-P8).
6. [x] vitest: render scale and clamp calculation; point size with rotation 0/90/180/270.
7. [x] Manual run of every acceptance criterion with: a 12-page text PDF, a 200-page PDF, a password-protected PDF, a corrupt PDF, a rotated-page PDF, a CJK PDF.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
pdftotext <output>_mosaic.pdf -
```

`pdftotext` comes from Poppler. If it is not installed, use select-all in a PDF viewer and record the method used.

## Rollback point

Revert this task's commits; PDFs return to the "PDF 支持开发中" stub.
