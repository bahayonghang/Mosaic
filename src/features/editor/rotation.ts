// Clockwise 90 degree rotation between source raster pixels and the rotated (shown, exported) image.
import type { Rotation } from "@/store/types";
import type { Rect } from "./mosaicEngine";
import type { Point } from "./tools/types";

export function rotatedSize(
  w: number,
  h: number,
  r: Rotation,
): { w: number; h: number } {
  return r === 90 || r === 270 ? { w: h, h: w } : { w, h };
}

/** Canvas `setTransform(a, b, c, d, e, f)` from source to rotated: qx = a*x + c*y + e, qy = b*x + d*y + f. */
export function rotationMatrix(
  w: number,
  h: number,
  r: Rotation,
): [number, number, number, number, number, number] {
  switch (r) {
    case 0:
      return [1, 0, 0, 1, 0, 0];
    case 90:
      return [0, 1, -1, 0, h, 0];
    case 180:
      return [-1, 0, 0, -1, w, h];
    case 270:
      return [0, -1, 1, 0, 0, w];
  }
}

export function toRotated(
  [x, y]: Point,
  w: number,
  h: number,
  r: Rotation,
): Point {
  const [a, b, c, d, e, f] = rotationMatrix(w, h, r);
  return [a * x + c * y + e, b * x + d * y + f];
}

export function fromRotated(
  [qx, qy]: Point,
  w: number,
  h: number,
  r: Rotation,
): Point {
  switch (r) {
    case 0:
      return [qx, qy];
    case 90:
      return [qy, h - qx];
    case 180:
      return [w - qx, h - qy];
    case 270:
      return [w - qy, qx];
  }
}

/** A source rect in rotated coordinates (still axis-aligned for 90 degree steps). */
export function rotateRect(
  rect: Rect,
  w: number,
  h: number,
  r: Rotation,
): Rect {
  const [x0, y0] = toRotated([rect.x, rect.y], w, h, r);
  const [x1, y1] = toRotated([rect.x + rect.w, rect.y + rect.h], w, h, r);
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  };
}
