import { invoke } from "@tauri-apps/api/core";
import {
  getActiveRenderer,
  renderComposite,
} from "@/features/editor/pageRenderer";
import { rotatedSize, rotationMatrix } from "@/features/editor/rotation";
import {
  getImageBitmap,
  readImageBitmap,
} from "@/features/import/loadDocument";
import type { MosaicDoc, Rotation } from "@/store/types";

/** PNG of the composite in the rotated orientation. The rotated copy is a CPU canvas released after encoding. */
async function encodePng(canvas: OffscreenCanvas, rotation: Rotation): Promise<Blob> {
  if (rotation === 0) return canvas.convertToBlob({ type: "image/png" });
  const { width: w, height: h } = canvas;
  const size = rotatedSize(w, h, rotation);
  const out = new OffscreenCanvas(size.w, size.h);
  try {
    const ctx = out.getContext("2d", { willReadFrequently: true })!;
    ctx.setTransform(...rotationMatrix(w, h, rotation));
    ctx.drawImage(canvas, 0, 0);
    return await out.convertToBlob({ type: "image/png" });
  } finally {
    out.width = out.height = 0;
  }
}

/** Composite -> PNG -> Rust, which re-encodes in the target format. Returns the written path. */
export async function exportImage(
  doc: MosaicDoc,
  target?: string,
): Promise<string> {
  const ops = doc.pages[0].ops;
  let canvas: OffscreenCanvas;
  const active = getActiveRenderer(doc.id, 0);
  if (active) {
    await active.sync(ops);
    canvas = active.composite;
  } else {
    const cached = getImageBitmap(doc.id);
    const base = cached ?? (await readImageBitmap(doc));
    try {
      canvas = await renderComposite(base, ops);
    } finally {
      if (!cached) base.close();
    }
  }
  const blob = await encodePng(canvas, doc.rotation ?? 0);
  const png = new Uint8Array(await blob.arrayBuffer());
  return invoke<string>("export_image", png, {
    headers: {
      "x-source": encodeURIComponent(doc.path),
      "x-target": encodeURIComponent(target ?? ""),
    },
  });
}
