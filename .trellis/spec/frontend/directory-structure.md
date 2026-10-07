# Directory Structure

> How frontend code is organized in this project.

---

## Layout (established by task `10-06-app-shell`, 2026-10-06)

```
src/
  main.tsx, App.tsx       entry and top-level layout
  components/ui/          shadcn/ui generated primitives (do not hand-restyle; see component-guidelines)
  components/layout/      app chrome: Toolbar, Sidebar, StatusBar, EmptyState, PixelMark, Kbd
  features/<feature>/     feature logic: import/, editor/, export/, pdf/
  store/                  zustand stores (`docStore.ts`) and the shared document model (`types.ts`)
  lib/                    constants.ts (supported extensions), utils.ts (`cn`)
  styles/globals.css      Tailwind entry and theme tokens
  test/setup.ts           vitest setup (jest-dom matchers, jsdom stubs)
```

## Rules

- Import with the `@/` alias (maps to `src/`), not deep relative paths across folders.
- Tests sit next to the file they test: `Foo.tsx` -> `Foo.test.tsx`.
- `src/lib/constants.ts` `SUPPORTED_EXTENSIONS` must match the Rust list in `src-tauri/src/commands/files.rs`.
