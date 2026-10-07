# Implement: Editor toolbar optimization (parent)

The parent has no direct code work.

## Order

1. `10-07-hand-tool-and-size-reset`: plan, start, implement, check, commit, archive.
2. `10-07-image-rotation`: start only after child 1 is committed, because both children change the gesture and draw code in `src/features/editor/Viewport.tsx`.

## Integration Review (after both children are archived)

- Run X1-X5 of the parent `prd.md` in `pnpm tauri dev` with one JPG (landscape), one PNG with alpha, and one PDF.
- Update the shortcut table and the UI layout sketch in the frontend spec (`.trellis/spec/frontend/`) if the children did not already record them.

## Validation Commands

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## Rollback

Each child is one or more commits on `main`. Revert the rotation commits first, then the hand tool commits. No data migration and no persisted state exist.
