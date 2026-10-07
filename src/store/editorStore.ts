import { create } from "zustand";
import { defaultBlock, defaultRadius } from "@/features/editor/mosaicEngine";
import type { MosaicDoc } from "./types";

export type Tool = "rect" | "brush" | "hand";

export interface Sizes {
  block: number;
  radius: number;
}

/** Zoom commands of the viewport that is on screen. */
export interface ViewApi {
  zoomBy: (factor: number) => void;
  fit: () => void;
}

interface EditorState {
  tool: Tool;
  /** Block size and brush radius per document; absent means the defaults of shared design 3.4. */
  sizes: Record<string, Sizes>;
  /** Viewport scale (1 = 100 %), null when no image is shown. */
  zoom: number | null;
  view: ViewApi | null;
  /** An export is running; set by `exportActions`. */
  exporting: boolean;
  setTool: (tool: Tool) => void;
  setSizes: (doc: MosaicDoc, patch: Partial<Sizes>) => void;
  /** Back to the defaults of shared design 3.4. */
  resetSizes: (doc: MosaicDoc) => void;
  setZoom: (zoom: number | null) => void;
  setView: (view: ViewApi | null) => void;
  setExporting: (exporting: boolean) => void;
  /** Initial tool, sizes, and zoom (workspace reset). `view` is cleared by the unmounting viewport. */
  reset: () => void;
}

export function defaultSizes(doc: MosaicDoc): Sizes | undefined {
  // PDF: the first page decides the defaults for every page (P4).
  const page = doc.pages[0];
  if (!page) return undefined;
  return {
    block: defaultBlock(page.width, page.height),
    radius: defaultRadius(page.width, page.height),
  };
}

export function sizesOf(
  sizes: Record<string, Sizes>,
  doc: MosaicDoc | undefined,
): Sizes | undefined {
  if (!doc) return undefined;
  return sizes[doc.id] ?? defaultSizes(doc);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tool: "rect",
  sizes: {},
  zoom: null,
  view: null,
  exporting: false,
  setTool: (tool) => set({ tool }),
  setSizes: (doc, patch) => {
    const current = sizesOf(get().sizes, doc);
    if (!current) return;
    set((s) => ({ sizes: { ...s.sizes, [doc.id]: { ...current, ...patch } } }));
  },
  resetSizes: (doc) =>
    set((s) => {
      const sizes = { ...s.sizes };
      delete sizes[doc.id];
      return { sizes };
    }),
  setZoom: (zoom) => set({ zoom }),
  setView: (view) => set({ view }),
  setExporting: (exporting) => set({ exporting }),
  reset: () => set({ tool: "rect", sizes: {}, zoom: null }),
}));

export function useSizes(doc: MosaicDoc | undefined): Sizes | undefined {
  return sizesOf(
    useEditorStore((s) => s.sizes),
    doc,
  );
}
