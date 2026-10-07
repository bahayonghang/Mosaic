# Implement: Mosaic MVP (parent)

The parent task has no direct implementation work. It owns ordering and the final integration review.

## Order

1. `10-06-app-shell` — start first. Other children need the scaffold, tokens, and layout slots.
2. `10-06-file-import` and `10-06-image-mosaic-editor` — start after app-shell is archived. They can run in either order. The editor needs a loaded document; until file-import lands, the editor uses the file dialog path from app-shell's empty state or a dev-only fixture loader.
3. `10-06-pdf-mosaic` — start after image-mosaic-editor is archived. It reuses the editor, the mosaic engine, and the export flow.

## Integration Review (after all children are archived)

- [x] Run every parent acceptance criterion AC1-AC7 in `pnpm tauri dev` on Windows. AC1, AC2, and AC7 were checked in the child tasks; AC3-AC6 in the integration review.
- [x] AC2 check: compare size and modified time of the source file before and after export.
- [x] AC3 check: run `pdftotext <name>_mosaic.pdf -` (or select-all in a PDF viewer) and confirm empty output; compare page count and page sizes with the source.
- [x] AC5 check: walk every toolbar, menu, and context menu; list any control outside AC5. No control is outside AC5; the remove button and its confirmation belong to the document list.
- [ ] AC6 check: `pnpm tauri build` and install the produced installer. The build produced the NSIS and MSI installers, and the release exe rendered a CJK PDF from the bundled `pdfjs/` assets. The installer was not installed.
- [x] Update `.trellis/spec/frontend/*` and `.trellis/spec/backend/*` from "Not established" to the conventions the children created (step 3.3).

## Validation Commands (defined by app-shell)

```bash
pnpm typecheck
pnpm lint
pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build
```

## Rollback

`git revert` the commits of the child that failed integration. Children are independent commits; no state migration exists.
