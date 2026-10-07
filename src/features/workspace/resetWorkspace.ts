import { releaseDocument } from "@/features/import/loadDocument";
import { useDocStore } from "@/store/docStore";
import { useEditorStore } from "@/store/editorStore";

/** Close every document and return to the start screen (W4). */
export function resetWorkspace() {
  for (const doc of useDocStore.getState().docs) releaseDocument(doc.id);
  useDocStore.getState().clear();
  useEditorStore.getState().reset();
}
