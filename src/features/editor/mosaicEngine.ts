// Mosaic math. Reference: ref/ImagEdit/imagedit/redaction.py:31-43 (downscale by block, upscale nearest).
// The mean is computed here over ImageData, not by canvas smoothing, so results are deterministic.

export const BLOCK_MIN = 4;
export const BLOCK_MAX = 96;
export const RADIUS_MIN = 4;
export const RADIUS_MAX = 400;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function defaultBlock(width: number, height: number): number {
  return clamp(Math.round(Math.max(width, height) / 100), 8, 48);
}

export function defaultRadius(width: number, height: number): number {
  return clamp(Math.round(Math.max(width, height) / 40), 8, 200);
}

/**
 * Fully pixelated copy: the grid starts at (0, 0); each b x b cell (edge cells smaller)
 * gets the mean RGBA of its source pixels.
 */
export function blockMean(src: ImageData, b: number): ImageData {
  const { width: w, height: h, data } = src;
  const out = new Uint8ClampedArray(data.length);
  const cols = Math.ceil(w / b);
  const sums = new Float64Array(cols * 4);

  for (let y0 = 0; y0 < h; y0 += b) {
    const y1 = Math.min(h, y0 + b);
    sums.fill(0);
    for (let y = y0; y < y1; y++) {
      let i = y * w * 4;
      for (let x = 0; x < w; x++, i += 4) {
        const c = ((x / b) | 0) * 4;
        sums[c] += data[i];
        sums[c + 1] += data[i + 1];
        sums[c + 2] += data[i + 2];
        sums[c + 3] += data[i + 3];
      }
    }
    for (let cx = 0; cx < cols; cx++) {
      const x0 = cx * b;
      const x1 = Math.min(w, x0 + b);
      const n = (x1 - x0) * (y1 - y0);
      const c = cx * 4;
      const r = Math.round(sums[c] / n);
      const g = Math.round(sums[c + 1] / n);
      const bl = Math.round(sums[c + 2] / n);
      const a = Math.round(sums[c + 3] / n);
      for (let y = y0; y < y1; y++) {
        let i = (y * w + x0) * 4;
        for (let x = x0; x < x1; x++, i += 4) {
          out[i] = r;
          out[i + 1] = g;
          out[i + 2] = bl;
          out[i + 3] = a;
        }
      }
    }
  }
  return new ImageData(out, w, h);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Normalize a dragged rect, snap it outward to the b grid, and clip it to the image. */
export function snapRect(
  r: Rect,
  b: number,
  width: number,
  height: number,
): Rect | null {
  const left = Math.min(r.x, r.x + r.w);
  const top = Math.min(r.y, r.y + r.h);
  const right = Math.max(r.x, r.x + r.w);
  const bottom = Math.max(r.y, r.y + r.h);
  const x0 = clamp(Math.floor(left / b) * b, 0, width);
  const y0 = clamp(Math.floor(top / b) * b, 0, height);
  const x1 = clamp(Math.ceil(right / b) * b, 0, width);
  const y1 = clamp(Math.ceil(bottom / b) * b, 0, height);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Bounding box of a stroke, padded by the radius and clipped to the image. */
export function strokeBounds(
  points: [number, number][],
  radius: number,
  width: number,
  height: number,
): Rect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const x0 = clamp(Math.floor(minX - radius - 1), 0, width);
  const y0 = clamp(Math.floor(minY - radius - 1), 0, height);
  const x1 = clamp(Math.ceil(maxX + radius + 1), 0, width);
  const y1 = clamp(Math.ceil(maxY + radius + 1), 0, height);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
