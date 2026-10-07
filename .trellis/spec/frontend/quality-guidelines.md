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
- The browser mock answers `export_image` / `write_export` with a fixed path and stores the request body in `window.__lastExport`.
- Vite serves modules changed by HMR with a `?t=` query, also after a page reload. To call app modules from the console, import the URL found in `performance.getEntriesByType("resource")`, otherwise a second module instance with a separate store is created.

## End-to-end checks in the real window (established by task `10-06-image-mosaic-editor`)

- Build the debug binary (`cargo build --manifest-path src-tauri/Cargo.toml`) and start it with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` while `pnpm dev` runs. `http://127.0.0.1:9333/json` lists the page; `Runtime.evaluate` over its WebSocket runs JS against the real IPC, and `Page.captureScreenshot` captures the real WebView2 rendering.
- A title-bar close is simulated by posting `WM_CLOSE` to the window handle. JS `getCurrentWindow().close()` needs `core:window:allow-close`, which the app does not grant.
- Write test scripts that contain Windows paths with the Write tool. Bash heredocs turn `\\` into `\` inside the script.
