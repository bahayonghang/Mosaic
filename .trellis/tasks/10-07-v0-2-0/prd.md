# v0.2.0: reset, rename rule, folder tree, undo buttons, settings and about

Follows `10-07-editor-toolbar-optimization` (archived). Shared design reference: `.trellis/tasks/archive/2026-10/10-06-mosaic-mvp/design.md` sections 3.2, 3.3, 4.

## Goal

Release version 0.2.0. The user can start over without restarting the app, choose the export file name suffix, see an imported folder as a tree, find undo and redo at a glance, and open settings and an about page.

## Source Requirements (user request, 2026-10-07)

0. Bump the version to 0.2.0.
1. A button returns the app to the initial state after the user has edited some files, so the user can pick new files or folders without restarting. A confirmation dialog is required.
2. A rename rule: exports get the suffix `_打码版` by default; the suffix can be changed in settings.
3. A folder import puts every file flat in the sidebar. The sidebar must show the source folder structure as levels.
4. Undo exists, but the user cannot find the button.
5. A settings page and an about page.

## Decisions (user, 2026-10-07)

| ID  | Decision |
| --- | -------- |
| V1  | Undo/redo: the existing icon-only buttons get text labels ("撤销", "重做"). The undo scope does not change: rotation stays out of undo history (decision T4 of `10-07-editor-toolbar-optimization`). |
| V2  | Folder tree: each imported folder is one top-level node; its subfolders follow the source structure and can be collapsed. Files opened one by one stay at the top level. |
| V3  | Rename rule: only the suffix text is configurable. Default `_打码版`. Name pattern `<stem><suffix>.<ext>`; on a name collision `<stem><suffix>_<n>.<ext>` (n = 2, 3, ...). "导出", "全部导出", and the "另存为…" default name use it. |
| V4  | About shows the name, the version, a one-line description, the author, and the GitHub repository link `https://github.com/bahayonghang/Mosaic`. The link opens in the system browser (adds the Tauri opener plugin). |

## Confirmed Facts (code read, 2026-10-07)

- Undo and redo buttons already exist in `src/components/layout/Toolbar.tsx` as icon-only buttons (`Undo2`, `Redo2`) between "恢复默认" and the rotate buttons. Without ops they are disabled and gray, which the screenshot shows.
- The export name rule is hard-coded: Rust `target_name` in `src-tauri/src/commands/export.rs` writes `<stem>_mosaic.<ext>` / `<stem>_mosaic_<n>.<ext>`; `saveAsCurrent` in `src/features/export/exportActions.ts` builds the default `${stem}_mosaic.${ext}`.
- `scan_paths` (`src-tauri/src/commands/files.rs`) returns a flat list `{path, name, kind, size}` with no information about the imported folder. `Sidebar.tsx` renders `docs` as a flat list.
- There is no settings persistence and no `dialog` / `input` shadcn primitive yet (only `alert-dialog`).
- Version `0.1.0` is in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (and the `mosaic` entry of `src-tauri/Cargo.lock`).
- The screenshot is the default 1280 px wide window at 125 % scaling. With an image document and the rectangle tool, about 200 px of the toolbar are free; the brush tool adds a second slider of about 200 px. New toolbar items can therefore clip at the default width.

## Task Map

| Child | Deliverable | Order |
| ----- | ----------- | ----- |
| `10-07-workspace-reset` | Requirement 1 | 1 |
| `10-07-settings-and-about` | Requirements 2, 5 (V3, V4) | 2 (after child 1: both change `Toolbar.tsx`) |
| `10-07-sidebar-folder-tree` | Requirement 3 (V2) | 3 (after child 1: both change `docStore.ts`) |
| `10-07-toolbar-labels-and-version` | Requirements 0, 4 (V1); toolbar width check | 4 (last: measures the final toolbar and bumps the version) |

## Cross-Child Acceptance Criteria

- [ ] X1. Toolbar order: logo | open file, open folder, reset | rectangle, brush, hand | block size, brush size (brush tool only), restore default | undo, redo | rotate left, rotate right (image documents only) | export | settings menu.
- [ ] X2. At the default window size 1280 x 800 with an image document and the brush tool, no toolbar item is clipped or overlaps another (header `scrollWidth <= clientWidth`).
- [ ] X3. Existing shortcuts keep their behavior. Dialogs (reset, settings, about) block editor shortcuts while open (existing rule in `useShortcuts.ts`).
- [ ] X4. `pnpm typecheck && pnpm lint && pnpm test` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` pass; `cargo test --manifest-path src-tauri/Cargo.toml` passes.
- [ ] X5. All new visible text is Chinese; icon-only buttons have a Chinese `aria-label` and a tooltip.
- [ ] X6. `pnpm tauri build` produces installers named with version 0.2.0, and the about dialog of the built app shows `0.2.0`.

## Out of Scope

- Rotation in undo history.
- Prefix or template file name rules; per-format suffixes.
- Other settings (default tool, default block size, theme, language, export folder).
- Removing a whole folder from the sidebar; drag-and-drop reordering in the tree.
- Toolbar layout at the minimum window width 900 px. From the screenshot, the current toolbar probably does not fit at 900 px with all items shown (inferred, not measured). Child 4 measures the 900 px case and reports it; it does not change the layout for it.
- Update checks, license text, changelog page.
