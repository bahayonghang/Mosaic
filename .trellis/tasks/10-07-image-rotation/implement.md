# Implement: Image rotation

Precondition: `10-07-hand-tool-and-size-reset` is committed.

1. [ ] `src/features/editor/rotation.ts` + `rotation.test.ts`: `rotatedSize`, `rotationMatrix`, `toRotated`, `fromRotated`, `rotateRect`. Tests: round trip for all four rotations; corners of a 400 x 300 image; matrix applied to a point equals `toRotated`.
2. [ ] `types.ts` / `docStore.ts`: `Rotation`, `rotation?`, `rotate`, `hasEdits`, `isUnexported` on `hasEdits`. Tests in `docStore.test.ts` (cycle, version increment, PDF unchanged, edited state without ops, back to 0 clears it).
3. [ ] Replace "can export / is edited" uses of `hasOps` with `hasEdits` (`Toolbar.tsx`, `exportActions.ts`). Grep `hasOps` afterwards and confirm each remaining use means mosaic ops.
4. [ ] `Viewport.tsx`: rotated size in fit/clamp/page rect, rotated draw matrix, `toImage` inverse, `showRect` mapping, refit on rotation change.
5. [ ] `StatusBar.tsx`: rotated size label.
6. [ ] `Toolbar.tsx`: rotate-left and rotate-right buttons for image documents.
7. [ ] `exportImage.ts`: rotated encode on a CPU canvas, released after use.
8. [ ] Manual check of every acceptance criterion in `pnpm tauri dev`. For G12 pixel checks, read the exported file back (for example with a small script using the `image` crate test or Python Pillow if present) and compare corner pixels with the source.

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## Review gate

`trellis-check` after step 7. Check that PDF view, PDF export, and an unrotated image export produce the same output as before (same pixel size; mosaic regions unchanged).

## Rollback points

- Steps 1-2 (pure math + store) can be committed alone; nothing reads `rotation` yet.
- Steps 3-7 are one commit. Reverting it removes the UI and the rotated export and keeps the unused store field.
