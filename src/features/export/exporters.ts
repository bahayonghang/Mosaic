import type { DocKind, MosaicDoc } from "@/store/types";
import { exportImage } from "./exportImage";
import { exportPdf } from "./exportPdf";

/**
 * Writes the mosaicked document; without `target` next to the source. Returns the written path.
 * `progress` reports pages done for multi-page documents.
 */
export type Exporter = (
  doc: MosaicDoc,
  target?: string,
  progress?: (done: number, total: number) => void,
) => Promise<string>;

export const exporters: Record<DocKind, Exporter> = {
  image: exportImage,
  pdf: exportPdf,
};
