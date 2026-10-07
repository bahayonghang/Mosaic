# Icon generation and replacement

## Boundary

This task changes bitmap files under `src-tauri/icons/` only. It does not change Rust, React, `tauri.conf.json`, or the frontend tokens. Those tokens are inputs to the prompt, not files to edit.

Grok `image_gen` produces the master. `@tauri-apps/cli` 2.12.1 turns one square master into the platform files. The CLI is the resampler. Do not hand-resize the set.

## Source contract

Candidates are square, opaque, and full-bleed. `image_gen` does not document alpha or pixel size, so the plan does not depend on either. A transparent or non-square result is a failed candidate.

Shared prompt facts for every candidate:

- App icon, one square, flat vector-like shapes.
- Ground fills the canvas: warm paper `#e5e2e0`.
- Tiles are flat vermilion `#e14d28`.
- Few large squares, inset so the blocks sit inside the central area and do not touch the outer edge.
- No letters, no photo, no people, no gradient, no shadow, no extra objects.

Three compositions, one call each:

1. Four large tiles in a loose 2 by 2, with one tile absent so the ground shows in that cell.
2. Three large tiles in a short staggered row.
3. One large tile with two smaller tiles tucked against it. The smaller tiles are still big enough to survive 16px.

Save the tool output under `.trellis/tasks/10-07-redesign-app-icon/candidates/`. Copy the approved file to `candidates/chosen.png`.

## Replacement command

From the repository root, after `chosen.png` exists and is square:

```bash
pnpm exec tauri icon .trellis/tasks/10-07-redesign-app-icon/candidates/chosen.png --output src-tauri/icons
```

Do not pass `--png` or `--fit`.

Then delete `src-tauri/icons/android` and `src-tauri/icons/ios`. The CLI creates them because `src-tauri/gen/android` and `src-tauri/gen/apple` are absent (`research/icon-pipeline.md`). This app does not ship Android or iOS.

Expected desktop names after the command:

- `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png`, `icon.png`
- `icon.ico`, `icon.icns`
- `StoreLogo.png`
- `Square30x30Logo.png`, `Square44x44Logo.png`, `Square71x71Logo.png`, `Square89x89Logo.png`, `Square107x107Logo.png`, `Square142x142Logo.png`, `Square150x150Logo.png`, `Square284x284Logo.png`, `Square310x310Logo.png`

`64x64.png` is new. Leave `tauri.conf.json` unchanged. The bundler list already points at files this command rewrites.

## Tradeoff

A generated mosaic will not match the hex values pixel-perfect. Acceptance is visual: the ground reads as warm paper, the tiles read as vermilion, and the blocks are still blocks at 16px and 32px. Chasing exact geometry with more prompts is capped by PRD R4.

`image_gen` may return a small bitmap. If the shorter side is under 512, record the size. Continue only when the 32px result is still a clean block edge. Lanczos upscaling of a tiny source is a reason to reject, not a reason to invent a second renderer.

## Rollback

The icon directory is the only product tree this task writes. Before the first write it matches git. Restore with `git restore src-tauri/icons`, then delete untracked `src-tauri/icons/64x64.png` if the command created it. Mobile folders are deleted in the success path; if a run stops midway, delete them too.
