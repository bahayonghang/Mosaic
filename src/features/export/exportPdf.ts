import { invoke } from "@tauri-apps/api/core";
import { renderComposite } from "@/features/editor/pageRenderer";
import { rasterize } from "@/features/pdf/pageCache";
import { getPdf } from "@/features/pdf/pdfLoader";
import type { MosaicDoc } from "@/store/types";

const CHUNK = 8 * 1024 * 1024;

/** Rasterize every page with its ops into a new PDF (D4). Returns the written path. */
export async function exportPdf(
  doc: MosaicDoc,
  target?: string,
  progress?: (done: number, total: number) => void,
): Promise<string> {
  const pdf = getPdf(doc.id);
  if (!pdf) throw new Error("文件已关闭");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create({ updateMetadata: false });
  out.setProducer("Mosaic");
  out.setCreator("Mosaic");
  const total = doc.pages.length;
  for (const [i, page] of doc.pages.entries()) {
    progress?.(i, total);
    // Bypass the page cache so the pages around the viewport stay cached.
    const base = await rasterize(pdf, i);
    let jpg: ArrayBuffer;
    try {
      const canvas = await renderComposite(base, page.ops);
      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.9,
      });
      canvas.width = canvas.height = 0;
      jpg = await blob.arrayBuffer();
    } finally {
      base.close();
    }
    const image = await out.embedJpg(jpg);
    const { w, h } = page.pdfPointSize!;
    out.addPage([w, h]).drawImage(image, { x: 0, y: 0, width: w, height: h });
    await new Promise((r) => setTimeout(r, 0));
  }
  progress?.(total, total);
  const bytes = await out.save({ useObjectStreams: true });
  // WebView2 holds about 15 times the request body while it sends it, so large files go in chunks.
  let path = target ?? "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    path = await invoke<string>(
      "write_export",
      bytes.subarray(offset, offset + CHUNK),
      {
        headers: {
          "x-source": encodeURIComponent(doc.path),
          "x-target": encodeURIComponent(path),
          "x-offset": String(offset),
        },
      },
    );
  }
  return path;
}
