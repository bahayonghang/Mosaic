# Design: Hand tool and size reset

## State (`src/store/editorStore.ts`)

- `Tool` becomes `"rect" | "brush" | "hand"`.
- New action `resetSizes(doc: MosaicDoc)`: delete `sizes[doc.id]`. `sizesOf` already returns the defaults for an absent entry, so no second default computation is added.
- The toolbar computes "at defaults" as: the sizes from `useSizes(doc)` equal `{ block: defaultBlock(w, h), radius: defaultRadius(w, h) }` of `doc.pages[0]`. Export a small helper `defaultSizes(doc)` from `editorStore.ts` and use it in `sizesOf` and the toolbar, so the rule exists once.

## Toolbar (`src/components/layout/Toolbar.tsx`)

- Add `<ToggleGroupItem value="hand">` with `Hand` icon and text "抓手", wrapped in `Tip` (label "抓手（平移和缩放）", shortcut `H`).
- Add the "恢复默认" `Button variant="ghost" size="sm"` after the size controls, wrapped in `Tip`. `onClick={() => doc && resetSizes(doc)}`.

## Shortcuts (`src/features/editor/useShortcuts.ts`)

- `key === "h"` without modifiers → `editor.setTool("hand")`. Update the shortcut table in the frontend spec at finish.

## Viewport (`src/features/editor/Viewport.tsx`)

- Pointer down: start a `pan` gesture when `e.button === 1`, or `e.button === 0 && (spaceDown || tool === "hand")`. The tool branch runs only for `"rect"` and `"brush"`; select the session with an explicit `"rect"` / `"brush"` check, not an `else` that assumes brush.
- Wheel: when `live.current.tool === "hand"` and neither `Ctrl` nor `Shift` is held, call `zoomAt` at the cursor with `Math.exp(-dy * 0.0015)` (same factor as `Ctrl+wheel`). Other cases keep the current code.
- Cursor class: `panning` → `cursor-grabbing`; `space || tool === "hand"` → `cursor-grab`; brush → `cursor-none`; rect → `cursor-crosshair`.
- Brush circle: `updateBrushCursor` already hides the circle when the tool is not `"brush"`; no change.

## Tradeoffs

- The hand wheel zooms without `Ctrl` (T2). Trackpad two-finger scroll with the hand tool therefore zooms instead of panning; drag still pans. Accepted by T2.
- No new store field for "hand active"; the tool value is enough.
