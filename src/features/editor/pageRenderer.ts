import type { MosaicOp } from "@/store/types";
import type { MosaicRequest } from "./mosaic.worker";
import { blockMean, strokeBounds } from "./mosaicEngine";

/** Pages larger than this compute the mosaic copy in a worker. */
const WORKER_PIXELS = 4_000_000;
/** Mosaic copies kept per page (one per block size). */
const MOSAIC_CACHE = 4;

let worker: Worker | undefined;
let seq = 0;
const pending = new Map<
  number,
  {
    resolve: (d: Uint8ClampedArray<ArrayBuffer>) => void;
    reject: (e: unknown) => void;
  }
>();

function blockMeanInWorker(src: ImageData, block: number): Promise<ImageData> {
  if (!worker) {
    worker = new Worker(new URL("./mosaic.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (
      e: MessageEvent<{ id: number; data: Uint8ClampedArray<ArrayBuffer> }>,
    ) => {
      pending.get(e.data.id)?.resolve(e.data.data);
      pending.delete(e.data.id);
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(e);
      pending.clear();
    };
  }
  const id = ++seq;
  const request: MosaicRequest = {
    id,
    data: src.data as Uint8ClampedArray<ArrayBuffer>,
    width: src.width,
    height: src.height,
    block,
  };
  return new Promise((resolve, reject) => {
    pending.set(id, {
      resolve: (data) => resolve(new ImageData(data, src.width, src.height)),
      reject,
    });
    worker!.postMessage(request);
  });
}

/** Ops still to draw: a prefix match draws only the new ops, anything else redraws from the base. */
export function opsDelta(
  applied: readonly MosaicOp[],
  ops: readonly MosaicOp[],
): { reset: boolean; todo: MosaicOp[] } {
  const prefix =
    applied.length <= ops.length && applied.every((op, i) => op === ops[i]);
  return prefix
    ? { reset: false, todo: ops.slice(applied.length) }
    : { reset: true, todo: [...ops] };
}

// Shared, grow-only mask for stroke compositing.
let mask: OffscreenCanvas | undefined;

function maskContext(w: number, h: number): OffscreenCanvasRenderingContext2D {
  if (!mask || mask.width < w || mask.height < h) {
    mask = new OffscreenCanvas(
      Math.max(w, mask?.width ?? 0),
      Math.max(h, mask?.height ?? 0),
    );
  }
  return mask.getContext("2d")!;
}

/**
 * Draw the mosaic copy through a round-capped polyline of width 2r.
 * Reference: ref/ImagEdit brush (mask + composite).
 */
function drawStroke(
  ctx: OffscreenCanvasRenderingContext2D,
  mosaic: ImageBitmap,
  points: [number, number][],
  radius: number,
) {
  const { width, height } = ctx.canvas;
  const b = strokeBounds(points, radius, width, height);
  if (!b) return;
  const m = maskContext(b.w, b.h);
  m.globalCompositeOperation = "source-over";
  m.clearRect(0, 0, b.w, b.h);
  m.setTransform(1, 0, 0, 1, -b.x, -b.y);
  m.lineCap = "round";
  m.lineJoin = "round";
  m.lineWidth = radius * 2;
  m.strokeStyle = "#000";
  m.beginPath();
  m.moveTo(points[0][0], points[0][1]);
  if (points.length === 1) m.lineTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) m.lineTo(points[i][0], points[i][1]);
  m.stroke();
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = "source-in";
  m.drawImage(mosaic, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  ctx.drawImage(m.canvas, 0, 0, b.w, b.h, b.x, b.y, b.w, b.h);
}

function drawOp(
  ctx: OffscreenCanvasRenderingContext2D,
  mosaic: ImageBitmap,
  op: MosaicOp,
) {
  if (op.type === "rect")
    ctx.drawImage(mosaic, op.x, op.y, op.w, op.h, op.x, op.y, op.w, op.h);
  else drawStroke(ctx, mosaic, op.points, op.radius);
}

/** Composite of one page: base image plus mosaic ops, at raster resolution. */
export class PageRenderer {
  readonly composite: OffscreenCanvas;

  private readonly ctx: OffscreenCanvasRenderingContext2D;
  private applied: MosaicOp[] = [];
  private baseData?: ImageData;
  private mosaics = new Map<number, Promise<ImageBitmap>>();
  private queue: Promise<void> = Promise.resolve();
  private live?: ImageBitmap;
  /** Live brush pixels differ from a replay at the anti-aliased edge; the next sync replays all ops. */
  private stale = false;
  private listeners = new Set<() => void>();

  constructor(private readonly base: ImageBitmap) {
    this.composite = new OffscreenCanvas(base.width, base.height);
    this.ctx = this.composite.getContext("2d")!;
    this.ctx.drawImage(base, 0, 0);
  }

  get width() {
    return this.composite.width;
  }

  get height() {
    return this.composite.height;
  }

  /** Subscribe to composite changes; returns the unsubscribe function. */
  listen(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed() {
    for (const fn of this.listeners) fn();
  }

  /** Full mosaic copy for block size b (cached, LRU). */
  mosaic(block: number): Promise<ImageBitmap> {
    let p = this.mosaics.get(block);
    if (p) {
      this.mosaics.delete(block);
    } else {
      p = this.computeMosaic(block);
      p.catch(() => this.mosaics.delete(block));
    }
    this.mosaics.set(block, p);
    while (this.mosaics.size > MOSAIC_CACHE)
      this.mosaics.delete(this.mosaics.keys().next().value!);
    return p;
  }

  private async computeMosaic(block: number): Promise<ImageBitmap> {
    if (!this.baseData) {
      const c = new OffscreenCanvas(this.width, this.height);
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(this.base, 0, 0);
      this.baseData = cx.getImageData(0, 0, this.width, this.height);
    }
    const data =
      this.width * this.height > WORKER_PIXELS
        ? await blockMeanInWorker(this.baseData, block)
        : blockMean(this.baseData, block);
    return createImageBitmap(data);
  }

  private enqueue(task: () => void | Promise<void>): Promise<void> {
    this.queue = this.queue
      .then(task)
      .catch((e) => console.error("mosaic render failed", e));
    return this.queue;
  }

  /** Bring the composite in line with the page ops. */
  sync(ops: readonly MosaicOp[]): Promise<void> {
    return this.enqueue(async () => {
      const { reset, todo } = this.stale
        ? { reset: true, todo: [...ops] }
        : opsDelta(this.applied, ops);
      this.stale = false;
      if (todo.length === 0 && !reset) return;
      // Resolve every mosaic first, so the composite is never shown half rebuilt.
      const mosaics = new Map<number, ImageBitmap>();
      for (const op of todo)
        if (!mosaics.has(op.block))
          mosaics.set(op.block, await this.mosaic(op.block));
      if (reset) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.base, 0, 0);
      }
      for (const op of todo) drawOp(this.ctx, mosaics.get(op.block)!, op);
      this.applied = [...ops];
      this.changed();
    });
  }

  /** Wait until every queued draw is done. */
  idle(): Promise<void> {
    return this.enqueue(() => {});
  }

  /** Live brush: start a stroke with block size b. */
  beginStroke(block: number) {
    void this.enqueue(async () => {
      this.live = await this.mosaic(block);
    });
  }

  /** Live brush: paint the segment between two points (one point paints a dot). */
  paintSegment(points: [number, number][], radius: number) {
    void this.enqueue(() => {
      if (!this.live) return;
      drawStroke(this.ctx, this.live, points, radius);
      this.changed();
    });
  }

  /** Live brush: the stroke ends; the store op that follows is drawn by a full replay. */
  endStroke() {
    void this.enqueue(() => {
      this.live = undefined;
      this.stale = true;
    });
  }
}

/** Render a page off screen (export of a document that is not open in the viewport). */
export async function renderComposite(
  base: ImageBitmap,
  ops: readonly MosaicOp[],
): Promise<OffscreenCanvas> {
  const r = new PageRenderer(base);
  await r.sync(ops);
  return r.composite;
}

// The renderer of the page shown in the viewport, reused by export.
let active: { docId: string; page: number; renderer: PageRenderer } | undefined;

export function setActiveRenderer(
  docId: string,
  page: number,
  renderer: PageRenderer,
) {
  active = { docId, page, renderer };
}

export function clearActiveRenderer(renderer: PageRenderer) {
  if (active?.renderer === renderer) active = undefined;
}

export function getActiveRenderer(
  docId: string,
  page: number,
): PageRenderer | undefined {
  return active?.docId === docId && active.page === page
    ? active.renderer
    : undefined;
}
