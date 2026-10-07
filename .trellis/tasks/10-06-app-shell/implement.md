# Implement: App shell

1. [ ] Scaffold Tauri 2 React-TS project with pnpm; move to repository root; set product name, identifier, window size (S1, S7).
2. [ ] Add Tailwind v4, `@/` alias, shadcn/ui init, lucide-react, zustand, sonner (S2).
3. [ ] Write theme tokens and font stack in `src/styles/globals.css` (S3).
4. [ ] Build `Toolbar`, `Sidebar`, `StatusBar`, `EmptyState` with disabled placeholders and Chinese labels (S4-S6).
5. [ ] Configure capabilities and CSP (S8); register `tauri-plugin-dialog`.
6. [ ] Add scripts, ESLint config, vitest config, one smoke test rendering `App` (S9).
7. [ ] Update `README.md` and the non-Trellis part of `AGENTS.md` (S10).
8. [ ] Run validation; run `pnpm tauri dev` and check light/dark switching by changing the Windows setting.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
pnpm tauri build
```

## Rollback point

The whole task is additive. Revert its commits to return to the empty repository.
