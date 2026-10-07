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

## Editor and export (established by task `10-06-image-mosaic-editor`, 2026-10-06)

```
src/features/editor/
  mosaicEngine.ts        pure math: blockMean, snapRect, strokeBounds, defaultBlock, defaultRadius, slider limits
  mosaic.worker.ts       blockMean for pages > 4 MP
  pageRenderer.ts        PageRenderer (composite of one page), opsDelta, renderComposite, active renderer registry
  tools/                 rectTool, brushTool: one press-to-release gesture -> one MosaicOp
  Viewport.tsx           visible canvas, zoom/pan transform, pointer gestures, preview rect and brush cursor
  useShortcuts.ts        editor keys (Ctrl+O stays in features/import)
src/features/export/
  exporters.ts           registry Record<DocKind, Exporter>; the PDF task registers `pdf`
  exportImage.ts         composite -> PNG -> invoke("export_image")
  exportActions.ts       exportCurrent, saveAsCurrent, exportAll (toasts, exportedVersion)
  useCloseGuard.ts, CloseGuard.tsx   close confirmation (E15)
src/store/editorStore.ts tool, per-document block and brush sizes, zoom, ViewApi
```

## Workspace (established by task `10-07-workspace-reset`, 2026-10-07)

```
src/features/workspace/
  resetWorkspace.ts      release all documents, clear docStore, reset editorStore
  ResetButton.tsx        toolbar reset button + confirmation AlertDialog
```

## Settings (established by task `10-07-settings-and-about`, 2026-10-07)

```
src/features/settings/
  SettingsMenu.tsx       toolbar gear + dropdown; owns the open state of both dialogs
  SettingsDialog.tsx     export suffix field, live example, validation
  AboutDialog.tsx        name, version (`getVersion`), description, repository link (opener plugin)
src/lib/exportName.ts    DEFAULT_EXPORT_SUFFIX, suffixError, suffixedName (shared with Rust rule)
src/store/settingsStore.ts  persisted user settings
```

## Sidebar (established by task `10-07-sidebar-folder-tree`, 2026-10-07)

```
src/features/sidebar/
  buildTree.ts           folder tree of the open documents, ancestorKeys
```

## Rules

- Import with the `@/` alias (maps to `src/`), not deep relative paths across folders.
- Tests sit next to the file they test: `Foo.tsx` -> `Foo.test.tsx`.
- `src/lib/constants.ts` `SUPPORTED_EXTENSIONS` must match the Rust list in `src-tauri/src/commands/files.rs`.
