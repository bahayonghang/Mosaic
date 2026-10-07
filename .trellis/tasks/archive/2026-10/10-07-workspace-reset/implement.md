# Implement: Workspace reset

Lightweight task: PRD plus this plan; no `design.md`.

1. [x] `src/store/docStore.ts`: action `clear()` that sets `docs: []`, `currentId: null`. Release of caches stays outside the store (store holds only serializable data, see `.trellis/spec/frontend/state-management.md`).
2. [x] `src/store/editorStore.ts`: action `reset()` that sets `tool: "rect"`, `sizes: {}`, `zoom: null`. `view` is set to null by the unmounting `Viewport`; do not touch it here.
3. [x] Export busy state: `exportActions.ts` keeps `busy` as a module variable. Add a reactive flag the toolbar can read (for example `exporting` in `editorStore`, set in `exclusive()` before and after the task). Keep the module-level guard semantics unchanged.
4. [x] `src/features/import/resetWorkspace.ts` (or next to `importActions.ts`): `resetWorkspace()` calls `releaseDocument(id)` for every doc, then `useDocStore.getState().clear()`, then `useEditorStore.getState().reset()`.
5. [x] `src/components/layout/ResetButton.tsx` (or inside `Toolbar.tsx`, matching the file's size): button + `AlertDialog` per W1-W3; counts read with `useDocStore` selectors at open time.
6. [x] Tests in `docStore.test.ts` and `editorStore.test.ts`.
7. [x] Browser preview check (`pnpm dev`, port 5180) of W1-W6 using `window.__mosaic.useDocStore` and real files through the mocked `read_file`.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
```

## Review gate

`trellis-check` after step 6. Check that a `Viewport` unmount after `clear()` releases its renderer (`clearActiveRenderer`) and that no `ImageBitmap` stays in the `loadDocument` cache (`bitmaps.size === 0`).

## Rollback point

One commit. Reverting it removes the button and the two store actions.

## Result notes

- Files landed in `src/features/workspace/` (`resetWorkspace.ts`, `ResetButton.tsx`) instead of `features/import/` and `components/layout/`: the reset is neither import nor app chrome. The directory spec records the new folder.
- Browser preview (verified with `javascript_tool`): W1-W7 pass. The preview pane rendered no frames during the check, so the dialog exit animation did not finish there; this is a preview-environment limit, not app behavior.
- Close guard after reset: inferred (not run in Tauri): `useCloseGuard` counts `isUnexported` docs, which is 0 after `clear()`.
