# Error Handling

> How errors are handled in this project.

---

## Commands (established by task `10-06-file-import`, 2026-10-06)

- Every `#[tauri::command]` returns `Result<T, String>`. The error string is shown to the user as is, so it is Chinese and starts with a short cause, for example `"文件无法读取：<io error>"`.
- Blocking filesystem work runs in `tauri::async_runtime::spawn_blocking` inside an `async` command so the UI thread does not stall.
- Raw-body commands (`export_image`, `write_export`) take `tauri::ipc::Request`: the body must be `InvokeBody::Raw`, and paths come from the `x-source` / `x-target` headers as `encodeURIComponent` strings, decoded with `percent-encoding`. An empty `x-target` means "automatic name". They return the written path as a string.
- Export writes encode fully in memory first, then create the file (`create_new(true)` for automatic names, so the existence check and the create are one step). A failed write removes the partial file. Save as refuses a target whose canonical path equals the source: `"不能覆盖原文件"`. Other export errors start with `"导出失败："`.
- Partial failures are counted, not raised: `scan_paths` returns `ignored` (unsupported or missing files) and `skippedDirs` (unreadable entries); the frontend reports them in the import toast.
