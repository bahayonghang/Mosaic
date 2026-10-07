# Design: Mosaic MVP (shared architecture)

Child tasks implement parts of this design. Each child `design.md` adds detail for its own part and must not contradict this file. A change to a shared contract below updates this file first.

## 1. Stack

| Layer | Choice | Reason |
|---|---|---|
| Shell | Tauri 2 (tauri-cli 2.12.1 installed) | User request R1 |
| Frontend | React + TypeScript + Vite, pnpm | D1 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) + lucide-react icons | Clean modern components with low custom CSS |
| State | zustand | Small store for the document list and the editor; no provider tree |
| Toasts | sonner | Export results and errors |
| PDF render | pdfjs-dist (frontend, Web Worker) | No native PDF library in the Rust build |
| PDF write | pdf-lib (frontend) | Builds a PDF from JPEG pages; Rust only writes bytes |
| Image encode | Rust `image` crate | Encodes BMP and re-encodes JPG/PNG/WebP with fixed settings |
| Tauri plugins | `dialog` (open, save, folder), core drag-drop events | D3, D5 |
| Tests | vitest (frontend logic), `cargo test` (Rust commands) | |

Version pins are set when `10-06-app-shell` scaffolds the project and are recorded in `package.json` / `Cargo.toml`.

## 2. Boundaries

```
Frontend (React)                              Rust (src-tauri)
-------------------------------------------   --------------------------------
Import UI -> scan_paths(paths) -------------> walk dirs, filter by extension
Document store  <--------------------------- Vec<ScannedFile>
Loader -> read_file(path) ------------------> fs::read -> raw bytes (ipc::Response)
  image: createImageBitmap(Blob)
  pdf:   pdfjs getDocument(bytes)
Editor (canvas, ops, mosaic engine)
Exporter:
  image: canvas -> PNG bytes -> export_image -> decode PNG, encode to source format,
                                               write to unique `_mosaic` path
  pdf:   pages -> JPEG -> pdf-lib -> bytes -> write_export(src, bytes)
  save as: dialog.save -> path -> same commands with explicit target path
```

Rust owns all filesystem access: directory walking, reading, target path selection, and writing. The frontend owns decoding for display, editing, the mosaic computation, and PDF assembly.

Rust never overwrites the source file. `export_*` commands reject a target path equal to the source path.

## 3. Shared Contracts

### 3.1 Supported extensions

`SUPPORTED_EXTENSIONS = jpg, jpeg, png, webp, bmp, pdf` (case-insensitive). One constant in Rust (`scan_paths`) and one in TypeScript (dialog filters). Both lists must match.

### 3.2 Tauri commands

| Command | Input | Output | Errors |
|---|---|---|---|
| `scan_paths` | `paths: string[]` (files or directories) | `ScannedFile[]` = `{ path, name, kind: "image" \| "pdf", size }`, sorted by path, de-duplicated | Unreadable directories are skipped and counted in `skipped: number` |
| `read_file` | `path: string` | raw bytes (`tauri::ipc::Response`) | `"文件无法读取：<reason>"` |
| `export_image` | raw PNG bytes in the request body; headers `x-source`, `x-target` (empty = automatic name) | written path (string) | encode or write failure |
| `write_export` | raw bytes; headers `x-source`, `x-target`, optional `x-offset`; the automatic name keeps the source extension | written path (string) | write failure |
| `reveal_in_folder` | `path: string` | none | Explorer launch failure |

- When `targetPath` is absent, Rust computes `<dir>/<stem>_mosaic.<ext>`; if the path exists it tries `<stem>_mosaic_2.<ext>`, `_3`, and so on. The check and the write use `OpenOptions::create_new(true)` to avoid a race.
- When `targetPath` is present (Save as), Rust writes to that path (overwrite allowed because the user confirmed it in the system dialog) unless it equals `sourcePath`.
- Raw-body commands (`export_image`, `write_export`) receive the bytes as the request body (`invoke(cmd, Uint8Array, { headers })`) and read `sourcePath` / `targetPath` from request headers. Header values are `encodeURIComponent` strings because paths can contain non-ASCII characters; Rust decodes them.
- `write_export` accepts large files in chunks (WebView2 holds about 15 times a request body in memory while it sends it). `x-offset: 0` or no header creates the file as above; a later chunk sends `x-offset` equal to the bytes written so far and `x-target` set to the path the first chunk returned. Rust appends only when the file length equals `x-offset`, and removes the file when an append fails.
- `export_image` chooses the output format from the target extension: JPEG quality 92, PNG default compression, WebP lossless, BMP 24-bit. JPEG and BMP have no alpha; transparent pixels are composited over white.
- Error strings returned to the UI are Chinese (D8).

### 3.3 Document model (frontend)

