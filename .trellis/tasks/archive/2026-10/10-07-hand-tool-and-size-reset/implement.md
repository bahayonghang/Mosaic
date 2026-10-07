# Implement: Hand tool and size reset

1. [ ] `editorStore.ts`: extend `Tool`; add `defaultSizes(doc)`, use it in `sizesOf`; add `resetSizes(doc)`. Add `src/store/editorStore.test.ts` for `resetSizes` + `sizesOf` defaults.
2. [ ] `useShortcuts.ts`: `H` selects the hand tool.
3. [ ] `Viewport.tsx`: hand pan on left button, hand wheel zoom, explicit rect/brush session choice, cursor classes.
4. [ ] `Toolbar.tsx`: hand toggle item; "恢复默认" button with disabled state (R3).
5. [ ] Manual check of every acceptance criterion in `pnpm tauri dev` (or the browser preview with `src/dev/browserMocks.ts`) with a 4000 x 3000 JPG.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
```

## Review gate

`trellis-check` after step 4. Confirm that `Space+drag`, middle-button drag, and `Ctrl+wheel` still work with the rectangle and brush tools.

## Rollback point

Steps 1-4 are one commit. `git revert` of the commit restores the two-tool toolbar.
