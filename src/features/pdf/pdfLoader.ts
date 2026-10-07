import type { PageState } from "@/store/types";

/** Replaced by the pdf-mosaic task. */
export async function loadPdf(_docId: string, _bytes: Uint8Array): Promise<PageState[]> {
  throw new Error("PDF 支持开发中");
}
