import type { PDFDocumentProxy } from "pdfjs-dist";
import { pageGeometry } from "./pageGeometry";

/** Rendered pages kept in memory (P10). */
const CACHE_SIZE = 3;

/** Render page `index` (0-based) at the editing raster size. The caller owns the bitmap. */
export async function rasterize(
  pdf: PDFDocumentProxy,
  index: number,
): Promise<ImageBitmap> {
  const page = await pdf.getPage(index + 1);
  const g = pageGeometry(page.view, page.rotate);
  const canvas = document.createElement("canvas");
  canvas.width = g.width;
  canvas.height = g.height;
  try {
    await page.render({
      canvas,
      viewport: page.getViewport({ scale: g.scale }),
    }).promise;
    return await createImageBitmap(canvas);
  } finally {
    page.cleanup();
    canvas.width = canvas.height = 0;
  }
}

// Insertion order is recency order; evicted bitmaps are closed.
const cache = new Map<string, Promise<ImageBitmap>>();

export function renderPage(
  pdf: PDFDocumentProxy,
  docId: string,
  index: number,
): Promise<ImageBitmap> {
  const key = `${docId}#${index}`;
  let p = cache.get(key);
  if (p) {
    cache.delete(key);
  } else {
    p = rasterize(pdf, index);
    p.catch(() => cache.delete(key));
  }
  cache.set(key, p);
  while (cache.size > CACHE_SIZE) {
    const [oldest, old] = cache.entries().next().value!;
    cache.delete(oldest);
    old.then(
      (b) => b.close(),
      () => {},
    );
  }
  return p;
}

export function releasePages(docId: string) {
  for (const [key, p] of cache) {
    if (!key.startsWith(`${docId}#`)) continue;
    cache.delete(key);
    p.then(
      (b) => b.close(),
      () => {},
    );
  }
}
