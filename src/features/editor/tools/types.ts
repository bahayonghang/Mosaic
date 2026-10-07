import type { Rect } from "../mosaicEngine";
import type { PageRenderer } from "../pageRenderer";

export type Point = [number, number];

export interface ToolContext {
  docId: string;
  renderer: PageRenderer;
  block: number;
  radius: number;
  /** Image pixels per screen pixel; drags shorter than 3 screen pixels are clicks. */
  pxPerScreen: number;
  /** Show the dashed preview rect (image pixels), or hide it with null. */
  showRect: (rect: Rect | null) => void;
}

/** One press-to-release gesture. Points are in image pixels. */
export interface ToolSession {
  move: (p: Point) => void;
  end: () => void;
}
