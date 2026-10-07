import type { Rotation } from "@/store/types";
import { fromRotated, rotatedSize, rotateRect, toRotated } from "./rotation";

const W = 400;
const H = 300;
const all: Rotation[] = [0, 90, 180, 270];

describe("rotation", () => {
  it("swaps the size at 90 and 270 degrees", () => {
    expect(rotatedSize(W, H, 0)).toEqual({ w: 400, h: 300 });
    expect(rotatedSize(W, H, 90)).toEqual({ w: 300, h: 400 });
    expect(rotatedSize(W, H, 180)).toEqual({ w: 400, h: 300 });
    expect(rotatedSize(W, H, 270)).toEqual({ w: 300, h: 400 });
  });

  it("maps the source corners clockwise", () => {
    // The source top-left corner goes to the rotated top-right, bottom-right, bottom-left.
    expect(toRotated([0, 0], W, H, 90)).toEqual([300, 0]);
    expect(toRotated([0, 0], W, H, 180)).toEqual([400, 300]);
    expect(toRotated([0, 0], W, H, 270)).toEqual([0, 400]);
    // The source bottom-left corner goes to the rotated top-left at 90 degrees.
    expect(toRotated([0, 300], W, H, 90)).toEqual([0, 0]);
  });

  it("round-trips points for every rotation", () => {
    for (const r of all)
      for (const p of [
        [0, 0],
        [12.5, 250],
        [400, 300],
      ] as [number, number][])
        expect(fromRotated(toRotated(p, W, H, r), W, H, r)).toEqual(p);
  });

  it("keeps rect size and stays inside the rotated image", () => {
    const rect = { x: 40, y: 80, w: 120, h: 40 };
    for (const r of all) {
      const q = rotateRect(rect, W, H, r);
      const size = rotatedSize(W, H, r);
      expect(q.w * q.h).toBe(rect.w * rect.h);
      expect(q.x).toBeGreaterThanOrEqual(0);
      expect(q.y).toBeGreaterThanOrEqual(0);
      expect(q.x + q.w).toBeLessThanOrEqual(size.w);
      expect(q.y + q.h).toBeLessThanOrEqual(size.h);
    }
    expect(rotateRect(rect, W, H, 90)).toEqual({
      x: 180,
      y: 40,
      w: 40,
      h: 120,
    });
  });
});
