# Mosaic 常用命令。在仓库根目录执行 `just` 查看列表。

# Windows 登录 PATH 通常没有 sh.exe（Git 只把 git.exe 放进 PATH）。
# 只覆盖 Windows；macOS 和 Linux 继续用 just 默认的 sh -cu。
[windows]
set shell := ["cmd.exe", "/c"]

# 列出全部命令
default:
    @just --list

# 安装前端依赖
install:
    pnpm install

# 启动桌面应用（Tauri + Vite，端口 5180）
dev:
    pnpm tauri dev

# 只启动前端开发服务器（浏览器预览，无 Tauri）
dev-web:
    pnpm dev

# 前端类型检查
typecheck:
    pnpm typecheck

# 前端 ESLint
lint:
    pnpm lint

# 前端单元测试（vitest）
test:
    pnpm test

# Rust clippy，警告视为错误
clippy:
    cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# Rust 单元测试
test-rust:
    cargo test --manifest-path src-tauri/Cargo.toml

# 提交前检查：类型、lint、前端测试、clippy、Rust 测试
ci: typecheck lint test clippy test-rust

# 只构建前端
build-web:
    pnpm build

# 构建 NSIS 与 MSI 安装包
build:
    pnpm tauri build
