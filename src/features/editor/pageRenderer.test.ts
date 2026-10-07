import type { MosaicOp } from "@/store/types";
import { opsDelta } from "./pageRenderer";

const op = (x: number): MosaicOp => ({
  type: "rect",
  x,
  y: 0,
  w: 8,
  h: 8,
  block: 8,
});

describe("opsDelta", () => {
  const a = op(0);
  const b = op(8);
  const c = op(16);

  it("draws only appended ops", () => {
    expect(opsDelta([a], [a, b, c])).toEqual({ reset: false, todo: [b, c] });
    expect(opsDelta([a, b], [a, b])).toEqual({ reset: false, todo: [] });
  });

  it("replays every op from the base after undo or a changed history", () => {
    expect(opsDelta([a, b], [a])).toEqual({ reset: true, todo: [a] });
    expect(opsDelta([a, b], [a, c])).toEqual({ reset: true, todo: [a, c] });
    expect(opsDelta([a], [])).toEqual({ reset: true, todo: [] });
  });
});
