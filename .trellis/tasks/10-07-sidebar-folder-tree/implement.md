# Implement: Sidebar folder tree

Precondition: `10-07-workspace-reset` is committed. Independent of `10-07-settings-and-about`.

1. [x] Rust `files.rs`: `root` and `dirs` in `ScannedFile`; set them in `scan_dir` from `strip_prefix`; explicit files leave them `None`. Tests: nested folders, explicit file without fields, explicit file inside a scanned folder keeps no root, drive-root style prefix (use the temp dir as root and check components).
2. [x] `types.ts`, `docStore.ts` (`NewDoc`, `addDocs`), `importActions.ts` (`ScanResult`): pass `root`/`dirs`. Test in `docStore.test.ts` that the fields are copied and a duplicate keeps the first entry's fields.
3. [x] `src/features/sidebar/buildTree.ts` + `buildTree.test.ts` per design 3.
4. [x] `Sidebar.tsx`: recursive render, `FolderRow`, `depth` on `DocRow`, collapse state, ancestor expand effect.
5. [x] Browser preview check with injected docs (design 2): layout, indentation, collapse, counts, marker, remove, F8.
6. [ ] `pnpm tauri dev` check with a real nested folder (PRD acceptance F1-F10) and a 500-file folder for scroll speed.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Review gate

`trellis-check` after step 4. Check the remove dialog and the edited marker still work on nested rows, and that the long-name truncation still works at depth 4.

## Rollback point

One commit (Rust field + frontend). See design 5 for a frontend-only revert.
