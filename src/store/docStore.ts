import { create } from "zustand";
import type { MosaicDoc } from "./types";

interface DocState {
  docs: MosaicDoc[];
  currentId: string | null;
}

export const useDocStore = create<DocState>(() => ({
  docs: [],
  currentId: null,
}));
