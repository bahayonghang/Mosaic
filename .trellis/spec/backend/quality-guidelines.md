# Quality Guidelines

> Code quality standards for backend development.

---

## Commands (established by task `10-06-app-shell`, 2026-10-06)

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build   # produces NSIS and MSI installers under src-tauri/target/release/bundle/
```

Clippy warnings are errors. Pure functions (path naming, directory scanning) get `#[cfg(test)]` unit tests in the same file.
