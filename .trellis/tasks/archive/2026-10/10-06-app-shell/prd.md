# App shell and UI foundation

Parent: `10-06-mosaic-mvp` (decisions D1, D8; shared design `../10-06-mosaic-mvp/design.md` sections 1, 4, 5).

## Goal

Create the Tauri 2 + React + TypeScript project, the visual foundation, and the empty window layout. Later children fill the layout slots.

## Requirements

- S1. Scaffold Tauri 2 with React + TypeScript + Vite and pnpm at the repository root (`src/` frontend, `src-tauri/` Rust).
- S2. Install and configure Tailwind CSS v4, shadcn/ui, lucide-react, zustand, sonner, vitest.
- S3. Design tokens as CSS variables for light and dark themes. Theme follows `prefers-color-scheme` (Windows setting). No manual theme switch.
- S4. Layout from parent design section 4: toolbar row, collapsible resizable sidebar slot, canvas slot, status bar row. The sidebar is hidden when no document is open.
- S5. Empty state in the canvas slot: a drop-zone panel with the text "拖入图片、PDF 或文件夹", the supported formats line "支持 JPG、PNG、WebP、BMP、PDF", and two buttons "打开文件" and "打开文件夹". The buttons are visual only in this task; file-import connects them.
- S6. Toolbar controls exist as disabled placeholders: rectangle, brush, block size slider, brush size slider, undo, redo, export split button. Labels and tooltips are Chinese.
- S7. Window: title "Mosaic", default size 1280 x 800, minimum size 900 x 600. App identifier `com.mosaic.desktop`.
- S8. Tauri capabilities: core defaults and `dialog` plugin only. CSP allows `worker-src 'self' blob:` for later pdf.js and mosaic workers. No asset protocol, no shell, no network.
- S9. Package scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `tauri`.
- S10. Replace the "no application code" sentence in `README.md` and `AGENTS.md` (outside the Trellis block) with the stack and the dev/build commands.

## Acceptance Criteria

- [ ] `pnpm install` and `pnpm tauri dev` open a window titled "Mosaic" at 1280 x 800 that shows the empty state of S5.
- [ ] Switching Windows between light and dark mode changes the app colors without restart.
- [ ] Every visible label is Chinese.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` (at least one smoke test), and `cargo clippy -- -D warnings` pass.
- [ ] `pnpm tauri build` produces a Windows installer.
- [ ] `src-tauri/capabilities/*.json` grants only core defaults and dialog permissions.

## Out of Scope

- Import logic, editor logic, export logic (other children).
- Custom title bar, settings page, i18n framework, manual theme toggle.
