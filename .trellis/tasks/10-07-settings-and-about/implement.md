# Implement: Settings and about

Precondition: `10-07-workspace-reset` is committed.

1. [x] `src/lib/exportName.ts` + `exportName.test.ts`: `DEFAULT_EXPORT_SUFFIX`, `suffixError`. Tests for every rule in PRD S5, trimming, and the default being valid.
2. [x] `src/store/settingsStore.ts` (+ test): persisted `exportSuffix`; invalid stored value falls back to the default.
3. [x] Rust `export.rs`: `valid_suffix`, `target_name(source, suffix, n)`, `create_unique`, `write_to`, header `x-suffix` in `export_image` and `write_export`. Update the existing tests to the new signature; add tests for a custom suffix, the default `_打码版`, collision numbering, and the rejected invalid suffix (no file created).
4. [x] `exportImage.ts`, `exportPdf.ts`: send `x-suffix`. `exportActions.ts`: "另存为…" default name with the suffix.
5. [x] `src/dev/browserMocks.ts`: mocked export path uses `x-suffix`; mock `plugin:app|version`.
6. [x] `pnpm dlx shadcn@latest add dialog input label`; review the generated files against the component guidelines.
7. [x] `SettingsDialog.tsx`, `AboutDialog.tsx`, `SettingsMenu.tsx` in `src/features/settings/`; add `SettingsMenu` at the right end of `Toolbar.tsx`.
8. [x] Opener plugin: `cargo add tauri-plugin-opener` in `src-tauri`, `pnpm add @tauri-apps/plugin-opener`, register the plugin, scoped capability per design 4.
9. [x] Browser preview: dialogs, validation text, example line, keyboard (`Enter`, `Esc`), editor shortcuts blocked while open.
10. [ ] `pnpm tauri dev`: two exports with the default suffix, a custom suffix after restart, "全部导出" with a PDF, "另存为…" default name, the link opens the system browser.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Review gate

`trellis-check` after step 8. Check: no export path builds a name without the suffix (grep `_mosaic` returns no hit in `src/` and `src-tauri/src/`); the capability does not allow other URLs; the generated shadcn files contain no `transition-all`.

## Rollback points

- Steps 1-2 can be committed alone (nothing reads the store yet).
- Steps 3-5 must be in one commit: the Rust header contract and its callers change together.
- Steps 6-8 (UI and opener) can be a second commit.

## Result notes

- Step 10 (`pnpm tauri dev` manual checks) is open: see the check results in `prd.md`.
- The shadcn CLI added an unused npm package `cn` and generated `import { cn } from "cn"`; both were replaced (`@/lib/utils`, `pnpm remove cn`). Recorded in the component guidelines.
