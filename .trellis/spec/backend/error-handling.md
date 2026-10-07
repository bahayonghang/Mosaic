# Error Handling

> How errors are handled in this project.

---

## Commands (established by task `10-06-file-import`, 2026-10-06)

- Every `#[tauri::command]` returns `Result<T, String>`. The error string is shown to the user as is, so it is Chinese and starts with a short cause, for example `"文件无法读取：<io error>"`.
- Blocking filesystem work runs in `tauri::async_runtime::spawn_blocking` inside an `async` command so the UI thread does not stall.
- Partial failures are counted, not raised: `scan_paths` returns `ignored` (unsupported or missing files) and `skippedDirs` (unreadable entries); the frontend reports them in the import toast.
