# Implementation checklist

Do this only after `task.py start`. Do not edit `src-tauri/icons/` before the user picks a candidate.

## Order

1. Read `prd.md`, `design.md`, and `research/icon-pipeline.md`.
2. Call `image_gen` three times, aspect ratio `1:1`, using the three compositions in `design.md`. Copy each saved file into `candidates/` as `01.png`, `02.png`, `03.png`.
3. Open each file and reject it when it has text, a photo, extra colors, a fine grid, a non-square canvas, or tiles that touch the outer edge.
4. Show the surviving images to the user and wait. Do not choose for them.
5. If none survive, generate one more round (`04.png` through `06.png`) and ask again. If none survive, stop. Leave `src-tauri/icons/` untouched.
6. Copy the chosen file to `candidates/chosen.png`. Record width and height. Reject a non-square file. If the shorter side is under 512, record that and reject it when a 32px downscale is soft or muddy.
7. Run:

   ```bash
   pnpm exec tauri icon .trellis/tasks/10-07-redesign-app-icon/candidates/chosen.png --output src-tauri/icons
   ```

8. Delete `src-tauri/icons/android` and `src-tauri/icons/ios` if they exist.
9. Check the desktop file list in `design.md`. Confirm `tauri.conf.json` has no diff.
10. Read `src-tauri/icons/32x32.png`. Make a 16px preview at `candidates/preview-16.png` with `System.Drawing` (no new package). Read that preview too. Both must still show the tile blocks.
11. Stop. Do not commit in this step.

`image_gen` is a Grok Build tool. The implement agent calls it. If the tool is missing in that agent, stop and say so. The main session then does steps 2-6 and the agent continues from step 7. Do not draw an SVG instead.

## Validation

- `pnpm exec tauri icon ...` exits 0.
- `git diff -- src-tauri/tauri.conf.json` is empty.
- `git status --short -- src-tauri/icons` shows only the replaced icon files and the new `64x64.png`.
- No `android` or `ios` path under `src-tauri/icons`.
- Visual read of `32x32.png` and `candidates/preview-16.png`.

There is no unit test for these bitmaps. Do not run `pnpm tauri build`.

## Rollback point

After step 7, and before any commit: `git restore src-tauri/icons`, then delete untracked `64x64.png`, `android/`, and `ios/` if they remain. Candidate files under the task directory can stay.
