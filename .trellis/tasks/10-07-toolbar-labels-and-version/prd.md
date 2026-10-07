# Toolbar labels and version 0.2.0

Parent: `10-07-v0-2-0` (source requirements 0 and 4, decision V1, cross-child X1/X2/X6).
Depends on: `10-07-workspace-reset`, `10-07-settings-and-about`, `10-07-sidebar-folder-tree` committed. This child measures the final toolbar and sets the release version.

## Goal

The user finds undo and redo at a glance, the toolbar fits the default window, and the app reports version 0.2.0.

## Requirements

### Undo and redo labels (V1)

- L1. The undo and redo buttons show icon plus text: "撤销" and "重做", with the same button style as "打开文件". Tooltips and shortcuts (`Ctrl+Z`, `Ctrl+Shift+Z`) stay.
- L2. Disabled state stays as it is (no ops / no redo on the current page). The disabled text must stay readable against `bg-chrome` (current `disabled:opacity-50` of `Button`); do not change the shared `Button` primitive.
- L3. Undo scope does not change: mosaic ops of the current page only.

### Toolbar width (X1, X2)

- L4. At 1280 x 800 (default window) with a ready image document and the brush tool (the widest toolbar state), no item is clipped: header `scrollWidth <= clientWidth`, and every button is fully visible.
- L5. If L4 fails after L1, the text of "打开文件" and "打开文件夹" hides below a header width (Tailwind container query on the header); the icon, `aria-label`, and tooltip stay. The breakpoint is the measured width at which the full toolbar fits, plus 8 px. No other item changes.
- L6. Measure and record (in this task's `implement.md` result notes) the header `scrollWidth` at 900 px for the same state. No layout change for 900 px (parent out of scope).

### Version 0.2.0

- L7. Version `0.2.0` in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and the `mosaic` package entry of `src-tauri/Cargo.lock` (updated by `cargo`, not by hand).
- L8. README: the feature list gets the reset button, the export suffix setting with the default `_打码版`, the folder tree, and settings/about. The shortcut table does not change.

## Acceptance Criteria

- [ ] L1/L2: open a JPG: the toolbar shows "撤销" and "重做" disabled; draw a rect: "撤销" is enabled; undo: "重做" is enabled.
- [ ] L4: browser preview at 1280 x 800 (`resize_window`), image document, brush tool: `document.querySelector("header").scrollWidth <= clientWidth`; screenshot attached to the check result.
- [ ] L5 (only if applied): at 1280 the condition of L4 holds; at 1600 the open buttons show text.
- [ ] L6: the 900 px `scrollWidth` value is recorded.
- [ ] L7: `grep -rn "0\.1\.0"` in the four files returns nothing; `cargo metadata` reports `mosaic 0.2.0`; the about dialog shows `版本 0.2.0` in `pnpm tauri dev`.
- [ ] X6: `pnpm tauri build` writes `Mosaic_0.2.0_x64-setup.exe` and `Mosaic_0.2.0_x64_en-US.msi` (names from the Tauri bundler) under `src-tauri/target/release/bundle/`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test`, `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` pass.

## Out of Scope

- Git tag, GitHub release, changelog file.
- Rotation in undo history.
- Toolbar layout changes for 900 px.
