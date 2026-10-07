# Implement: 设置改为独立页面

## Checklist

1. 新增 `src/features/settings/settingsPageOpen.ts`，导出 `settingsPageOpen()`，查询 `[data-settings-page]`。
2. 新增 `src/features/settings/SettingsPage.tsx` 替换 `SettingsDialog.tsx`。页眉「设置」+「关闭」；正文沿用现有字段、示例、校验、「恢复默认」、「保存」。`Enter` 合法则写入并 `onClose`。`Esc` 只 `onClose`。根节点带 `data-settings-page`，`fixed inset-0 z-40 bg-background`。
3. 删除 `src/features/settings/SettingsDialog.tsx`。
4. `SettingsMenu` 去掉设置弹窗状态，接收 `onOpenSettings`。「关于」逻辑不动。`Toolbar` 把该回调从 props 传到 `SettingsMenu`。
5. `App.tsx` 持有 `settingsOpen`。工作区容器 `inert={settingsOpen}`。为真时在容器外渲染 `SettingsPage`。`CloseGuard` 和 `Toaster` 仍在容器外。
6. `useShortcuts`、`useOpenShortcut`、`Viewport` 的空格 `keydown`、`useDragDrop` 在 `settingsPageOpen()` 为真时按 `design.md` 的表跳过。
7. 测试用 `@testing-library/react` 的 `fireEvent`（仓库没有 `user-event`）。`SettingsPage.test.tsx` 覆盖 R2–R4：关闭和 `Esc` 不写 store，合法保存会写并调用 `onClose`，非法值禁用保存且 `Enter` 不离开，「恢复默认」只改字段，没有「取消」，根节点不是 dialog。`App` 或 `SettingsMenu` 测试覆盖 R1/R5/R6：菜单打开后面上有 `inert` 和 `data-settings-page`，关闭后 `inert` 消失；设置页打开时 `Ctrl+S`、`R`、`Ctrl+O` 不改变工具或触发打开；关于菜单项仍出现关于标题。拖放依赖 Tauri webview，用对 `useDragDrop` 的单测注入不了事件，在手动检查里看。store 测试的 `beforeEach` 清 `localStorage` 并重置 `exportSuffix`。
8. 跑 `pnpm typecheck && pnpm lint && pnpm test`。

## Manual check

`pnpm tauri dev`（或已开的 5180 预览）：

- 打开一张图，放大并平移，进入设置再关闭，画面位置不变。
- 设置页上看不到工具栏、侧栏、状态栏；只有「关闭」能回去。
- 拖一个文件到设置页上，不会被导入；关闭后工作区仍是原来的文件。

## Risky files

- `src/App.tsx`：壳层结构。`inert` 必须包住工作区、包不住设置页和 `CloseGuard`。
- `src/features/editor/Viewport.tsx`：只在空格分支前加判断，不要改绘制和手势。
- `src/features/import/useDragDrop.ts`：判断放在事件回调里，不要改订阅的生命周期。

## Rollback

实现偏离验收时，还原上述文件和新增的设置页文件，恢复 `SettingsDialog.tsx`。不要改 `settingsStore` 或 Rust。

## Before start

- `prd.md`、`design.md`、本文件已写完，且用户已确认本轮规划摘要。
- `implement.jsonl` 和 `check.jsonl` 各有至少一条真实 spec 记录。
