# Icon pipeline

Evidence for replacing `src-tauri/icons/` from one square source. Captured 2026-10-07.

## Current assets

`src-tauri/tauri.conf.json` lines 28-40 set bundle targets to `nsis` and `msi`, and list:

- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.icns`
- `icons/icon.ico`

The same directory also contains `icon.png`, `StoreLogo.png`, and `Square{30,44,71,89,107,142,150,284,310}x{same}Logo.png`. There is no `64x64.png`, no `android/`, and no `ios/`.

`src-tauri/icons/icon.png` is the Tauri template mark: cyan and amber rings on black. The frontend has no app logo component and no favicon.

## Color tokens

`src/styles/globals.css` lines 54-75. Converted with the CSS Color 4 OKLab matrix on 2026-10-07:

| Token | oklch | sRGB |
| --- | --- | --- |
| `--signal` | `oklch(0.62 0.19 35)` | `#e14d28` |
| `--canvas` | `oklch(0.915 0.005 60)` | `#e5e2e0` |
| `--background` | `oklch(0.985 0.003 60)` | `#fcfaf8` |
| `--chrome` | `oklch(0.965 0.004 60)` | `#f5f3f1` |
| `--foreground` | `oklch(0.22 0.006 60)` | `#1d1a18` |

`--background` is nearly white. A plate painted with it disappears on a light taskbar. `--canvas` is the same warm hue and stays visible.

## Grok image generation

From the Grok Build imagine contract used in this session:

- `image_gen` takes `prompt` and `aspect_ratio`. Square icons use `1:1`.
- The tool has no count parameter. Three candidates means three calls with different prompts.
- Output size and alpha are not part of the documented inputs. Measure the saved file. Do not assume a 1024 canvas or a transparent background.
- The same contract says image models are unreliable when tile geometry must be exact. A candidate that gains text, a photo, extra colors, or a fine grid is a failed candidate, not a prompt to keep retrying.

## `tauri icon` on the installed CLI

`@tauri-apps/cli` in this repo is `2.12.1` (`node_modules/@tauri-apps/cli/package.json`). Help text: the input is a square PNG or SVG. A non-square source without `--fit` is an error. Default output is the `icons` directory next to `tauri.conf.json`.

Source checked out from tag `tauri-cli-v2.12.1`, file `crates/tauri-cli/src/icon.rs`:

- Empty `--png` (the default) writes the desktop set, then Android, then iOS.
- Desktop PNG names from `png()`: `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png` (256px), `icon.png` (512px).
- `appx()` writes `StoreLogo.png` at 50px and the nine `Square*Logo.png` sizes listed above.
- `ico()` test in that file expects 16, 24, 32, 48, 64, and 256 inside `icon.ico`.
- `icns()` writes `icon.icns`.
- Android goes to `src-tauri/gen/android/...` when that path exists, otherwise `icons/android/`. iOS goes to `src-tauri/gen/apple/...` when that path exists, otherwise `icons/ios/`. Neither gen path exists in this repo, so a default run creates both folders under `icons/`.
- Passing `--png` skips the default set. Do not pass it.

`64x64.png` is new relative to the current tree. `tauri.conf.json` does not need a new entry for it. The mobile folders are unused: bundle targets are only `nsis` and `msi`.
