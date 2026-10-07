import { pushOp } from "@/store/docStore";
import type { Point, ToolContext, ToolSession } from "./types";

export function startBrush(start: Point, ctx: ToolContext): ToolSession {
  const { renderer, block, radius } = ctx;
  const points: Point[] = [start];
  renderer.beginStroke(block);
  renderer.paintSegment([start], radius);

  return {
    move(p) {
      const last = points[points.length - 1];
      // Skip points closer than 1 image pixel to keep the point list small.
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1) return;
      points.push(p);
      renderer.paintSegment([last, p], radius);
    },
    end() {
      renderer.endStroke();
      pushOp(ctx.docId, { type: "stroke", points, radius, block });
    },
  };
}
