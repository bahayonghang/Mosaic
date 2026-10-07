# 设置改为独立页面

## Goal

用户从工具栏「设置…」进入时，看到盖住整个窗口的设置页，并用「关闭」回到刚才的工作区。导出文件名后缀的规则、持久化和导出命名保持不变。

## Background

- 入口是工具栏齿轮菜单的「设置…」和「关于 Mosaic」（`src/features/settings/SettingsMenu.tsx`）。关于由 `AboutDialog.tsx` 呈现。
- 当前设置是 `SettingsDialog.tsx`：`showCloseButton={false}`，离开靠「取消」和「保存」。表单仅在打开时挂载，草稿从 `useSettingsStore` 的已保存值开始。字段、校验、示例和「恢复默认」的规则来自任务 `10-07-settings-and-about` 的 S8–S11。
- 已保存值只在 `src/store/settingsStore.ts`（`localStorage` 键 `mosaic.settings`）。校验在 `src/lib/exportName.ts` 的 `suffixError`。导出读已保存值，不读草稿。
- 应用没有路由（`src/main.tsx` 只渲染 `App`）。工作区是工具栏、主区域、状态栏（`src/App.tsx`）。
- 编辑器快捷键在 `[role=dialog]` 或 `[role=alertdialog]` 存在时不响应（`src/features/editor/useShortcuts.ts` 第 17 行）。`useOpenShortcut` 和 `Viewport` 的空格监听没有这层判断。文件拖放走 WebView 的 `onDragDropEvent`（`src/features/import/useDragDrop.ts`），不经过 DOM。

## Requirements

- R1. 「设置…」打开设置页，不再打开设置 `Dialog`。页面盖住整个窗口，工具栏、侧栏、画布和状态栏都不可见、不可点。已打开的文件、打码、当前页、缩放和平移留在内存里，关闭后原样回来。
- R2. 页眉标题为「设置」，右侧有中文按钮「关闭」。点击「关闭」或按 `Esc` 丢掉本次草稿并回到工作区。已保存的后缀不变。
- R3. 页内保留说明「导出时，新文件名在原文件名后加上后缀。」、字段「导出文件名后缀」、即时示例、非法原因，以及「恢复默认」和「保存」。没有「取消」。
- R4. 「恢复默认」只把草稿改成 `_打码版`，不写入、不离开页面。「保存」在值合法时写入 store 并回到工作区；非法时显示原因且「保存」禁用，`Enter` 也不写入、不离开。
- R5. 设置页打开时，工作区不响应编辑快捷键、`Ctrl+O`、空格平移，也不接受拖放导入。窗口关闭确认（未导出文档）仍然有效。
- R6. 「关于 Mosaic」仍是现有弹窗。设置页打开时不提供关于入口。

## Acceptance Criteria

- [ ] 从「设置…」进入后，可见标题「设置」和按钮「关闭」；页面上没有 `role="dialog"`。工作区节点仍在文档中，但带 `inert`，关闭后去掉 `inert`。
- [ ] 改字段后点「关闭」，再进入：字段回到进入前的已保存值，`exportSuffix` 不变。按 `Esc` 同样。
- [ ] 合法值点「保存」或在字段里按 `Enter`：`exportSuffix` 变为去首尾空格后的值，并回到工作区。
- [ ] 输入 `a:b`：字段下出现原因，`保存` 禁用；`Enter` 不写入、不离开。
- [ ] 「恢复默认」把字段写成 `_打码版`，store 不变，人还在设置页。页面上没有「取消」。
- [ ] 设置页打开时：`Ctrl+S` 不导出，`R` 不改工具，`Ctrl+O` 不打开文件，空格不进入平移，拖放不导入。
- [ ] 设置页关闭后，「关于 Mosaic」仍打开原来的关于弹窗。
- [ ] 打开文档并缩放后进入设置再关闭，缩放和平移与进入前一致。
- [ ] `pnpm typecheck && pnpm lint && pnpm test` 通过。

## Out of Scope

- 新增设置项，或修改后缀规则、持久化键、导出命名。
- 把「关于」改成页面。
- 引入路由库。
- 改变关于弹窗、关闭确认弹窗以外的其它弹窗。
