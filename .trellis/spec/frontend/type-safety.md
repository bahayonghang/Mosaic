# Type Safety

> Type safety patterns in this project.

---

## Rules (established by task `10-06-file-import`, 2026-10-06)

- TypeScript strict mode. The shared document model (`MosaicDoc`, `PageState`, `MosaicOp`, `DocKind`) lives in `src/store/types.ts` and mirrors the parent design contract.
- Tauri command results are typed at the call site with `invoke<T>()`; the TypeScript interface must match the Rust `#[serde(rename_all = "camelCase")]` struct (for example `ScanResult` in `importActions.ts` and `commands/files.rs`).
- Raw-byte commands return `ArrayBuffer`; wrap it as `new Uint8Array(buffer)` (type `Uint8Array<ArrayBuffer>`) before passing to `Blob`.
- Unused parameters that a stub must keep are prefixed with `_` (ESLint `argsIgnorePattern: "^_"`).
