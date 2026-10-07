# Mosaic MVP: Tauri image and PDF mosaic app

## Goal

Build a Windows desktop app with Tauri 2. The user opens images or PDFs, selects regions with a rectangle or a brush, and applies mosaic (pixelation) to those regions. The user then exports the result next to the original file. The app does only this. The UI is simple, clean, and modern.

## Source Requirements (user request, 2026-10-06)

- R1. Use Tauri to build an app that applies mosaic to images and PDFs.
- R2. Main function: select a region and paint mosaic over it.
- R3. No complex redaction features.
- R4. Use the two image repositories and the PDF repository under `ref/` as reference only (findings: `research/reference-repos.md`).
- R5. UI is simple, clean, and matches modern design taste.
- R6. Support several import methods.

## Decisions (user, 2026-10-06)

| ID  | Decision                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Frontend: React + TypeScript + Vite.                                                                                                                                                                                    |
| D2  | Selection tools: rectangle and brush. No lasso, no ellipse.                                                                                                                                                             |
| D3  | Import methods: file dialog (multi-select), drag and drop of files, open a whole folder, drag and drop of folders. Folders are scanned recursively. No clipboard paste, no "Open with" / command-line argument.         |
| D4  | PDF export: full rasterization. Every page becomes one image in the output PDF.                                                                                                                                         |
| D5  | Export location: next to the original file with suffix `_mosaic`; on name collision append a number. Also "Save as" for the current file and "Export all" for all edited files. The original file is never overwritten. |
| D6  | Mosaic block size: slider. Default value is computed from the image size. A change applies only to later strokes and rectangles.                                                                                        |
| D7  | Image formats: JPG/JPEG, PNG, WebP, BMP. Export keeps the source format.                                                                                                                                                |
| D8  | UI language: Chinese only. Theme: light and dark, follows the Windows setting.                                                                                                                                          |
| D9 | When the window closes while edited documents are not exported, the app asks for confirmation (user approval, 2026-10-06). |

## Confirmed Facts

- The repository has no application code. `.trellis/spec/` marks every frontend and backend convention as "Not established".
- `ref/` is in `.gitignore`.
- Local toolchain (verified 2026-10-06): node v26.7.0, pnpm 12.9.1, cargo/rustc 1.98.0, tauri-cli 2.12.1.

## Task Map

| Child                       | Deliverable                                                                         | Order                                            |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `10-06-app-shell`           | Tauri + React scaffold, design tokens, light/dark theme, window layout, empty state | 1                                                |
| `10-06-file-import`         | D3 import methods, document list sidebar, file loading                              | 2 (after app-shell)                              |
| `10-06-image-mosaic-editor` | D2/D6 editor, undo/redo, zoom/pan, D5/D7 image export, "Export all"                 | 2 (after app-shell; integrates with file-import) |
| `10-06-pdf-mosaic`          | PDF render, page navigation, per-page mosaic, D4 PDF export                         | 3 (after image-mosaic-editor)                    |

Ordering detail is in each child `prd.md` / `implement.md`.

## Cross-Child Acceptance Criteria

- [ ] AC1. For each import method in D3, a user can open a supported file and see it in the editor.
- [ ] AC2. A user opens a JPG, applies one rectangle mosaic and one brush mosaic, clicks Export, and gets `<name>_mosaic.jpg` next to the original. The original file is unchanged (same byte size and modified time).
- [ ] AC3. A user opens a text PDF, applies mosaic on page 1, and exports. The output `<name>_mosaic.pdf` has the same page count and page sizes. Text extraction on the output (for example `pdftotext`, or select-all in a PDF viewer) returns no text.
- [ ] AC4. In every exported file, pixels inside a mosaic region are block averages; no original pixel inside the region is kept.
- [ ] AC5. The UI contains only: import, rectangle tool, brush tool, block size, brush size, undo, redo, zoom, page navigation (PDF), export, save as, export all, document list, close confirmation.
- [ ] AC6. `pnpm tauri build` produces a Windows installer without errors.
- [ ] AC7. The UI follows the Windows light/dark setting and all visible text is Chinese.

## Out of Scope

- AI face or person detection, OCR, text-search redaction, blur, solid fill, lasso, ellipse, layers panel, annotations, watermarks, screenshots, cloud upload.
- Clipboard paste import, "Open with" file association, command-line file arguments.
- English UI, settings page, output directory setting, compressed PDF export mode.
- Password-protected PDFs: the app shows an error message and does not open them.
- Saving edit sessions; edits are lost when the app closes.
- macOS and Linux packaging (not tested; Windows is the target).

## Deferred Items

- Thumbnails of PDF pages.
