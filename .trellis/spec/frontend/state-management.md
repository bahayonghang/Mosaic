# State Management

> How state is managed in this project.

---

## Document store (established by task `10-06-file-import`, 2026-10-06)

- `src/store/docStore.ts` is a zustand store: `docs`, `currentId`, `addDocs`, `select`, `remove`, `update`.
- Document identity: `docIdOf(path)` = path with `/` replaced by `\` and lowercased (Windows paths are case-insensitive). Never compare raw paths.
- The store holds only serializable data (`MosaicDoc` from `src/store/types.ts`). Decoded `ImageBitmap`s live in a module-level LRU cache in `src/features/import/loadDocument.ts` (current document + 2 most recent). A document with `status: "ready"` may have no cached bitmap; `needsLoad(doc)` decides when to reload. Ops stay in the store across reloads.
- Derived flags are plain functions over a doc: `hasOps(doc)`, `isUnexported(doc)` (`hasOps && version !== exportedVersion`).
- Read with selectors (`useDocStore((s) => s.docs.length)`) to limit re-renders; use `useDocStore.getState()` in non-React code.
