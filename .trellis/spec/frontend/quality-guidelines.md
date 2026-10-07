# Quality Guidelines

> Code quality standards for frontend development.

---

## Commands (established by task `10-06-app-shell`, 2026-10-06)

```bash
pnpm typecheck   # tsc --noEmit, strict mode, noUnusedLocals/Parameters
pnpm lint        # eslint: typescript-eslint recommended + react-hooks
pnpm test        # vitest run (jsdom)
```

All three must pass before a task is reported complete.

## Testing

- vitest with `globals: true` and jsdom. `src/test/setup.ts` stubs `matchMedia` and `ResizeObserver` because jsdom lacks them.
- Pure logic (mosaic math, naming, store reducers) gets unit tests. UI behavior that needs Tauri APIs is checked manually in `pnpm tauri dev`.

## Dev server

- Vite runs on port 5180 (HMR 5181). Windows on the development machine reserves TCP 1190-2621 (Hyper-V exclusion ranges), so the template default 1420 fails to bind. Check `netsh interface ipv4 show excludedportrange protocol=tcp` before changing the port.
