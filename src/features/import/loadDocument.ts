import { invoke } from "@tauri-apps/api/core";
import { getPdf, loadPdf, releasePdf } from "@/features/pdf/pdfLoader";
import { useDocStore } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";

/** Chromium canvas area limit. */
const MAX_PIXELS = 268_435_456;
/** Bitmaps kept in memory: the current document plus the 2 most recently used. */
const CACHE_SIZE = 3;

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  bmp: "image/bmp",
};

// Insertion order is recency order: a hit is deleted and re-inserted.
const bitmaps = new Map<string, ImageBitmap>();

export function getImageBitmap(docId: string): ImageBitmap | undefined {
  const bitmap = bitmaps.get(docId);
  if (bitmap) {
    bitmaps.delete(docId);
    bitmaps.set(docId, bitmap);
  }
  return bitmap;
}

function cacheBitmap(docId: string, bitmap: ImageBitmap) {
  bitmaps.get(docId)?.close();
  bitmaps.delete(docId);
  bitmaps.set(docId, bitmap);
  while (bitmaps.size > CACHE_SIZE) {
    const [oldest, old] = bitmaps.entries().next().value!;
    old.close();
    bitmaps.delete(oldest);
  }
}

export function releaseDocument(docId: string) {
  bitmaps.get(docId)?.close();
  bitmaps.delete(docId);
  releasePdf(docId);
}

export function needsLoad(doc: MosaicDoc): boolean {
  if (doc.status === "idle") return true;
  if (doc.status !== "ready") return false;
  return doc.kind === "image" ? !bitmaps.has(doc.id) : !getPdf(doc.id);
}

async function decodeImage(doc: MosaicDoc, bytes: Uint8Array<ArrayBuffer>): Promise<ImageBitmap> {
  const ext = doc.name.split(".").pop()?.toLowerCase() ?? "";
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: MIME[ext] }), { imageOrientation: "from-image" });
  } catch {
    throw new Error("无法解码此图片");
  }
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new Error("图片尺寸过大（上限约 2.68 亿像素）");
  }
  return bitmap;
}

/** Read and decode a document. Ops already in the store are kept. */
export async function loadDocument(doc: MosaicDoc): Promise<void> {
  const { update } = useDocStore.getState();
  update(doc.id, { status: "loading", error: undefined });
  try {
    const buffer = await invoke<ArrayBuffer>("read_file", { path: doc.path });
    const bytes = new Uint8Array(buffer);
    if (doc.kind === "pdf") {
      const pages = await loadPdf(doc.id, bytes);
      update(doc.id, (d) => ({ status: "ready", pages: d.pages.length > 0 ? d.pages : pages }));
      return;
    }
    const bitmap = await decodeImage(doc, bytes);
    cacheBitmap(doc.id, bitmap);
    update(doc.id, (d) => ({
      status: "ready",
      pages: d.pages.length > 0 ? d.pages : [{ width: bitmap.width, height: bitmap.height, ops: [], redo: [] }],
    }));
  } catch (e) {
    update(doc.id, { status: "error", error: e instanceof Error ? e.message : String(e) });
  }
}

/** Read and decode an image without caching it (export of a document that is not shown). */
export async function readImageBitmap(doc: MosaicDoc): Promise<ImageBitmap> {
  const buffer = await invoke<ArrayBuffer>("read_file", { path: doc.path });
  return decodeImage(doc, new Uint8Array(buffer));
}
