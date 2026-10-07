# Design: App shell

Shared contracts: `../10-06-mosaic-mvp/design.md`.

## Directory layout

```
src/
  main.tsx, App.tsx
  components/ui/        shadcn/ui generated primitives
  components/layout/    Toolbar.tsx, Sidebar.tsx, StatusBar.tsx, EmptyState.tsx
  features/             import/, editor/, export/, pdf/  (filled by later children)
  store/                zustand stores (filled by later children)
  lib/                  constants.ts (SUPPORTED_EXTENSIONS), utils.ts (cn)
  styles/globals.css    Tailwind entry + theme tokens
src-tauri/
  src/main.rs, src/lib.rs   builder, plugin registration, command registration
  src/commands/             mod.rs (empty module list; later children add files)
  capabilities/default.json
  tauri.conf.json
```

This layout becomes `.trellis/spec/frontend/directory-structure.md` and `.trellis/spec/backend/directory-structure.md` at task finish.

## Scaffold method

`pnpm create tauri-app` with the React + TypeScript template, then move the generated files to the repository root. Keep the template's Vite config; add the Tailwind v4 Vite plugin and the `@/` path alias for shadcn/ui.

## Theme tokens

CSS variables in `src/styles/globals.css` under `:root` (light) and `@media (prefers-color-scheme: dark)` (dark): the shadcn token set plus `--chrome` (toolbar, sidebar, status bar), `--canvas` (area behind the image), and `--signal` / `--signal-foreground` (accent). Signal: vermilion `oklch(0.62 0.19 35)` light, `oklch(0.68 0.17 38)` dark. Neutrals are tinted to hue 60. Tailwind `dark:` variant maps to the same media query. Radius 8 px. Font stack from the parent design. Implementation decision 2026-10-06: vermilion replaces the planned blue because blue is the default accent of most tools; vermilion reads as a redaction stamp.

## Layout component contract

`App.tsx` renders `<Toolbar/>`, then a horizontal resizable group (`Sidebar` | canvas slot), then `<StatusBar/>`. The canvas slot renders `<EmptyState/>` when the document store is empty. Until file-import exists, the store is a stub with `docs: []`.

## Risks

- Tauri template versions can differ from tauri-cli 2.12.1. Pin `@tauri-apps/api` and `tauri` to the same minor version.
- shadcn/ui CLI writes into `src/components/ui`; keep generated files unchanged except for tokens.
