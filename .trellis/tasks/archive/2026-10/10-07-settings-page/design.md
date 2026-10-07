# Design: 设置改为独立页面

## Boundaries

设置页是前端视图。后缀的存储、校验和导出命名不动。不增加路由，不改 Rust。

打开与否放在 `App` 的 React state，不放进 `settingsStore`。那个 store 只保存已经生效的 `exportSuffix`。草稿仍是设置页里的 `useState`，页面卸载即丢掉。

`SettingsMenu` 增加 `onOpenSettings`。菜单项「设置…」调用它，不再挂 `SettingsDialog`。「关于 Mosaic」的打开状态仍留在 `SettingsMenu`。`Toolbar` 把回调从 `App` 传下去。

## Page shell

`App` 把现有工作区包进一个带 `inert={settingsOpen}` 的容器。设置页作为这个容器的兄弟节点渲染，这样 `inert` 不会把设置页自己禁掉。Radix 弹窗门户到 `document.body`，关闭确认和关于弹窗不受这个 `inert` 影响。

```tsx
<div inert={settingsOpen} className="flex h-full flex-col">
  <Toolbar onOpenSettings={() => setSettingsOpen(true)} />
  {/* existing main + status bar */}
</div>
{settingsOpen && <SettingsPage onClose={() => setSettingsOpen(false)} />}
```

工作区保持挂载。`Viewport` 卸载会执行 `setZoom(null)` 并丢掉 ref 里的平移（`src/features/editor/Viewport.tsx` 清理函数）。盖住而不是拆掉，才能满足「缩放和平移原样回来」。

`SettingsPage`（替换 `SettingsDialog.tsx`）：

- 根节点 `fixed inset-0 z-40 flex flex-col bg-background`，属性 `data-settings-page`。不用 `role="dialog"`。`z-40` 低于弹窗的 `z-50`，未导出关闭确认仍能盖在设置页上。
- 页眉 `h-11 border-b bg-chrome px-3`，与工具栏同高。左侧 `<h1>设置</h1>`，右侧 `Button` variant `outline`、文案「关闭」。
- 正文一列 `mx-auto w-full max-w-md`，放说明、字段、示例和按钮。说明与字段沿用现在的文案和 `suffixError` / `suffixedName`。
- 「恢复默认」`type="button"` variant `ghost`。「保存」`type="submit"`，`error !== null` 时禁用。没有「取消」。
- 字段 `autoFocus`。`Enter` 走表单 `onSubmit`：合法则 `setExportSuffix` 再 `onClose`；非法则留下。
- 页面挂载时在 `window` 上听 `keydown`：`Escape` 时 `preventDefault` 并 `onClose`，不写入。监听在卸载时移除。

## Workspace input while the page is open

`inert` 挡不住 `window` 监听和 WebView 拖放。三处在处理前查询 `[data-settings-page]`，有则直接返回：

| Listener | File | While the marker exists |
| --- | --- | --- |
| 编辑器快捷键 | `src/features/editor/useShortcuts.ts` | 与现有 dialog 判断一样提前返回 |
| `Ctrl+O` | `src/features/import/useOpenShortcut.ts` | 不调用 `openFilesDialog` |
| 空格平移 | `src/features/editor/Viewport.tsx` `onKeyDown` | 不 `setSpace(true)` |
| 拖放 | `src/features/import/useDragDrop.ts` | 不置 `dragging`，`drop` 不调用 `importPaths` |

查询放在 `src/features/settings/settingsPageOpen.ts` 的 `settingsPageOpen()`，避免三处各写选择器。这是设置页对全局监听的唯一契约。

## Data flow

```
「设置…」 → App settingsOpen=true → 挂载 SettingsPage（草稿 = store.exportSuffix）
「保存」合法 → setExportSuffix(draft) → settingsOpen=false → 卸载，草稿消失
「关闭」/ Esc → settingsOpen=false → 卸载，store 不变
「恢复默认」 → 只 setDraft(DEFAULT_EXPORT_SUFFIX)
```

导出仍读 `useSettingsStore.getState().exportSuffix`。设置页打开期间没有新的写入路径。

## Trade-offs

- 用 `inert` + 固定层，而不是条件卸载工作区。多留着一棵隐藏的视图树，换来视口状态不用自己做快照。
- 「保存」后离开页面。这是现在弹窗的行为：保存即 `onDone`。留在页面上会多一个没有要求的停留状态。
- 拖放在设置页打开时被忽略，而不是排队等关闭后再导入。设置页盖住窗口时，用户看不到落下的文件会进哪。

## Compatibility

已保存的 `mosaic.settings` 不迁移。默认后缀、校验文案、关于弹窗不变。`SettingsDialog` 删除后，没有其它引用（当前只有 `SettingsMenu.tsx`）。

## Rollback

还原本任务的前端提交即可。store 键和 Rust 导出都不改，没有数据要清。
