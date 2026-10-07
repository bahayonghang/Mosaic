import { invoke } from "@tauri-apps/api/core";
import {
  getActiveRenderer,
  renderComposite,
} from "@/features/editor/pageRenderer";
import {
  getImageBitmap,
  readImageBitmap,
} from "@/features/import/loadDocument";
import type { MosaicDoc } from "@/store/types";

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
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const png = new Uint8Array(await blob.arrayBuffer());
  return invoke<string>("export_image", png, {
    headers: {
      "x-source": encodeURIComponent(doc.path),
      "x-target": encodeURIComponent(target ?? ""),
    },
  });
}
