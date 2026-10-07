import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore, useSizes } from "@/store/editorStore";
import type { MosaicDoc } from "@/store/types";
import type { Rect } from "./mosaicEngine";
import {
  fromRotated,
  rotatedSize,
  rotateRect,
  rotationMatrix,
} from "./rotation";
import {
  clearActiveRenderer,
  PageRenderer,
  setActiveRenderer,
} from "./pageRenderer";
import { startBrush } from "./tools/brushTool";
import { startRect } from "./tools/rectTool";
import type { Point, ToolSession } from "./tools/types";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
/** Space around the image when fitted or scrolled to an edge (CSS px). */
const PAD = 32;

interface Transform {
  s: number;
  tx: number;
  ty: number;
  /** Re-fit on resize until the user zooms or pans. */
  fitted: boolean;
}

/** Center the image on an axis when it fits, else keep its edges within PAD of the view. */
function clampAxis(t: number, image: number, view: number) {
  if (image + 2 * PAD <= view) return (view - image) / 2;
  return Math.min(PAD, Math.max(view - image - PAD, t));
}

export function Viewport({ doc, base }: { doc: MosaicDoc; base: ImageBitmap }) {
  const page = doc.pages[doc.currentPage];
  const sizes = useSizes(doc)!;
  const tool = useEditorStore((s) => s.tool);
  const rotation = doc.rotation ?? 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const renderer = useMemo(() => new PageRenderer(base), [base]);
  const t = useRef<Transform>({ s: 1, tx: 0, ty: 0, fitted: true });
  const frame = useRef(0);
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);

  /** Last pointer position over the view (CSS px, view-relative), for the brush cursor. */
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const handles = useRef<{
    requestDraw: () => void;
    fit: () => void;
    apply: (next: Partial<Transform>) => void;
  }>(null);

  const updateBrushCursor = () => {
    const el = brushRef.current!;
    const p = pointer.current;
    el.hidden = !p || live.current.tool !== "brush" || live.current.space;
    if (!p || el.hidden) return;
    const d = live.current.sizes.radius * 2 * t.current.s;
    el.style.width = el.style.height = `${d}px`;
    el.style.transform = `translate(${p.x - d / 2}px, ${p.y - d / 2}px)`;
  };
  // Latest values for the long-lived event handlers below.
  const live = useRef({ renderer, tool, sizes, docId: doc.id, space, rotation });
  useEffect(() => {
    live.current = { renderer, tool, sizes, docId: doc.id, space, rotation };
    updateBrushCursor();
  });

  // A rotation changes the shown size; fit it to the window.
  useEffect(() => {
    handles.current?.fit();
  }, [rotation]);

  // The shown page's renderer is the one export reuses; a new page fits to the window.
  useEffect(() => {
    setActiveRenderer(doc.id, doc.currentPage, renderer);
    const unlisten = renderer.listen(() => handles.current?.requestDraw());
    handles.current?.fit();
    return () => {
      unlisten();
      clearActiveRenderer(renderer);
    };
  }, [renderer, doc.id, doc.currentPage]);

  useEffect(() => {
    void renderer.sync(page.ops);
  }, [renderer, page.ops]);

  // Compute the mosaic copy for the current block size before the first op needs it.
  useEffect(() => {
    void renderer.mosaic(sizes.block);
  }, [renderer, sizes.block]);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const { setZoom, setView } = useEditorStore.getState();

    const draw = () => {
      frame.current = 0;
      const r = live.current.renderer;
      const ctx = canvas.getContext("2d")!;
      const dpr = devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!r) return;
      const { s, tx, ty } = t.current;
      const rot = live.current.rotation;
      const size = rotatedSize(r.width, r.height, rot);
      ctx.save();
      ctx.shadowColor = "rgb(0 0 0 / 0.16)";
      ctx.shadowBlur = 18 * dpr;
      ctx.shadowOffsetY = 2 * dpr;
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        Math.round(tx * dpr),
        Math.round(ty * dpr),
        Math.round(size.w * s * dpr),
        Math.round(size.h * s * dpr),
      );
      ctx.restore();
      const [a, b, c, d, e, f] = rotationMatrix(r.width, r.height, rot);
      ctx.setTransform(
        dpr * s * a,
        dpr * s * b,
        dpr * s * c,
        dpr * s * d,
        dpr * (s * e + tx),
        dpr * (s * f + ty),
      );
      // Nearest-neighbor when zoomed in, so mosaic cells stay sharp.
      ctx.imageSmoothingEnabled = s < 1;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(r.composite, 0, 0);
      updateBrushCursor();
    };
    const requestDraw = () => {
      if (!frame.current) frame.current = requestAnimationFrame(draw);
    };

    const apply = (next: Partial<Transform>) => {
      const r = live.current.renderer;
      const cur = { ...t.current, ...next };
      if (r) {
        const size = rotatedSize(r.width, r.height, live.current.rotation);
        cur.tx = clampAxis(cur.tx, size.w * cur.s, container.clientWidth);
        cur.ty = clampAxis(cur.ty, size.h * cur.s, container.clientHeight);
      }
      t.current = cur;
      setZoom(cur.s);
      requestDraw();
    };
    const fit = () => {
      const r = live.current.renderer;
      if (!r) return;
      const size = rotatedSize(r.width, r.height, live.current.rotation);
      const s = Math.min(
        (container.clientWidth - 2 * PAD) / size.w,
        (container.clientHeight - 2 * PAD) / size.h,
        1,
      );
      apply({ s: Math.max(MIN_ZOOM, s), fitted: true });
    };
    const zoomAt = (px: number, py: number, factor: number) => {
      const { s, tx, ty } = t.current;
      const ns = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s * factor));
      apply({
        s: ns,
        tx: px - ((px - tx) * ns) / s,
        ty: py - ((py - ty) * ns) / s,
        fitted: false,
      });
    };

    const resize = () => {
      const dpr = devicePixelRatio;
      canvas.width = Math.round(container.clientWidth * dpr);
      canvas.height = Math.round(container.clientHeight * dpr);
      if (t.current.fitted) fit();
      else apply({});
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (e.ctrlKey || (live.current.tool === "hand" && !e.shiftKey)) {
        const box = container.getBoundingClientRect();
        zoomAt(
          e.clientX - box.left,
          e.clientY - box.top,
          Math.exp(-dy * 0.0015),
        );
      } else if (e.shiftKey) {
        apply({ tx: t.current.tx - (dx || dy), fitted: false });
      } else {
        apply({ tx: t.current.tx - dx, ty: t.current.ty - dy, fitted: false });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    const isTyping = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement &&
      e.target.matches("input, textarea, [contenteditable]");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTyping(e)) {
        e.preventDefault();
        setSpace(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Keep a handle to draw/fit for the renderer effects and the status bar.
    handles.current = { requestDraw, fit, apply };
    setView({
      zoomBy: (f) =>
        zoomAt(container.clientWidth / 2, container.clientHeight / 2, f),
      fit,
    });

    return () => {
      ro.disconnect();
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      setView(null);
      setZoom(null);
    };
  }, []);

  // Pointer gestures.
  const gesture = useRef<
    | { kind: "pan"; x: number; y: number }
    | { kind: "tool"; session: ToolSession }
    | null
  >(null);

  const toImage = (e: React.PointerEvent): Point => {
    const box = containerRef.current!.getBoundingClientRect();
    const { s, tx, ty } = t.current;
    const { renderer: r, rotation: rot } = live.current;
    return fromRotated(
      [(e.clientX - box.left - tx) / s, (e.clientY - box.top - ty) / s],
      r.width,
      r.height,
      rot,
    );
  };

  const showRect = (source: Rect | null) => {
    const el = rectRef.current!;
    el.hidden = !source;
    if (!source) return;
    const { renderer: pr, rotation: rot } = live.current;
    const r = rotateRect(source, pr.width, pr.height, rot);
    const { s, tx, ty } = t.current;
    el.style.transform = `translate(${tx + r.x * s}px, ${ty + r.y * s}px)`;
    el.style.width = `${r.w * s}px`;
    el.style.height = `${r.h * s}px`;
  };

  const trackPointer = (e: React.PointerEvent | null) => {
    if (e) {
      const box = containerRef.current!.getBoundingClientRect();
      pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top };
    } else {
      pointer.current = null;
    }
    updateBrushCursor();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (gesture.current) return;
    const {
      renderer: r,
      tool: currentTool,
      sizes: sz,
      docId,
      space: spaceDown,
    } = live.current;
    if (
      e.button === 1 ||
      (e.button === 0 && (spaceDown || currentTool === "hand"))
    ) {
      e.preventDefault();
      gesture.current = { kind: "pan", x: e.clientX, y: e.clientY };
      setPanning(true);
    } else if (
      e.button === 0 &&
      r &&
      (currentTool === "rect" || currentTool === "brush")
    ) {
      const ctx = {
        docId,
        renderer: r,
        block: sz.block,
        radius: sz.radius,
        pxPerScreen: 1 / t.current.s,
        showRect,
      };
      gesture.current = {
        kind: "tool",
        session:
          currentTool === "rect"
            ? startRect(toImage(e), ctx)
            : startBrush(toImage(e), ctx),
      };
    } else {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    trackPointer(e);
    const g = gesture.current;
    if (g?.kind === "pan") {
      handles.current?.apply({
        tx: t.current.tx + e.clientX - g.x,
        ty: t.current.ty + e.clientY - g.y,
        fitted: false,
      });
      g.x = e.clientX;
      g.y = e.clientY;
    } else if (g?.kind === "tool") {
      g.session.move(toImage(e));
    }
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.kind === "tool") g.session.end();
    setPanning(false);
  };

  const cursor = panning
    ? "cursor-grabbing"
    : space || tool === "hand"
      ? "cursor-grab"
      : tool === "brush"
        ? "cursor-none"
        : "cursor-crosshair";

  return (
    <div
      ref={containerRef}
      className={`relative h-full touch-none overflow-hidden bg-canvas ${cursor}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => trackPointer(null)}
      onAuxClick={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div
        ref={rectRef}
        hidden
        className="pointer-events-none absolute top-0 left-0 border-[1.5px] border-dashed border-signal bg-signal/10"
      />
      <div
        ref={brushRef}
        hidden
        className="pointer-events-none absolute top-0 left-0 rounded-full border border-white shadow-[0_0_0_1px_rgb(0_0_0/0.55)]"
      />
    </div>
  );
}
