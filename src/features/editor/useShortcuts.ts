import { useEffect } from "react";
import { exportCurrent } from "@/features/export/exportActions";
import { redo, setPage, undo, useDocStore } from "@/store/docStore";
import { sizesOf, useEditorStore } from "@/store/editorStore";
import { RADIUS_MAX, RADIUS_MIN } from "./mosaicEngine";

/** Editor keys from shared design 4 (Ctrl+O lives in the import feature). */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.matches("input, textarea, [contenteditable]")
      )
        return;
      // Dialogs own the keyboard while open.
      if (document.querySelector("[role=alertdialog], [role=dialog]")) return;
      const { docs, currentId } = useDocStore.getState();
      const doc = docs.find((d) => d.id === currentId);
      const editor = useEditorStore.getState();
      const key = e.key.toLowerCase();
      const ready = doc?.status === "ready";

      let handled = true;
      if (e.ctrlKey && !e.altKey) {
        if (key === "z" && !e.shiftKey && ready) undo(doc.id);
        else if (((key === "z" && e.shiftKey) || key === "y") && ready)
          redo(doc.id);
        else if (key === "s" && !e.shiftKey) void exportCurrent();
        else if (key === "=" || key === "+") editor.view?.zoomBy(1.25);
        else if (key === "-") editor.view?.zoomBy(0.8);
        else if (key === "0") editor.view?.fit();
        else handled = false;
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (key === "pageup" && ready) setPage(doc.id, doc.currentPage - 1);
        else if (key === "pagedown" && ready)
          setPage(doc.id, doc.currentPage + 1);
        else if (key === "r") editor.setTool("rect");
        else if (key === "b") editor.setTool("brush");
        else if ((key === "[" || key === "]") && ready) {
          const radius = sizesOf(editor.sizes, doc)!.radius;
          const step = Math.max(1, Math.round(radius * 0.1));
          const next = Math.min(
            RADIUS_MAX,
            Math.max(RADIUS_MIN, radius + (key === "]" ? step : -step)),
          );
          editor.setSizes(doc, { radius: next });
        } else handled = false;
      } else handled = false;

      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
