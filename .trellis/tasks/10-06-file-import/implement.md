# Implement: File import

Precondition: `10-06-app-shell` is archived.

1. [ ] Rust: add `walkdir`; write `commands/files.rs` with `scan_paths` and `read_file`; register; add permissions to the capability file.
2. [ ] Rust tests in `files.rs` with `tempfile`: recursion, case-insensitive filter, ignored count, de-duplication, hidden skip.
3. [ ] `docStore` with add/select/remove/status.
4. [ ] `importActions` (dialogs with filters from `SUPPORTED_EXTENSIONS`) and toasts (I1, I2, I6, I13).
5. [ ] `useDragDrop` + overlay (I3-I5).
6. [ ] `loadDocument` + bitmap cache; PDF stub (I10-I12).
7. [ ] Sidebar list with icons, dot, remove + confirm (I8); connect EmptyState buttons and `Ctrl+O`.
8. [ ] vitest: docStore de-duplication (I7), first-of-import selection (I9).
9. [ ] Manual run of every acceptance criterion in `pnpm tauri dev`.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Rollback point

Revert this task's commits; the empty state returns to visual-only buttons.
