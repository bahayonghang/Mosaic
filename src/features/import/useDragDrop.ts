import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useState } from "react";
import { settingsPageOpen } from "@/features/settings/settingsPageOpen";
import { importPaths } from "./importActions";

/** Subscribes to native drag-and-drop. Returns true while files are dragged over the window. */
export function useDragDrop(): boolean {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (settingsPageOpen()) return;
        const { type } = event.payload;
        if (type === "enter" || type === "over") setDragging(true);
        else if (type === "leave") setDragging(false);
        else if (type === "drop") {
          setDragging(false);
          void importPaths(event.payload.paths);
        }
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return dragging;
}
