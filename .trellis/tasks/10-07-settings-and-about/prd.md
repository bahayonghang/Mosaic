# Settings and about

Parent: `10-07-v0-2-0` (source requirements 2 and 5, decisions V3 and V4).
Depends on: `10-07-workspace-reset` committed (both change `Toolbar.tsx`).

## Goal

The user sets the file name suffix for exports once, and every later export uses it. The user can see which version of Mosaic runs and where the project lives.

## Requirements

### Entry point

- S1. An icon-only toolbar button "设置" (lucide `Settings`) at the right end of the toolbar, after the export button. It opens a dropdown menu with two items: "设置…" and "关于 Mosaic". The button is always enabled, also without documents.

### Export suffix rule (V3)

- S2. Setting "导出文件名后缀", default `_打码版`.
- S3. Automatic export name: `<stem><suffix>.<ext>` next to the source. On a collision: `<stem><suffix>_<n>.<ext>`, n = 2, 3, ... up to the existing limit 9999. The source file is never written (existing rule).
- S4. "导出" (`Ctrl+S`), "全部导出", and the default name of "另存为…" use the current suffix. "另存为…" still lets the user type any name.
- S5. Valid suffix: after trimming leading and trailing spaces, 1 to 32 characters, none of `\ / : * ? " < > |`, no control characters (U+0000-U+001F). The frontend and the Rust export commands both check this rule.
- S6. The suffix is persisted on the computer and survives an app restart.
- S7. A suffix change applies to the next export. Files already written keep their names.

### Settings dialog

- S8. Title "设置". One field "导出文件名后缀" with the current value.
- S9. Below the field, a live example built from the typed value: "示例：证书.jpg → 证书<suffix>.jpg".
- S10. An invalid value shows the reason under the field ("后缀不能为空" / "后缀最多 32 个字符" / "后缀不能包含 \ / : * ? \" < > |") and disables "保存".
- S11. Buttons: "恢复默认" (puts `_打码版` into the field, does not save), "取消", "保存". `Enter` in the field saves when the value is valid; `Esc` cancels.

### About dialog (V4)

- S12. Title "关于 Mosaic". Content: app mark (`PixelMark`) and name "Mosaic"; "版本 <version>" read from the Tauri app version at runtime; description "给图片和 PDF 打马赛克的 Windows 桌面工具。导出到新文件，不覆盖原文件。"; "作者：lyh"; the link text `github.com/bahayonghang/Mosaic`.
- S13. A click on the link opens `https://github.com/bahayonghang/Mosaic` in the system default browser. The webview itself never navigates away.
- S14. One button "关闭".

## Acceptance Criteria

- [ ] S1: the settings button shows with and without documents; the menu has "设置…" and "关于 Mosaic".
- [ ] S2/S3: with the default suffix, export `证书.jpg` twice: the folder has `证书_打码版.jpg` and `证书_打码版_2.jpg`; the source bytes are unchanged (Rust unit test plus one manual check in `pnpm tauri dev`).
- [ ] S4: set the suffix `-masked`, then "另存为…": the dialog proposes `证书-masked.jpg`; "全部导出" writes `<stem>-masked.<ext>` for every edited file, PDF included.
- [ ] S5: Rust unit test: `target_name` with a custom suffix and n = 1, 3; the export command rejects an invalid suffix with an error and writes no file. Frontend unit test of the validator for each rule in S5.
- [ ] S6: change the suffix, restart `pnpm tauri dev`: the dialog shows the changed value and the next export uses it.
- [ ] S10/S11: type `a:b`: the reason shows and "保存" is disabled; "恢复默认" fills `_打码版`; "取消" keeps the old value.
- [ ] S12: about shows `版本 0.1.0` before child 4 and `版本 0.2.0` after it (value from the app, not a hard-coded string).
- [ ] S13: in `pnpm tauri dev`, the link opens the system browser; the Mosaic window keeps its content.
- [ ] `pnpm typecheck && pnpm lint && pnpm test`, `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`, and `cargo test --manifest-path src-tauri/Cargo.toml` pass.

## Out of Scope

- Prefix or template rules; a separate suffix per format.
- Other settings fields.
- Renaming files that were already exported.
- Settings sync or import/export of settings.
