# Component Guidelines

> How interface pieces are built in this project.

---

## Styling (established by task `10-06-app-shell`, 2026-10-06)

- Tailwind CSS v4 utility classes only. No CSS Modules, no CSS-in-JS. Global CSS lives only in `src/styles/globals.css`.
- Colors come from theme tokens, never literal values in components: `bg-chrome` (toolbar, sidebar, status bar), `bg-canvas` (behind the image), `bg-signal` / `text-signal` (the only accent: active tool, primary action, edited marker), plus the shadcn tokens (`background`, `foreground`, `muted`, `border`, ...).
- Dark mode follows the OS through `prefers-color-scheme`. The Tailwind `dark:` variant uses the same media query. There is no manual theme switch.
- Icons: `lucide-react` only.
- Font: system stack from `--font-sans` (Segoe UI Variable / Microsoft YaHei UI). No web fonts (the app runs offline).

## shadcn/ui primitives

- Add primitives with `pnpm dlx shadcn@latest add <name>`; they land in `src/components/ui/`.
- Local changes to generated primitives are limited to: `cn` import from `@/lib/utils`, transitions restricted to color/transform (never `transition-all`), press feedback `active:scale-[0.96]`, the `signal` button variant, and the signal color for pressed toggles. Keep any new change in this list.
- The shadcn CLI may write `import { cn } from "cn"` and add an npm package `cn`. Replace the import with `@/lib/utils` and remove the package (`pnpm remove cn`). Answer `n` when it asks to overwrite `button.tsx`.
- Dialog close buttons from shadcn carry the English screen-reader text "Close"; dialogs here pass `showCloseButton={false}` and provide a Chinese "取消" / "关闭" button instead.
- Radix `ScrollArea` wraps its content in a `display: table` div that grows with its widest child, so `truncate` never applies. A scroll area with truncating rows adds `[&_[data-slot=scroll-area-viewport]>div]:block!` (see `Sidebar.tsx`).
- Toolbar width (task `10-07-toolbar-labels-and-version`): the header is a `@container`. Below a content width of 1350 px (window 1374 px) the text of "打开文件" / "打开文件夹" is `sr-only`, so at the default 1280 px window the widest state (image document, brush tool) fits with 0 px to spare. A new toolbar item needs a new measurement of that state and a new breakpoint (container queries measure the content box, not the window).
- `sonner` Toaster uses `theme="system"`; `next-themes` is not used.

## UI text

- All visible text is Chinese. Icon-only buttons need `aria-label` (Chinese) and a `Tooltip`; shortcuts show in a `Kbd`.
- Numbers that change (sizes, zoom, counts) use `tabular-nums`.
