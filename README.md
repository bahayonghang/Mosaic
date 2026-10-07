# Mosaic

Mosaic 是一个 Windows 桌面工具，用来给图片和 PDF 打马赛克。编辑后导出到新文件，不会覆盖原文件。

技术栈：Tauri 2、React、TypeScript、Vite、Tailwind CSS v4、shadcn/ui、Zustand。包管理器是 pnpm。前端在 `src/`，Rust 在 `src-tauri/`。

## 功能

- 打开文件或文件夹，也可以把文件、PDF、文件夹拖进窗口
- 矩形选区打码，或用画笔涂抹打码
- 调节马赛克颗粒大小；画笔模式下可调节笔刷大小
- 撤销、重做、缩放、适应窗口
- PDF 按页编辑和导出
- 导出到原文件旁边、另存为，或一次导出全部已编辑的文件

支持的格式：JPG、JPEG、PNG、WebP、BMP、PDF。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 打开文件 | `Ctrl+O` |
| 矩形打码 | `R` |
| 画笔打码 | `B` |
| 缩小 / 放大笔刷 | `[` / `]` |
| 撤销 | `Ctrl+Z` |
| 重做 | `Ctrl+Shift+Z` 或 `Ctrl+Y` |
| 放大 / 缩小 | `Ctrl++` / `Ctrl+-` |
| 适应窗口 | `Ctrl+0` |
| 上一页 / 下一页（PDF） | `PageUp` / `PageDown` |
| 导出当前文件 | `Ctrl+S` |

## 环境

- Windows 10 及以上，并安装 [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)（Windows 11 已自带）
- [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/installation)
- [Rust](https://www.rust-lang.org/tools/install)。Windows 上还需要 MSVC 构建工具，见 [Tauri 前置条件](https://v2.tauri.app/start/prerequisites/)
- [just](https://github.com/casey/just)（可选）。没有 just 时，用下面表格里的等价命令

## 开发

```bash
pnpm install
just dev
```

`just dev` 先启动 Vite（http://localhost:5180），再打开桌面窗口。本机 Windows 通过 Hyper-V 保留了 TCP 1190–2621，Tauri 模板默认的 1420 无法绑定，所以开发端口固定为 5180。改端口前先看保留范围：

```text
netsh interface ipv4 show excludedportrange protocol=tcp
```

只看前端、不启动 Tauri 时用 `just dev-web`。

## 命令

在仓库根目录执行 `just` 可列出全部命令。

| 命令 | 作用 | 等价命令 |
| --- | --- | --- |
| `just install` | 安装前端依赖 | `pnpm install` |
| `just dev` | 启动桌面应用 | `pnpm tauri dev` |
| `just dev-web` | 只启动前端 | `pnpm dev` |
| `just typecheck` | 前端类型检查 | `pnpm typecheck` |
| `just lint` | 前端 ESLint | `pnpm lint` |
| `just test` | 前端单元测试 | `pnpm test` |
| `just clippy` | Rust clippy（警告视为错误） | `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` |
| `just test-rust` | Rust 单元测试 | `cargo test --manifest-path src-tauri/Cargo.toml` |
| `just ci` | 依次运行上面五项检查 | 见上 |
| `just build-web` | 只构建前端 | `pnpm build` |
| `just build` | 构建安装包 | `pnpm tauri build` |

`just build` 生成 NSIS 和 MSI，输出在 `src-tauri/target/release/bundle/`。

## 目录

```text
src/          React 界面、编辑器和导出
src-tauri/    Tauri 命令：读文件、扫描目录、写导出
justfile      上面的开发命令
```
