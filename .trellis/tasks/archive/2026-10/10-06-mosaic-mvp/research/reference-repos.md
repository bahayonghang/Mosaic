# Reference Repositories under `ref/`

Recorded 2026-10-06. `ref/` is git-ignored. The repositories are references only; no code is copied.

## ImagEdit (Python, OpenCV, image redaction)

- Mosaic algorithm (`ref/ImagEdit/imagedit/redaction.py:31-43`): `block_size = max(2, block_size)`; downscale the image to `(w // block_size, h // block_size)` with linear interpolation; upscale back to `(w, h)` with nearest-neighbor. The result is a fully pixelated copy of the image.
- Region application (`redaction.py:59-95`): compute the full mosaic copy, then composite it into the original through a mask (rectangle, polygon, or circle mask builders at `redaction.py:140-167`).
- Tools: rectangle, lasso, brush with adjustable radius. Styles: mosaic, blur, fill. Mosaic uses MVP scope only: rectangle and brush, mosaic style.
- Out of scope for Mosaic: AI face/person detection, layers panel, watermark, blur, fill.

## CoverUP (Python, pypdfium2, fpdf, PDF redaction)

- Import: PDF, PNG, JPG (`ref/CoverUP/coverup/main.py:262-264`).
- PDF render (`ref/CoverUP/coverup/document_loader.py:22-60`): each page is rendered to a raster image with pdfium at a fixed scale; the page size in points is kept.
- PDF export (`ref/CoverUP/coverup/main.py:363-410`): each page image is encoded as JPEG (quality 90 at full resolution, about 200 DPI, in "high" mode) and placed on a new PDF page with the original page size. The output contains no text layer and no hidden layers. This is the "full rasterization" mode chosen for Mosaic.
- Export runs in chunks of 50 pages to limit memory (`main.py:399-410`).

## ksnip (C++/Qt screenshot tool)

- `ref/ksnip/libraries/kImageAnnotator/` is empty (submodule not checked out). Only the feature list in `ref/ksnip/README.md` is available. ksnip offers pixelate and blur annotation tools; no implementation detail is available locally.

## Transferable decisions

1. Mosaic = block average + nearest-neighbor upscale. Keep the block grid aligned to the image origin so that separate regions produce the same cells.
2. PDF output = one JPEG image per page, page size kept in points. This removes all original text and hidden content.
3. Process large PDFs page by page and release each page bitmap after use.
