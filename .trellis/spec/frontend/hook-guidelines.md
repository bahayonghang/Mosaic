# Hook Guidelines

> How shared view logic is organized in this project.

---

## Conventions (established by task `10-06-image-mosaic-editor`, 2026-10-06)

- Hooks live in the feature that owns the behavior: `features/import/useDragDrop.ts`, `features/editor/useShortcuts.ts`, `features/export/useCloseGuard.ts`. App-wide hooks are called once in `App.tsx`.
- Global keyboard and window listeners are registered in a `useEffect` with `[]` deps and read current state through `useXStore.getState()`, not through captured props.
- `eslint-plugin-react-hooks` runs the React Compiler rules. They reject `setState` called synchronously inside an effect and assignment to properties of values returned by hooks. Create per-render objects with `useMemo` and subscribe through a method (`renderer.listen(fn)` returns the unsubscribe function) instead of assigning callbacks.
- High-frequency pointer feedback (preview rect, brush cursor) updates DOM styles through refs, not React state, so a pointer move does not re-render the tree.
