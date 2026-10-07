import { create } from "zustand";
import type { DocKind, MosaicDoc } from "./types";

export interface NewDoc {
  path: string;
  name: string;
  kind: DocKind;
}

/** Windows paths are case-insensitive and accept both separators. */
export function docIdOf(path: string): string {
  return path.replace(/\//g, "\\").toLowerCase();
}

export function hasOps(doc: MosaicDoc): boolean {
  return doc.pages.some((p) => p.ops.length > 0);
}

/** Edited since the last export (or never exported). */
export function isUnexported(doc: MosaicDoc): boolean {
  return hasOps(doc) && doc.version !== doc.exportedVersion;
}

interface DocState {
  docs: MosaicDoc[];
  currentId: string | null;
  /** Add new documents; select the first file of this import (new or already open). */
  addDocs: (files: NewDoc[]) => { added: number };
  select: (id: string) => void;
  remove: (id: string) => void;
  update: (
    id: string,
    patch: Partial<MosaicDoc> | ((doc: MosaicDoc) => Partial<MosaicDoc>),
  ) => void;
}

export const useDocStore = create<DocState>((set, get) => ({
  docs: [],
  currentId: null,

  addDocs: (files) => {
    const existing = new Set(get().docs.map((d) => d.id));
    const fresh: MosaicDoc[] = [];
    for (const f of files) {
      const id = docIdOf(f.path);
      if (existing.has(id)) continue;
      existing.add(id);
      fresh.push({
        id,
        path: f.path,
        name: f.name,
        kind: f.kind,
        status: "idle",
        pages: [],
        currentPage: 0,
        version: 0,
      });
    }
    const firstId = files.length > 0 ? docIdOf(files[0].path) : null;
    set((s) => ({
      docs: [...s.docs, ...fresh],
      currentId: firstId ?? s.currentId,
    }));
    return { added: fresh.length };
  },

  select: (id) => set({ currentId: id }),

  remove: (id) =>
    set((s) => {
      const index = s.docs.findIndex((d) => d.id === id);
      if (index < 0) return s;
      const docs = s.docs.filter((d) => d.id !== id);
      let currentId = s.currentId;
      if (currentId === id)
        currentId = (docs[index] ?? docs[index - 1])?.id ?? null;
      return { docs, currentId };
    }),

  update: (id, patch) =>
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === id
          ? { ...d, ...(typeof patch === "function" ? patch(d) : patch) }
          : d,
      ),
    })),
}));

export function useCurrentDoc(): MosaicDoc | undefined {
  return useDocStore((s) => s.docs.find((d) => d.id === s.currentId));
}
