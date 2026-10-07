import { useEffect } from "react";
import { useCurrentDoc } from "@/store/docStore";
import { loadDocument, needsLoad } from "./loadDocument";

/** Loads the current document when it is selected and not in memory. */
export function useDocumentLoader() {
  const doc = useCurrentDoc();
  useEffect(() => {
    if (doc && needsLoad(doc)) void loadDocument(doc);
  }, [doc]);
}
