import { create } from "zustand";
import type { DocKind, MosaicDoc, MosaicOp, PageState, Rotation } from "./types";

export interface NewDoc {
  path: string;
  name: string;
  kind: DocKind;
  root?: string;
  dirs?: string[];
}

/** Windows paths are case-insensitive and accept both separators. */
export function docIdOf(path: string): string {
  return path.replace(/\//g, "\\").toLowerCase();
}

export function hasOps(doc: MosaicDoc): boolean {
  return doc.pages.some((p) => p.ops.length > 0);
}

/** Has mosaic ops or a rotation, so an export differs from the source. */
export function hasEdits(doc: MosaicDoc): boolean {
  return hasOps(doc) || (doc.rotation ?? 0) !== 0;
}

/** Edited since the last export (or never exported). */
export function isUnexported(doc: MosaicDoc): boolean {
  return hasEdits(doc) && doc.version !== doc.exportedVersion;
}

interface DocState {
  docs: MosaicDoc[];
  currentId: string | null;
  /** Add new documents; select the first file of this import (new or already open). */
  addDocs: (files: NewDoc[]) => { added: number };
  select: (id: string) => void;
  remove: (id: string) => void;
  /** Close every document. Cached bitmaps and PDF handles are released by the caller. */
  clear: () => void;
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
        ...(f.root !== undefined && { root: f.root, dirs: f.dirs ?? [] }),
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

  clear: () => set({ docs: [], currentId: null }),

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

function updatePage(docId: string, fn: (page: PageState) => PageState | null) {
  useDocStore.getState().update(docId, (d) => {
    const page = d.pages[d.currentPage];
    const next = page && fn(page);
    if (!next) return {};
    const pages = d.pages.slice();
    pages[d.currentPage] = next;
    return { pages, version: d.version + 1 };
  });
}

/** Add an op to the current page; a new op clears redo. */
export function pushOp(docId: string, op: MosaicOp) {
  updatePage(docId, (p) => ({ ...p, ops: [...p.ops, op], redo: [] }));
}

export function undo(docId: string) {
  updatePage(docId, (p) =>
    p.ops.length === 0
      ? null
      : {
          ...p,
          ops: p.ops.slice(0, -1),
          redo: [...p.redo, p.ops[p.ops.length - 1]],
        },
  );
}

export function redo(docId: string) {
  updatePage(docId, (p) =>
    p.redo.length === 0
      ? null
      : {
          ...p,
          ops: [...p.ops, p.redo[p.redo.length - 1]],
          redo: p.redo.slice(0, -1),
        },
  );
}

/** Show page `index` (PDF). */
export function setPage(docId: string, index: number) {
  useDocStore.getState().update(docId, (d) => ({
    currentPage: Math.min(d.pages.length - 1, Math.max(0, index)),
  }));
}

/** Rotate an image document by 90 degrees: 1 clockwise, -1 counter-clockwise. Not in undo history. */
export function rotate(docId: string, dir: 1 | -1) {
  useDocStore.getState().update(docId, (d) =>
    d.kind !== "image"
      ? {}
      : {
          rotation: (((d.rotation ?? 0) + dir * 90 + 360) % 360) as Rotation,
          version: d.version + 1,
        },
  );
}

/** Record a successful export of the state at `version`. */
export function markExported(docId: string, version: number) {
  useDocStore.getState().update(docId, { exportedVersion: version });
}
