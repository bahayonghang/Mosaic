import type { DocKind, MosaicDoc } from "@/store/types";
import { exportImage } from "./exportImage";

/** Writes the mosaicked document; without `target` next to the source. Returns the written path. */
export type Exporter = (doc: MosaicDoc, target?: string) => Promise<string>;

/** One exporter per document kind. `10-06-pdf-mosaic` registers `pdf`. */
export const exporters: Partial<Record<DocKind, Exporter>> = {
  image: exportImage,
};
