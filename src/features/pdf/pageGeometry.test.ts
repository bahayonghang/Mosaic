import { pageGeometry } from "./pageGeometry";

describe("pageGeometry", () => {
  const a4 = [0, 0, 595, 842];

  it("renders at 200 DPI", () => {
    expect(pageGeometry(a4, 0)).toEqual({
      wPt: 595,
      hPt: 842,
      scale: 200 / 72,
      width: 1653,
      height: 2339,
    });
  });

  it("swaps width and height for 90 and 270 degree rotation", () => {
    for (const rotate of [90, 270, -90, 450]) {
      expect(pageGeometry(a4, rotate)).toMatchObject({
        wPt: 842,
        hPt: 595,
        width: 2339,
        height: 1653,
      });
    }
    expect(pageGeometry(a4, 180)).toMatchObject({ wPt: 595, hPt: 842 });
  });

  it("clamps the longest side to 8192 px", () => {
    const g = pageGeometry([0, 0, 1000, 5000], 0);
    expect(g.height).toBe(8192);
    expect(g.width).toBe(1638);
    expect(g.scale).toBeCloseTo(8192 / 5000);
  });

  it("uses the size of an offset view box", () => {
    expect(pageGeometry([10, 20, 110, 220], 0)).toMatchObject({
      wPt: 100,
      hPt: 200,
    });
  });
});
