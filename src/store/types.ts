export type DocKind = "image" | "pdf";

export type MosaicOp =
  | { type: "rect"; x: number; y: number; w: number; h: number; block: number }
  | { type: "stroke"; points: [number, number][]; radius: number; block: number };

export interface PageState {
  /** Raster pixels used for editing and export. */
  width: number;
  height: number;
  ops: MosaicOp[];
  redo: MosaicOp[];
  /** PDF only: page size in points, rotation applied. */
  pdfPointSize?: { w: number; h: number };
}

export interface MosaicDoc {
  id: string;
  path: string;
  name: string;
  kind: DocKind;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  pages: PageState[];
  currentPage: number;
  /** Increments on every op change. */
  version: number;
  /** `version` at the last successful export. */
  exportedVersion?: number;
}
