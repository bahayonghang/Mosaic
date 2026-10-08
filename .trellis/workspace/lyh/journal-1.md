# Journal - lyh (Part 1)

> AI development session journal
> Started: 2026-10-06

---



## Session 1: Initialize Mosaic docs
<!-- trellis-session: v=2 fp=6d5b548d663ae168 -->

**Date**: 2026-10-06
**Task**: Initialize Mosaic docs
**Branch**: `main`

### Summary

Initialized the empty Mosaic repository with a Chinese README and AGENTS.md project section, and recorded that backend and frontend conventions are not established.

### Main Changes

- Added README.md and the AGENTS.md project section for image and PDF redaction.
- Replaced backend and frontend spec placeholders with an explicit not-established state.

### Git Commits

| Hash | Message |
|------|---------|
| `c4855fcbd356ec537658c63d3cc305da32af3e9c` | docs: initialize Mosaic without choosing a stack |

### Status

[OK] **Completed**

### Next Steps

- Choose a stack only when implementation starts.


## Session 2: Mosaic MVP: PDF mosaic and integration review
<!-- trellis-session: v=2 fp=2abad579c5bed541 -->

**Date**: 2026-10-06
**Task**: Mosaic MVP: PDF mosaic and integration review
**Branch**: `main`

### Summary

Finished 10-06-pdf-mosaic: pdf.js page rendering at 200 DPI with LRU 3, status-bar page navigation and PageUp/PageDown, rasterized PDF export with pdf-lib. Fixed export memory (2.0-2.9 GB to 0.9-1.0 GB for 200 pages) with CPU canvases for off-screen composites and 8 MB chunked write_export. Integration review of 10-06-mosaic-mvp: AC1-AC7 checked; pnpm tauri build produced NSIS and MSI; installer not installed. Open: debug instances that ran location.reload() did not close (destroy failed: failed to send message to the webview), cause not determined.

### Git Commits

| Hash | Message |
|------|---------|
| `d55bd66` | feat(app-shell): scaffold Tauri app with themed layout shell |
| `9f0d672` | feat(import): import images and PDFs by dialog, folder, and drag and drop |
| `34d5281` | feat(editor): add rectangle and brush mosaic editing with export |
| `cd877e9` | feat(pdf): edit and export PDF pages with page navigation |

### Status

[OK] **Completed**


## Session 3: Redesign the application icon
<!-- trellis-session: v=2 fp=b6f0051b03be4648 -->

**Date**: 2026-10-07
**Task**: Redesign the application icon
**Branch**: `main`

### Summary

Replaced the Tauri template icon with a user-selected mosaic tile mark. The icon set is in src-tauri/icons. The window icon updates on the next tauri dev or tauri build.

### Main Changes

- Generated three icon candidates and installed candidate 1 through tauri icon.
- Kept the desktop icon set, including the new 64x64.png, and removed the generated android and ios folders.

### Git Commits

| Hash | Message |
|------|---------|
| `0379f84` | feat: replace the template icon with a mosaic mark |

### Testing

- [OK] 32px PNG and the 16px ICO frame still show three tiles. tauri.conf.json is unchanged.

### Status

[OK] **Completed**


## Session 4: Settings as a full-window page
<!-- trellis-session: v=2 fp=6e08418e698d6a64 -->

**Date**: 2026-10-07
**Task**: Settings as a full-window page
**Branch**: `main`

### Summary

Replaced the settings dialog with a full-window page that has a close button. Unsaved suffix drafts are discarded on close or Escape.

### Main Changes

- Settings opens as a page that covers the workspace; the workspace stays mounted and inert.
- Close and Escape discard the draft. Save writes the trimmed suffix and returns. About stays a dialog.

### Git Commits

| Hash | Message |
|------|---------|
| `a788503` | feat(settings): 把设置从弹窗改成带关闭按钮的整页 |
| `578a2cf` | docs(spec): 记录设置页的打开状态和全局监听让路 |

### Testing

- [OK] pnpm typecheck, pnpm lint, and pnpm test passed (53 tests). Browser preview checked close, Escape, invalid input, save, and About.

### Status

[OK] **Completed**


## Session 5: README screenshots and user guide
<!-- trellis-session: v=2 fp=781cefbe1359efce -->

**Date**: 2026-10-08
**Task**: README screenshots and user guide
**Branch**: `dev`

### Summary

Added real screenshots of the empty window, settings page, and about dialog, plus a short user guide.

### Main Changes

- README feature section now shows the three screenshots and links to docs/guide.md.

### Git Commits

| Hash | Message |
|------|---------|
| `63f9fe1` | docs: 用真实截图介绍主窗口、设置和关于 |

### Testing

- [OK] Compared the screenshots with the desktop window. Chinese punctuation check passed.

### Status

[OK] **Completed**
