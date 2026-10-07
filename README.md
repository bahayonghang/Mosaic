# Mosaic

Mosaic 用来快速给图片打码，包括 JPG 和其他常见图片格式，也包括 PDF。

技术栈：Tauri 2 + React + TypeScript + Vite，样式用 Tailwind CSS v4 + shadcn/ui，包管理器用 pnpm。前端代码在 `src/`，Rust 代码在 `src-tauri/`。

开发和构建命令：

```bash
pnpm install
pnpm tauri dev
pnpm typecheck && pnpm lint && pnpm test
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
pnpm tauri build
```

开发服务器端口是 5180。本机 Windows 保留了 1190-2621 端口段，Tauri 模板默认的 1420 无法绑定。
