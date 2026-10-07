/** Must match `DEFAULT_SUFFIX` and `valid_suffix` in `src-tauri/src/commands/export.rs`. */
export const DEFAULT_EXPORT_SUFFIX = "_打码版";
export const SUFFIX_MAX = 32;

const FORBIDDEN = '\\/:*?"<>|';

function hasForbidden(v: string): boolean {
  return [...v].some((c) => FORBIDDEN.includes(c) || c.charCodeAt(0) < 0x20);
}

/** Reason the suffix is invalid, or null when it is valid. Checks the trimmed value. */
export function suffixError(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "后缀不能为空";
  if (v.length > SUFFIX_MAX) return `后缀最多 ${SUFFIX_MAX} 个字符`;
  if (hasForbidden(v)) return '后缀不能包含 \\ / : * ? " < > |';
  return null;
}

/** `name` with the suffix before the extension: `证书.jpg` -> `证书_打码版.jpg`. */
export function suffixedName(name: string, suffix: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0
    ? `${name.slice(0, dot)}${suffix}${name.slice(dot)}`
    : `${name}${suffix}`;
}
