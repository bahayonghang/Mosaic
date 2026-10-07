# Multi-source file import

Parent: `10-06-mosaic-mvp` (decisions D3, D7; shared design sections 3.1, 3.2 `scan_paths` / `read_file`, 3.3).
Depends on: `10-06-app-shell` archived.

## Goal

The user can bring images and PDFs into the app in four ways and switch between them in a document list.

## Requirements

- I1. "打开文件" button and `Ctrl+O`: system file dialog, multi-select, filter for the extensions in shared design 3.1.
- I2. "打开文件夹" button: system folder dialog; all supported files in the folder and its subfolders are added.
- I3. Drag and drop of one or more files onto the window adds them.
- I4. Drag and drop of one or more folders onto the window adds all supported files in them, recursively. Mixed drops (files and folders) work.
- I5. While a drag is over the window, an overlay shows "松开以导入".
- I6. Unsupported files in a drop or a folder are ignored. After each import, a toast reports "已导入 N 个文件" and, when N > 0 files were ignored, "已忽略 M 个不支持的文件".
- I7. A path that is already open is not added again; the existing document is selected.
- I8. The sidebar lists documents in import order with an icon (image / PDF), the file name, and the edited-not-exported dot. Clicking a row selects the document. Each row has a remove button (×). Removing an edited document asks for confirmation in an inline dialog.
- I9. The first imported document of each import action becomes the current document.
- I10. Selecting a document loads it through `read_file`: images decode to a bitmap (`createImageBitmap`, EXIF orientation applied); PDFs are handed to the pdf loader (implemented by `10-06-pdf-mosaic`; until then PDF rows show "PDF 支持开发中").
- I11. A file that fails to load shows the error in the canvas area and the row shows an error icon. Other documents are not affected.
- I12. Loaded bitmaps of non-current documents may be released; reselecting reloads them. Ops are kept in the store.
- I13. If no supported file is found, a toast says "没有找到支持的文件".

## Acceptance Criteria

- [ ] I1: select 3 files (JPG, PNG, WebP) in one dialog; 3 rows appear; the first is shown.
- [ ] I2: open a folder with `a.jpg`, `sub/b.png`, `notes.txt`; rows `a.jpg` and `b.png` appear; the toast reports 1 ignored file.
- [ ] I3/I4: drop a file and a folder together; all supported files appear.
- [ ] I7: import the same file twice; one row exists.
- [ ] I11: rename a `.txt` to `.jpg` and open it; an error shows for that row only.
- [ ] A phone photo with EXIF rotation displays upright.
- [ ] Folder with 1,000 images imports in under 2 seconds to the list (bitmaps load on selection only).
- [ ] `cargo test` covers `scan_paths`: recursion, extension filter (case-insensitive), de-duplication, unreadable directory skip.

## Out of Scope

- Clipboard paste, "Open with", command-line arguments (D3).
- Thumbnails in the list, sorting options, search.
- HEIC, GIF, TIFF (D7).
