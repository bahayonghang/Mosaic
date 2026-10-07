# Workspace reset

Parent: `10-07-v0-2-0` (source requirement 1).

## Goal

After the user has worked on some files, one button closes all documents and returns the app to the start screen. The user then opens new files or folders without restarting the app.

## Requirements

- W1. An icon-only toolbar button "重置" (lucide `ListRestart`) after "打开文件夹", in the same group. It has the Chinese `aria-label` "重置" and the tooltip "关闭全部文件，回到初始界面".
- W2. The button is disabled when no document is open.
- W3. A click always opens a confirmation dialog (`AlertDialog`, the same component as the sidebar remove dialog):
  - Title: "重置工作区？"
  - Description: "将关闭全部 N 个文件，回到初始界面。原文件不会改变。"
  - When M > 0 documents are unexported (`isUnexported`), the description adds: "其中 M 个文件的编辑还没有导出，重置后会丢失。" and the confirm button uses the `destructive` variant.
  - Buttons: "取消", "重置".
- W4. Confirm: every document is released (`releaseDocument` for each id: bitmap cache and PDF handle / page cache), `docs` becomes empty, `currentId` becomes null. Editor state returns to its initial values: `tool = "rect"`, `sizes = {}`, `zoom = null`. The start screen (`EmptyState`) shows.
- W5. Cancel, `Esc`, or a click outside the dialog changes nothing.
- W6. After a reset, opening files or a folder, drag-and-drop, and `Ctrl+O` work as on a fresh start. A file that was open before the reset can be opened again and has no ops, rotation, or exported marker.
- W7. A reset while an export is running: the button is disabled while an export runs (`exportActions` already serializes exports through `busy`; expose it as state for the button). Reason: an export reads the document from the store while it runs.

## Acceptance Criteria

- [x] W1/W2: with no document the button is disabled; after opening one file it is enabled; hover shows the tooltip.
- [x] W3: open 3 files, edit 1, click reset: the dialog says 3 files and 1 unexported file, and the confirm button is red. With no edits, the extra sentence is absent and the confirm button is not red.
- [x] W4: confirm: the start screen shows; the file count in the sidebar is gone; `window.__mosaic.useDocStore.getState().docs.length === 0` in the browser preview.
- [x] W5: cancel: all 3 files and the edit are still there.
- [x] W6: after a reset, open the same file again: no ops, `version === 0`, no edited marker.
- [x] W7: the reset button is disabled while "全部导出" runs.
- [x] Unit test (vitest) for the store action that clears all documents: `docs` empty, `currentId` null; and for the editor store reset: `tool`, `sizes`, `zoom` back to initial values.
- [ ] Closing the window after a reset with no documents does not show the close confirmation.
- [x] `pnpm typecheck && pnpm lint && pnpm test` pass.

## Out of Scope

- Reset of only one folder or a selection of files.
- An undo for the reset.
- A keyboard shortcut for the reset.
