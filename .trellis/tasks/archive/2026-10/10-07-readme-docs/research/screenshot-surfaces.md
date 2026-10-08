# 可截图的界面

约束：不打开文件或文件夹。因此侧栏目录树、画布、打码、旋转和 PDF 翻页都不会出现在图里。

## 主窗口

`src/App.tsx` 在 `docs.length === 0` 时渲染 `EmptyState`，不渲染侧栏。

- 工具栏（`src/components/layout/Toolbar.tsx`）：Mosaic、打开文件、打开文件夹、重置、矩形、画笔、抓手、颗粒大小、恢复默认、撤销、重做、导出、设置。未打开文件时工具和导出不可用。旋转按钮不渲染。
- 空状态（`src/components/layout/EmptyState.tsx`）：「拖入图片、PDF 或文件夹」，「支持 JPG、PNG、WebP、BMP、PDF」，按钮「打开文件」「打开文件夹」，「也可以按 Ctrl+O」。
- 状态栏（`src/components/layout/StatusBar.tsx`）：「未打开文件」。

窗口宽度须大于 1374px，否则「打开文件」「打开文件夹」只剩图标（`.trellis/spec/frontend/component-guidelines.md`）。

## 设置页

`src/features/settings/SettingsPage.tsx`。入口是齿轮菜单「设置…」。

标题「设置」，按钮「关闭」。说明「导出时，新文件名在原文件名后加上后缀。」字段「导出文件名后缀」，默认 `_打码版`，示例「证书.jpg → 证书_打码版.jpg」。按钮「恢复默认」「保存」。

## 关于

`src/features/settings/AboutDialog.tsx`。入口是齿轮菜单「关于 Mosaic」。

标题「关于 Mosaic」。版本来自 `getVersion()`，`src-tauri/tauri.conf.json` 为 `0.2.0`。在浏览器里打开前端时该调用失败，显示「未知」，所以这张图必须从 `just dev` 的桌面窗口截取。正文：「给图片和 PDF 打马赛克的 Windows 桌面工具。导出到新文件，不覆盖原文件。」作者 lyh，链接 `github.com/bahayonghang/Mosaic`，按钮「关闭」。
