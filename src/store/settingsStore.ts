import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_EXPORT_SUFFIX, suffixError } from "@/lib/exportName";

interface SettingsState {
  /** Trimmed and valid (`suffixError` is null). */
  exportSuffix: string;
  /** Ignores an invalid value. */
  setExportSuffix: (value: string) => void;
}

/** User settings, kept in `localStorage` under `mosaic.settings`. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      exportSuffix: DEFAULT_EXPORT_SUFFIX,
      setExportSuffix: (value) => {
        if (suffixError(value) === null) set({ exportSuffix: value.trim() });
      },
    }),
    {
      name: "mosaic.settings",
      version: 1,
      partialize: (s) => ({ exportSuffix: s.exportSuffix }),
      // A hand-edited or corrupt stored value falls back to the default.
      merge: (persisted, current) => {
        const suffix = (persisted as Partial<SettingsState> | undefined)?.exportSuffix;
        return {
          ...current,
          exportSuffix:
            typeof suffix === "string" && suffixError(suffix) === null
              ? suffix.trim()
              : DEFAULT_EXPORT_SUFFIX,
        };
      },
    },
  ),
);
