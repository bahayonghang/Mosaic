import { useEffect } from "react";
import { settingsPageOpen } from "@/features/settings/settingsPageOpen";
import { openFilesDialog } from "./importActions";

/** Ctrl+O opens the file dialog. */
export function useOpenShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsPageOpen()) return;
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void openFilesDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
