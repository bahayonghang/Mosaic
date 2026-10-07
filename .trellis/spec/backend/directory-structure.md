# Directory Structure

> How backend code is organized in this project.

---

## Layout (established by task `10-06-app-shell`, 2026-10-06)

```
src-tauri/
  src/main.rs              binary entry; calls mosaic_lib::run()
  src/lib.rs               Tauri builder: plugins, command registration
  src/commands/mod.rs      one module per feature (files.rs, export.rs, ...)
  capabilities/default.json  permissions for the "main" window
  tauri.conf.json          window, CSP, bundle targets (nsis, msi)
```

## Rules

- Every `#[tauri::command]` lives in `src/commands/<feature>.rs` and is registered in `lib.rs` `generate_handler!`.
- App commands from `generate_handler!` need no capability entry (no app manifest is defined in `build.rs`). Plugin and core APIs do: current grants are `core:default`, `core:window:allow-destroy` (the close guard; the JS `onCloseRequested` listener also calls `destroy()` when the close is not prevented), `dialog:default`, and `opener:allow-open-url` scoped to `https://github.com/bahayonghang/Mosaic*` (about dialog link; task `10-07-settings-and-about`). Keep the opener scope to that URL. No shell, no asset protocol, no network.
- `reveal_in_folder` starts `explorer /select,"<path>"` through `std::process::Command::raw_arg` (Windows argument quoting); no shell plugin.
- CSP in `tauri.conf.json` allows `worker-src 'self' blob:` for Web Workers (pdf.js, mosaic worker).

## Export file names (established by task `10-07-settings-and-about`, 2026-10-07)

- Automatic export name: `<stem><suffix>.<ext>`, then `<stem><suffix>_<n>.<ext>` (n = 2..9999) on a collision. The frontend sends the suffix in the `x-suffix` header (`encodeURIComponent`) of `export_image` and `write_export`; it is used only when `x-target` is empty (and `x-offset` is 0 for `write_export`).
- `valid_suffix` in `export.rs` and `suffixError` in `src/lib/exportName.ts` implement one rule: 1-32 characters, no leading or trailing spaces, none of `\ / : * ? " < > |`, no control characters. Change both together. An invalid or missing suffix fails with `导出失败：文件名后缀无效` before any file is created.
