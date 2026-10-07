# State Management

> How state is managed in this project.

---

## Document store (established by task `10-06-file-import`, 2026-10-06)

- `src/store/docStore.ts` is a zustand store: `docs`, `currentId`, `addDocs`, `select`, `remove`, `update`.
- Document identity: `docIdOf(path)` = path with `/` replaced by `\` and lowercased (Windows paths are case-insensitive). Never compare raw paths.
- The store holds only serializable data (`MosaicDoc` from `src/store/types.ts`). Decoded `ImageBitmap`s live in a module-level LRU cache in `src/features/import/loadDocument.ts` (current document + 2 most recent). A document with `status: "ready"` may have no cached bitmap; `needsLoad(doc)` decides when to reload. Ops stay in the store across reloads.
- Derived flags are plain functions over a doc: `hasOps(doc)`, `isUnexported(doc)` (`hasOps && version !== exportedVersion`).
- Read with selectors (`useDocStore((s) => s.docs.length)`) to limit re-renders; use `useDocStore.getState()` in non-React code.

## Ops and rendering (established by task `10-06-image-mosaic-editor`, 2026-10-06)

- Op changes go through `pushOp`, `undo`, `redo` in `docStore.ts`. Each acts on the current page and increments `doc.version`; a new op clears `redo`. `markExported(id, version)` takes the version captured before the export started, so an edit made during an export keeps the document marked.
- The store is the single source of truth for ops. `PageRenderer.sync(ops)` compares the ops it already drew with the store ops by object identity (`opsDelta`): a prefix match draws only the new ops; anything else (undo, changed history) replays all ops from the base bitmap. Never mutate an op object after it enters the store.
- All composite drawing runs through one promise queue per renderer, so a replay after undo and live brush painting cannot interleave. Live brush segments draw directly; `endStroke()` marks the composite stale so the stroke op that follows replays all ops. This keeps the shown, exported, and undo/redo-replayed pixels identical.
- `src/store/editorStore.ts` holds UI state that is not part of a document: `tool`, block and brush sizes per document id (absent = defaults from the page size via `sizesOf`), the viewport `zoom`, and `view` (zoom commands the status bar and shortcuts call). The viewport transform itself stays in a ref inside `Viewport.tsx`.
- `tool` is `"rect" | "brush" | "hand"` (shortcuts `R`, `B`, `H`). Only `"rect"` and `"brush"` start a `ToolSession`; `Viewport` checks both values explicitly, so a new tool never falls through to the brush. The hand tool pans on left drag and zooms on the plain wheel; `Space+drag` and middle-button drag pan with every tool (task `10-07-hand-tool-and-size-reset`).
- Restoring default sizes deletes `sizes[doc.id]` (`resetSizes`); `defaultSizes(doc)` is the only place that computes the defaults, used by `sizesOf` and the toolbar "恢复默认" disabled state.

## Image rotation (established by task `10-07-image-rotation`, 2026-10-07)

- `MosaicDoc.rotation?: 0 | 90 | 180 | 270` (clockwise, image documents only, absent = 0). `rotate(docId, 1 | -1)` changes it and increments `version`; it is not in undo/redo history and does nothing for a PDF.
- Ops, `PageState.width/height`, `PageRenderer`, and the mosaic copies stay in unrotated source raster coordinates. Only `Viewport` (draw matrix, `toImage`, rect preview, fit/clamp size), the status bar size label, and `exportImage` (rotates the composite on a CPU canvas before PNG encoding) apply the rotation. The math lives in `src/features/editor/rotation.ts`.
- `hasEdits(doc)` = ops or a non-zero rotation; it decides "can export", "export all", and `isUnexported`. `hasOps` means mosaic ops only.

## Workspace reset (established by task `10-07-workspace-reset`, 2026-10-07)

- `docStore.clear()` empties `docs` and sets `currentId` to null. It does not release caches: `resetWorkspace()` in `src/features/workspace/resetWorkspace.ts` calls `releaseDocument(id)` for every doc first, then `clear()`, then `editorStore.reset()` (`tool: "rect"`, `sizes: {}`, `zoom: null`; `view` is cleared by the unmounting `Viewport`).
- `editorStore.exporting` mirrors the module-level `busy` guard of `exportActions.exclusive()`. UI that must not run during an export (the reset button) reads this flag; the guard itself stays the module variable.

## Settings (established by task `10-07-settings-and-about`, 2026-10-07)

- `src/store/settingsStore.ts` holds user settings with the zustand `persist` middleware in `localStorage` key `mosaic.settings` (`version: 1`). Only `exportSuffix` exists; default `DEFAULT_EXPORT_SUFFIX` (`_打码版`) from `src/lib/exportName.ts`.
- The store only holds valid, trimmed values: `setExportSuffix` ignores a value that fails `suffixError`, and `merge` replaces an invalid stored value with the default.
- Exporters read `useSettingsStore.getState().exportSuffix` once per document export. The browser preview (`localhost:5180`) and the Tauri window keep separate `localStorage`.
- Whether the settings page is open is `useState` in `App`, not this store. The unsaved suffix is component state on `SettingsPage` and is dropped when the page unmounts.

## Folder tree (established by task `10-07-sidebar-folder-tree`, 2026-10-07)

- `scan_paths` returns `root` (the imported folder as given) and `dirs` (folder names from `root` to the parent, from Rust `strip_prefix`) for files found in a folder; explicit files have neither. `addDocs` copies them into `MosaicDoc.root` / `MosaicDoc.dirs`; they never change, and a duplicate import keeps the first entry's values.
- `buildTree(docs)` in `src/features/sidebar/buildTree.ts` derives the sidebar tree on every render (`useMemo` over `docs`). Folder keys are `docIdOf(root)` plus lowercased folder names joined by `\`; `ancestorKeys(doc)` gives them outermost first. Folders exist only through documents, so removing the last file removes the folder.
- Collapse state is a `Set` of folder keys in `Sidebar` component state, not in a store. A selection change expands the ancestors of the new current document; this is a state adjustment during render (not an effect), so the user can still collapse the folder of the current file.
- The sidebar header (to the right of the file count) has 展开所有文件夹 and 收缩所有文件夹. Expand clears the set. Collapse replaces it with `folderKeys(tree)` from `buildTree.ts`. Each button is disabled when it would not change which current folders are collapsed, including when the tree has no folders. Collapse all does not reopen the current file's folders; that still happens only on a selection change.
