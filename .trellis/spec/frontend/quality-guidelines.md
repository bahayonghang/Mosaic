# Quality Guidelines

> Code quality standards for frontend development.

---

## Commands (established by task `10-06-app-shell`, 2026-10-06)

```bash
pnpm typecheck   # tsc --noEmit, strict mode, noUnusedLocals/Parameters
pnpm lint        # eslint: typescript-eslint recommended + react-hooks
pnpm test        # vitest run (jsdom)
```

All three must pass before a task is reported complete.

## Testing

- vitest with `globals: true` and jsdom. `src/test/setup.ts` stubs `matchMedia` and `ResizeObserver` because jsdom lacks them.
- Pure logic (mosaic math, naming, store reducers) gets unit tests. UI behavior that needs Tauri APIs is checked manually in `pnpm tauri dev`.

## Dev server

- Vite runs on port 5180 (HMR 5181). Windows on the development machine reserves TCP 1190-2621 (Hyper-V exclusion ranges), so the template default 1420 fails to bind. Check `netsh interface ipv4 show excludedportrange protocol=tcp` before changing the port.

## Browser preview without Tauri

- `src/dev/browserMocks.ts` is loaded only when `import.meta.env.DEV` is true and `window.__TAURI_INTERNALS__` is absent. It mocks the IPC (`read_file` reads through Vite `/@fs/`, `scan_paths` echoes the given paths) and exposes `window.__mosaic.useDocStore` for manual checks. Production builds never include it.
- Tests use `mockWindows("main")` and `mockIPC` from `@tauri-apps/api/mocks` in `src/test/setup.ts`.
- `src/test/setup.ts` also stubs `ImageData`; jsdom has no canvas, so canvas compositing is checked in a browser, not in vitest.
- The browser mock answers `export_image` / `write_export` with `C:\mock\exported<suffix>.png` (suffix from `settingsStore`, because `mockIPC` drops request headers) and stores the request body in `window.__lastExport`. It answers `plugin:app|version` with the `package.json` version and records `plugin:opener|open_url` in `window.__lastOpenUrl`. `window.__mosaic` exposes `useDocStore` and `useSettingsStore`.
- When the preview pane is hidden or covered, the page draws no frames (`requestAnimationFrame` never fires). Radix exit animations then never finish, so a closed dialog or menu stays in the DOM and blocks the next open. Reload the page between dialog checks in that state.
- Vite serves modules changed by HMR with a `?t=` query, also after a page reload. To call app modules from the console, import the URL found in `performance.getEntriesByType("resource")`, otherwise a second module instance with a separate store is created.

## Canvas memory (established by task `10-06-pdf-mosaic`)

- A GPU-backed 2D canvas (the default for `OffscreenCanvas` and `<canvas>`) keeps its pixel memory until garbage collection, also after `width = 0`. Code that creates one canvas per page in a loop grows by one page of RGBA per iteration (16 MB per A4 page at 200 DPI; 100 pages reached 2 GB).
- Canvases created in a loop use `getContext("2d", { willReadFrequently: true })` (CPU-backed) and are resized to 0 after use. `renderComposite` does this; the on-screen `PageRenderer` keeps the GPU canvas.
- `ImageBitmap.close()` releases memory at once.

## End-to-end checks in the real window (established by task `10-06-image-mosaic-editor`)

- Build the debug binary (`cargo build --manifest-path src-tauri/Cargo.toml`) and start it with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` while `pnpm dev` runs. `http://127.0.0.1:9333/json` lists the page; `Runtime.evaluate` over its WebSocket runs JS against the real IPC, and `Page.captureScreenshot` captures the real WebView2 rendering.
- A title-bar close is simulated by posting `WM_CLOSE` to the window handle. JS `getCurrentWindow().close()` needs `core:window:allow-close`, which the app does not grant.
- Write test scripts that contain Windows paths with the Write tool. Bash heredocs turn `\\` into `\` inside the script.
- A second instance with other `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` fails to start while the first one uses the same WebView2 user data folder. Set `WEBVIEW2_USER_DATA_FOLDER` to a separate folder, and build to a separate `CARGO_TARGET_DIR` when the first binary is still locked.
- Memory: sum `PrivateMemorySize64` over `mosaic.exe` and its child processes (WebView2 browser, renderer, GPU) every 100-200 ms. One sample per second misses the short peak while a large IPC body is sent.
