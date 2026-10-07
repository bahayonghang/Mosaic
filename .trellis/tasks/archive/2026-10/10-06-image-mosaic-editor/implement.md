# Implement: Image mosaic editor and export

Precondition: `10-06-app-shell` archived. If `10-06-file-import` is not archived yet, add a dev-only loader that opens one file through the dialog plugin and puts it into a minimal `docStore`; remove the loader when file-import lands.

1. [x] `mosaicEngine.ts` + vitest (block mean on 4 x 4 input, edge cells, snapRect, defaults).
2. [x] `mosaic.worker.ts` and the worker switch at 4 MP.
3. [x] `PageRenderer` (applyOp, rebuild, caches) + vitest replay test using `OffscreenCanvas` mock or node-canvas-free pure ImageData path.
4. [x] `Viewport` with fit, zoom at cursor, pan, cursor overlay (E6, E7).
5. [x] Rect tool and brush tool (E1, E2, E8); live brush painting.
6. [x] `editorStore`; toolbar wiring for tools, sliders, undo/redo (E3-E5); shortcuts.
7. [x] Rust `export.rs`: `unique_target_path` + tests, `export_image`, `write_export`, `reveal_in_folder`; capability permissions.
8. [x] `exporters` registry, `exportImage`, Save as, `exportAll`, toasts, dot clearing (E9-E13).
9. [x] Close guard (E15) + capability permission.
10. [x] Manual run of every acceptance criterion with JPG, PNG, WebP, BMP sources, including a 4000 x 3000 JPG.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Rollback point

Steps 1-6 (editing) and 7-8 (export) can be committed separately. Reverting the export commit leaves a working editor without export.
