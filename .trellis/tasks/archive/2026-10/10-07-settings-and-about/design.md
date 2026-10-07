# Design: Settings and about

## 1. Settings state

- New store `src/store/settingsStore.ts`: zustand store with `exportSuffix: string` and `setExportSuffix(value)`, wrapped in the zustand `persist` middleware (part of `zustand`, no new dependency) with `localStorage` key `mosaic.settings` and a `version` number for later migrations.
- Constant `DEFAULT_EXPORT_SUFFIX = "_打码版"` and the validator `suffixError(value): string | null` live in `src/lib/exportName.ts` (pure functions, unit tested). `null` means valid; otherwise the Chinese reason from PRD S10. The store only accepts trimmed values that pass the validator.
- Read in non-React code with `useSettingsStore.getState().exportSuffix`.
- A stored value that fails the validator (hand-edited storage) falls back to the default on load (`merge` / `onRehydrateStorage` of `persist`).

Why `localStorage`: one string value, no file format to own, and WebView2 keeps `localStorage` per app identifier on disk. The Tauri store plugin would add a Rust plugin, a JS package, and a capability for the same result. Rollback: delete the key; the default applies.

Dev note: the browser preview (`http://localhost:5180`) and the Tauri window have separate `localStorage`. This only affects manual checks.

## 2. Export name contract (frontend ↔ Rust)

Shared design 3.2 lists the Tauri commands. Change for `export_image` and `write_export`:

| Header | Value | Rule |
| ------ | ----- | ---- |
| `x-suffix` | `encodeURIComponent(suffix)` | Required when `x-target` is empty and (for `write_export`) `x-offset` is 0. Ignored otherwise. |

Rust (`src-tauri/src/commands/export.rs`):

- `target_name(source, suffix, n)`: n = 1 → `<stem><suffix><.ext>`, else `<stem><suffix>_<n><.ext>`.
- `create_unique(source, suffix)` passes the suffix through; the `create_new` loop stays.
- `valid_suffix(&str) -> bool` with the same rule as PRD S5. An invalid or missing suffix on an automatic export returns `Err("导出失败：文件名后缀无效")` before any file is created.
- `write_to(source, target, suffix, bytes)`: `suffix` is used only when `target` is `None`.

Frontend:

- `exportImage.ts` and `exportPdf.ts` add `x-suffix` from `useSettingsStore.getState().exportSuffix`. The suffix is read once per document export, so all chunks of one PDF use one value.
- `saveAsCurrent` builds `defaultPath` as `${dir}${stem}${suffix}.${ext}`.
- `src/dev/browserMocks.ts`: the mocked export result path uses the suffix from the request headers, so the toast shows the expected name in the browser preview.

## 3. Dialog components

- Add shadcn primitives `dialog`, `input`, and `label` with `pnpm dlx shadcn@latest add dialog input label`, then apply only the local changes allowed by `.trellis/spec/frontend/component-guidelines.md`.
- `src/features/settings/SettingsDialog.tsx`: controlled `open`; local draft state initialized from the store on open; validator result drives the error text and the disabled "保存".
- `src/features/settings/AboutDialog.tsx`: version from `getVersion()` (`@tauri-apps/api/app`, permission `core:app:allow-version`, included in `core:default`). Browser mock: answer `plugin:app|version` with the `package.json` version.
- `src/features/settings/SettingsMenu.tsx`: the toolbar gear button + `DropdownMenu`; it owns the `open` state of both dialogs. Opening a dialog from a dropdown item: open it in `onSelect` after the menu closes (Radix focus handoff), for example with `onSelect={() => setOpen("settings")}` and the dialogs rendered outside `DropdownMenuContent`.

`useShortcuts` already returns early while `[role=dialog]` exists, so editor keys do not fire while typing the suffix.

## 4. External link

- Add `tauri-plugin-opener` (Rust) and `@tauri-apps/plugin-opener` (JS); register `.plugin(tauri_plugin_opener::init())` in `src-tauri/src/lib.rs`.
- Capability `src-tauri/capabilities/default.json`: add `opener:allow-open-url` scoped to `https://github.com/bahayonghang/Mosaic*` only (not the plugin default scope for all http/https URLs).
- The link is a `button` styled as a link that calls `openUrl(...)`; an error shows a toast with the message. No `<a href>` so the webview never navigates.
- CSP in `tauri.conf.json` does not change: `openUrl` goes through IPC, not a webview request.

## 5. Compatibility

- Export naming changes from `_mosaic` to `_打码版` for every user. This is the requested behavior (V3). Earlier `_mosaic` files are not touched and do not count as collisions for the new name.
- No migration of stored settings exists yet; `version: 1` in `persist` reserves it.

## 6. Rollback

- Revert the commit: Rust returns to `_mosaic` and the frontend stops sending `x-suffix` (both revert in the same commit). The `mosaic.settings` key stays unused in `localStorage`.
