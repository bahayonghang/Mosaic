import { create } from "zustand";
import { defaultBlock, defaultRadius } from "@/features/editor/mosaicEngine";
import type { MosaicDoc } from "./types";

export type Tool = "rect" | "brush";

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
  setTool: (tool: Tool) => void;
  setSizes: (doc: MosaicDoc, patch: Partial<Sizes>) => void;
  setZoom: (zoom: number | null) => void;
  setView: (view: ViewApi | null) => void;
}

export function sizesOf(
  sizes: Record<string, Sizes>,
  doc: MosaicDoc | undefined,
): Sizes | undefined {
  if (!doc) return undefined;
  const stored = sizes[doc.id];
  if (stored) return stored;
  const page = doc.pages[doc.currentPage];
  if (!page) return undefined;
  return {
    block: defaultBlock(page.width, page.height),
    radius: defaultRadius(page.width, page.height),
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tool: "rect",
  sizes: {},
  zoom: null,
  view: null,
  setTool: (tool) => set({ tool }),
  setSizes: (doc, patch) => {
    const current = sizesOf(get().sizes, doc);
    if (!current) return;
    set((s) => ({ sizes: { ...s.sizes, [doc.id]: { ...current, ...patch } } }));
  },
  setZoom: (zoom) => set({ zoom }),
  setView: (view) => set({ view }),
}));

export function useSizes(doc: MosaicDoc | undefined): Sizes | undefined {
  return sizesOf(
    useEditorStore((s) => s.sizes),
    doc,
  );
}