```ts
type DocKind = "image" | "pdf";
interface MosaicDoc {
  id: string;            // stable per path
  path: string; name: string; kind: DocKind;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  pages: PageState[];    // image: exactly one page
  currentPage: number;
  exportedVersion?: number; // edit version at last export
  version: number;          // increments on every op change
}
interface PageState {
  width: number; height: number; // raster pixels used for editing and export
  ops: MosaicOp[]; redo: MosaicOp[];
  pdfPointSize?: { w: number; h: number }; // pdf only
}
type MosaicOp =
  | { type: "rect"; x: number; y: number; w: number; h: number; block: number }
  | { type: "stroke"; points: [number, number][]; radius: number; block: number };
```

- All op coordinates are in page raster pixels. Images: raster = decoded image size. PDF: raster = page rendered at 200 DPI (CoverUP "high"), longest side clamped to 8192 px.
- Undo/redo is per page: undo pops `ops` into `redo`; a new op clears `redo`.
- A document is "edited" when any page has at least one op. "Export all" exports edited documents only.

### 3.4 Mosaic algorithm

Reference: `ref/ImagEdit/imagedit/redaction.py:31-43`.

1. For block size `b`, compute a full mosaic copy of the page: the grid starts at (0, 0); each cell `b x b` (edge cells smaller) gets the mean RGBA of its source pixels. Cache the copy per `(page, b)`.
2. Rect op: snap the rect outward to the `b` grid, then draw the mosaic copy clipped to the snapped rect.
3. Stroke op: draw the stroke (round caps and joins, width `2 * radius`) into a mask canvas; composite the mosaic copy through the mask (`source-in`) onto the page.
4. Ops are applied in order onto a composite canvas at raster resolution. Adding an op draws only that op; undo and redo rebuild the composite from the base bitmap.
5. Default block size: `clamp(round(max(width, height) / 100), 8, 48)`. Slider range 4-96.
6. Default brush radius: `clamp(round(max(width, height) / 40), 8, 200)`. Slider range 4-400.

The mean is computed in TypeScript over `ImageData` (not by browser canvas smoothing) so that results are deterministic and testable. Mosaic computation runs in a Web Worker when the page is larger than 4 megapixels.

Brush strokes are anti-aliased at the mask edge. Edge pixels are blends of mosaic and original color. AC4 applies to pixels fully inside the stroke; this is a known limit of brush tools and matches ImagEdit's soft edge behavior.

## 4. UI Layout

```
+----------------------------------------------------------------------------+
| [打开文件] [打开文件夹] | [矩形][画笔] 颗粒 ---o--- 笔刷 ---o--- | ↶ ↷ | 导出 ▾ |
+-------------+--------------------------------------------------------------+
| 文件列表     |                                                              |
| ▣ a.jpg  ●  |                     canvas viewport                          |
| ▣ b.pdf     |              (empty state: drop zone + 2 buttons)             |
|             |                                                              |
+-------------+--------------------------------------------------------------+
| 1920×1080 · 100% [-][+][适应]                 PDF: ‹ 3 / 12 ›              |
+----------------------------------------------------------------------------+
```

- Native Windows title bar. One toolbar row, one status bar row.
- The sidebar shows when at least one document is open; it is resizable and collapsible.
- Dot marker in the list: edited and not exported.
- Export button: primary action "导出"; dropdown items "另存为…" and "全部导出".
- Visual tokens: warm-tinted neutral palette (hue 60), one accent color `--signal` (vermilion, used for the active tool, the primary action, and the edited marker), 8 px radius, system font stack `"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif`. Light and dark tokens via CSS variables; `prefers-color-scheme` selects the set.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl+O` | Open files |
| `R` / `B` | Rectangle tool / Brush tool |
| `[` / `]` | Brush radius down / up |
| `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y` | Undo, redo, redo |
| `Ctrl+S` | Export current document |
| `Ctrl+wheel`, `Ctrl+=`, `Ctrl+-`, `Ctrl+0` | Zoom at cursor, zoom in, zoom out, fit |
| `Space+drag`, middle-button drag | Pan |
| `PageUp` / `PageDown` | PDF previous / next page |

## 5. Security and Privacy

- Mosaic is not encryption. Small blocks over text can be partly reversed by depixelation attacks. The default block size (≥ 8 px) and the slider minimum (4 px) are a trade-off; the UI does not claim cryptographic safety.
- Exported images contain no EXIF or other metadata (canvas output re-encoded by Rust).
- Exported PDFs contain only page images (D4); original text, annotations, form fields, and metadata are not copied.
- Tauri capabilities allow only the commands in 3.2 and the dialog plugin. No asset protocol scope, no shell plugin, no network access.

## 6. Rollback

Each child task is one or more commits on `main`. Rollback is `git revert` of the child's commits. No data migration and no persisted state exist.
