# Sidebar folder tree

Parent: `10-07-v0-2-0` (source requirement 3, decision V2).
Depends on: `10-07-workspace-reset` committed (both change `docStore.ts`).

## Goal

After a folder import, the sidebar shows the files in the folder structure of the disk, so the user finds a file by its folder and sees which folder a file came from.

## Requirements

- F1. Each folder that the user imports (dialog "打开文件夹" or drag-and-drop of a folder) is one top-level folder node. The node label is the folder name; its tooltip is the full path.
- F2. Under a folder node, subfolders and files follow the source structure. Only folders that contain at least one supported file (directly or deeper) show.
- F3. Files that the user opens one by one (dialog "打开文件", drag-and-drop of files) are top-level file rows with no folder node.
- F4. Top-level order: the import order of first appearance. Inside a folder: subfolders first, then files; both in the scan order (sorted by path, existing Rust rule).
- F5. Every folder node can be collapsed and expanded by a click on the row or with the chevron. Default: expanded. The state lasts until the node leaves the tree.
- F6. Each level indents the rows; file rows keep the current look (icon, name, status, edited marker, remove button).
- F7. A folder row shows the number of files under it (all levels, `tabular-nums`). A collapsed folder row that contains an unexported document shows the edited marker.
- F8. When the current document is inside a collapsed folder (for example after an import selects it), its ancestor folders expand.
- F9. A file that is already in the list keeps its first position. Importing a parent folder of an already imported folder adds only the new files; the earlier files keep their earlier place.
- F10. Removing the last file of a folder removes the empty folder nodes.
- F11. The header count "文件 N" keeps counting files only.

## Acceptance Criteria

- [ ] F1/F2: import a folder `证书` with `a.jpg`, `2024/b.png`, `2024/省赛/c.pdf`, and `notes.txt`: the tree is (indent = level):
  ```
  证书
    2024
      省赛
        c.pdf
      b.png
    a.jpg
  ```
  `notes.txt` is not shown (existing ignore rule).
- [ ] F3: then open `x.png` from another folder with "打开文件": `x.png` is a top-level row after the `证书` node.
- [ ] F5: collapse `2024`: `b.png` and `c.pdf` hide; the row shows the count 2.
- [ ] F7: edit `c.pdf`, collapse `证书`: the `证书` row shows the edited marker.
- [ ] F8: collapse `2024`, select `c.pdf` through a new import of `c.pdf`: `2024` and `省赛` expand.
- [ ] F10: remove `c.pdf`: the `省赛` node disappears.
- [ ] Rust unit test: a folder scan returns, per file, the import root and the relative directory components; an explicit file has neither; a drive root such as `D:\` gives correct relative directories.
- [ ] Unit test (vitest) of the tree builder: grouping, order rules F4, counts F7, empty-folder removal F10.
- [ ] With 500 files in 50 folders the sidebar scrolls without visible delay (manual check in `pnpm tauri dev`).
- [ ] `pnpm typecheck && pnpm lint && pnpm test`, `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`, `cargo test --manifest-path src-tauri/Cargo.toml` pass.

## Out of Scope

- Removing or exporting a whole folder from its row.
- Keyboard navigation in the tree (arrow keys).
- Merging one-child folder chains into one row.
- Folder nodes for files opened one by one.
- Virtualized rendering.
