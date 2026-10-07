# Design: Sidebar folder tree

## 1. Scan contract (Rust → frontend)

`ScannedFile` in `src-tauri/src/commands/files.rs` gets two optional fields (serde `camelCase`, skipped when `None`):

| Field  | Type                  | Meaning                                                                                                                                                   |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root` | `Option<String>`      | The imported folder path as the user gave it. `None` for an explicit file.                                                                                |
| `dirs` | `Option<Vec<String>>` | Directory components from `root` to the file's parent, from `Path::strip_prefix(root)`. Empty for a file directly in `root`. `None` for an explicit file. |

Rust computes `dirs` because `strip_prefix` handles drive roots (`D:\`) and separators correctly; string slicing in the frontend would not.

Dedup stays as it is (`seen` by canonical path). An explicit file that also lies inside an imported folder of the same scan keeps the explicit entry (explicit files are pushed first), so it has no `root`.

Shared design 3.2 (`scan_paths`) is extended with these fields; it is backward compatible for readers that ignore them.

## 2. Document model

- `NewDoc` (`docStore.ts`) and `MosaicDoc` (`types.ts`) get `root?: string` and `dirs?: string[]`, copied in `addDocs`. They never change after creation.
- `importActions.ts` passes the fields through (the `ScanResult` type gets them).
- `src/dev/browserMocks.ts` `scan_paths` keeps echoing file paths without `root`; manual tree checks in the browser preview inject docs with `root`/`dirs` through `window.__mosaic.useDocStore.getState().addDocs(...)`.

## 3. Tree builder

Pure function in `src/features/sidebar/buildTree.ts` (unit tested):

```ts
type TreeNode =
  | { type: "file"; doc: MosaicDoc }
  | {
      type: "folder";
      key: string;
      name: string;
      path: string;
      children: TreeNode[];
      count: number;
      unexported: boolean;
    };

function buildTree(docs: MosaicDoc[]): TreeNode[];
```

- Folder `key` = `docIdOf(root)` for a root node, and `docIdOf(root) + "\\" + dirs.slice(0, i + 1).join("\\")` (lowercased) for a subfolder. Keys are stable across renders, so collapse state can be keyed by them.
- Two imports of the same folder share one root node (same key). A root folder imported inside another root folder (for example `D:\a` then `D:\a\b` with new files) is a separate root node: the file keeps the `root` of its first import.
- Order (PRD F4): top level by first appearance in `docs`; inside a folder, folder children before file children, each by first appearance in `docs` (which is scan order).
- `count` = files under the node; `unexported` = any `isUnexported(doc)` under the node.
- Empty folders cannot occur: nodes are built from docs only (PRD F10 holds by construction).

`Sidebar` computes the tree with `useMemo` over `docs`. Cost is O(files x depth) per store change; `docs` changes on every op (`version`), which is acceptable for hundreds of files. If profiling shows a problem, memoize on a key that ignores `version`.

## 4. View

- `Sidebar.tsx` renders the tree recursively. `DocRow` stays; it gets a `depth` prop for the left padding (`pl` from depth, about 12 px per level).
- `FolderRow`: chevron (`ChevronRight`, rotated 90° when open, transform-only transition), `Folder` / `FolderOpen` icon, name (truncate, `title` = full path), count, and the edited marker when collapsed and `unexported`.
- Collapse state: `Set<string>` of collapsed keys in `Sidebar` component state. It is UI state for this view only, so it does not go into a store. Keys of removed folders stay in the set harmlessly; a workspace reset unmounts `Sidebar` and clears it.
- PRD F8: an effect on `currentId` removes the ancestor keys of the current doc from the collapsed set.
- Accessibility: folder row is a `button` with `aria-expanded`; the container keeps the current list semantics.

## 5. Rollback

Revert the commit. The extra scan fields are optional, so reverting only the frontend part also works: the sidebar returns to the flat list and ignores `root`/`dirs`.
