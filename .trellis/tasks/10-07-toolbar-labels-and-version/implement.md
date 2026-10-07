# Implement: Toolbar labels and version 0.2.0

Lightweight task: PRD plus this plan; no `design.md`.

Precondition: the other three children of `10-07-v0-2-0` are committed.

1. [ ] `Toolbar.tsx`: undo/redo buttons `size="sm"` with text "撤销" / "重做" (same pattern as the open buttons).
2. [ ] Browser preview (`pnpm dev`, port 5180) at 1280 x 800: load an image, select the brush tool, read `header.scrollWidth` and `clientWidth`. Repeat at 900 x 800 and record the value below.
3. [ ] Only if step 2 fails at 1280: container query on the header per PRD L5; measure again.
4. [ ] Version: edit `package.json`, `tauri.conf.json`, `Cargo.toml`; run `cargo update -p mosaic --manifest-path src-tauri/Cargo.toml` (or any `cargo check`) to update `Cargo.lock`.
5. [ ] README feature list per PRD L8.
6. [ ] `pnpm tauri dev`: about dialog shows `版本 0.2.0`.
7. [ ] `pnpm tauri build`; list `src-tauri/target/release/bundle/nsis` and `msi`.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
pnpm tauri build
```

## Review gate

`trellis-check` after step 5, then the parent cross-child criteria X1-X6 in `10-07-v0-2-0/prd.md`.

## Rollback points

- Steps 1-3: one commit (UI).
- Steps 4-5: one commit (`chore(release): 0.2.0`).

## Result notes

- 1280 x 800 header `scrollWidth` / `clientWidth`: (fill in)
- 900 x 800 header `scrollWidth` / `clientWidth`: (fill in)
