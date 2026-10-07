import { pushOp } from "@/store/docStore";
import { snapRect } from "../mosaicEngine";
import type { Point, ToolContext, ToolSession } from "./types";

export function startRect(start: Point, ctx: ToolContext): ToolSession {
  const { renderer, block } = ctx;
  let end = start;
  const raw = () => ({
    x: start[0],
    y: start[1],
    w: end[0] - start[0],
    h: end[1] - start[1],
  });
  const dragged = () =>
    Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1])) >=
    3 * ctx.pxPerScreen;

  return {
    move(p) {
      end = p;
      ctx.showRect(
        dragged()
          ? snapRect(raw(), block, renderer.width, renderer.height)
          : null,
      );
    },
    end() {
      ctx.showRect(null);
      if (!dragged()) return;
      const r = snapRect(raw(), block, renderer.width, renderer.height);
      if (r) pushOp(ctx.docId, { type: "rect", ...r, block });
    },
  };
}
