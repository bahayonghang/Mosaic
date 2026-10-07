/** CoverUP "high" quality: pages render at 200 DPI. */
export const RENDER_DPI = 200;
/** Longest raster side, to stay inside canvas limits. */
export const MAX_SIDE = 8192;

export interface PageGeometry {
  /** Page size in points, rotation applied. */
  wPt: number;
  hPt: number;
  /** Raster pixels per point. */
  scale: number;
  /** Raster size in pixels. */
  width: number;
  height: number;
}

/** Geometry of a page from its pdf.js `view` box and `/Rotate` value. */
export function pageGeometry(view: number[], rotate: number): PageGeometry {
  const w = Math.abs(view[2] - view[0]);
  const h = Math.abs(view[3] - view[1]);
  const turned = ((rotate % 360) + 360) % 180 === 90;
  const wPt = turned ? h : w;
  const hPt = turned ? w : h;
  const scale = Math.min(RENDER_DPI / 72, MAX_SIDE / Math.max(wPt, hPt));
  return {
    wPt,
    hPt,
    scale,
    width: Math.max(1, Math.round(wPt * scale)),
    height: Math.max(1, Math.round(hPt * scale)),
  };
}
