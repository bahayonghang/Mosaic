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
- App commands from `generate_handler!` need no capability entry (no app manifest is defined in `build.rs`). Plugin and core APIs do: current grants are `core:default`, `core:window:allow-destroy` (the close guard; the JS `onCloseRequested` listener also calls `destroy()` when the close is not prevented), `dialog:default`. No shell, no asset protocol, no network.
- `reveal_in_folder` starts `explorer /select,"<path>"` through `std::process::Command::raw_arg` (Windows argument quoting); no shell plugin.
- CSP in `tauri.conf.json` allows `worker-src 'self' blob:` for Web Workers (pdf.js, mosaic worker).
