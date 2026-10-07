/** Must match `SUPPORTED_EXTENSIONS` in `src-tauri/src/commands/files.rs`. */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp"] as const;
export const PDF_EXTENSIONS = ["pdf"] as const;
export const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS] as const;
