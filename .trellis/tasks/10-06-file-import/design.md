# Design: File import

Shared contracts: `../10-06-mosaic-mvp/design.md` 3.1-3.3.

## Rust

`src-tauri/src/commands/files.rs`

- `scan_paths(paths: Vec<String>) -> Result<ScanResult, String>`; `ScanResult { files: Vec<ScannedFile>, ignored: u32, skipped_dirs: u32 }`.
  - File path: include when the extension is supported, else `ignored += 1`.
  - Directory path: walk with `walkdir` (follow_links = false). Skip hidden entries (name starts with `.`) and Windows hidden/system attributes. Unreadable entries increment `skipped_dirs`.
  - Result is ordered: explicit file paths first in given order, then directory results sorted by path. De-duplicate by canonical path.
  - Runs on a blocking thread (`tauri::async_runtime::spawn_blocking`) so a large folder does not block the UI.
- `read_file(path: String) -> Result<tauri::ipc::Response, String>`: `std::fs::read`, returns raw bytes.

## Frontend

- `src/features/import/importActions.ts`: `openFilesDialog()`, `openFolderDialog()`, `importPaths(paths)`. All three end in `importPaths` -> `scan_paths` -> `docStore.addDocs(files)` -> toast.
- `src/features/import/useDragDrop.ts`: subscribes to `getCurrentWebview().onDragDropEvent`; `enter`/`over` show the overlay; `drop` calls `importPaths(event.payload.paths)`; `leave` hides it. Tauri native drag-drop stays enabled (default), so paths are available.
- `src/store/docStore.ts` (zustand): `docs`, `currentId`, `addDocs`, `select`, `remove`, `setStatus`. Document shape from shared 3.3.
- `src/features/import/loadDocument.ts`: `read_file` -> `Blob` -> `createImageBitmap(blob, { imageOrientation: "from-image" })` for images; PDF branch calls a `loadPdf` function exported by `features/pdf` (stub returns the "PDF 支持开发中" error until pdf-mosaic).
- Bitmap cache: a `Map<docId, ImageBitmap>` outside the store (bitmaps are not serializable). Keep current document plus the 2 most recently used; `close()` evicted bitmaps.
- Sidebar rows use shadcn `ScrollArea`; remove confirmation uses shadcn `AlertDialog`.

## Edge cases

- Drop events can deliver paths with mixed case extensions: match lowercase.
- `createImageBitmap` fails on a corrupt file: catch, set `status: "error"`, `error: "无法解码此图片"`.
- Very large images above the canvas area limit (268,435,456 px in Chromium): error "图片尺寸过大（上限约 2.68 亿像素）".
