<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

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

不得假定任何尚未写在本仓库或 `.trellis/spec/` 中的目录布局或编码约定。
