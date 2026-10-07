import {
  blockMean,
  defaultBlock,
  defaultRadius,
  snapRect,
  strokeBounds,
} from "./mosaicEngine";

/** Gray image where each pixel value is given; alpha 255. */
function gray(width: number, height: number, values: number[]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  values.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  return new ImageData(data, width, height);
}

const reds = (img: ImageData) =>
  Array.from({ length: img.width * img.height }, (_, i) => img.data[i * 4]);

describe("blockMean", () => {
  it("averages each block of a 4 x 4 image", () => {
    // prettier-ignore
    const img = gray(4, 4, [
      0, 10, 100, 100,
      20, 30, 100, 100,
      50, 50, 1, 3,
      50, 50, 5, 7,
    ]);
    // prettier-ignore
    expect(reds(blockMean(img, 2))).toEqual([
      15, 15, 100, 100,
      15, 15, 100, 100,
      50, 50, 4, 4,
      50, 50, 4, 4,
    ]);
  });

  it("averages smaller edge cells on their own pixels", () => {
    // 3 x 3 with b = 2: cells are 2x2, 1x2, 2x1, 1x1.
    const img = gray(3, 3, [0, 4, 9, 8, 4, 9, 2, 2, 7]);
    expect(reds(blockMean(img, 2))).toEqual([4, 4, 9, 4, 4, 9, 2, 2, 7]);
  });

  it("keeps the mean alpha", () => {
    const data = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255]);
    expect(Array.from(blockMean(new ImageData(data, 2, 1), 2).data)).toEqual([
      0, 0, 0, 128, 0, 0, 0, 128,
    ]);
  });
});

describe("snapRect", () => {
  it("snaps outward to the grid and normalizes a reversed drag", () => {
    expect(snapRect({ x: 13, y: 9, w: -6, h: 10 }, 8, 100, 100)).toEqual({
      x: 0,
      y: 8,
      w: 16,
      h: 16,
    });
  });

  it("clips to the image and drops empty rects", () => {
    expect(snapRect({ x: 90, y: -5, w: 30, h: 10 }, 8, 100, 50)).toEqual({
      x: 88,
      y: 0,
      w: 12,
      h: 8,
    });
    expect(snapRect({ x: 120, y: 10, w: 10, h: 10 }, 8, 100, 100)).toBeNull();
  });
});

describe("strokeBounds", () => {
  it("pads by the radius and clips", () => {
    expect(
      strokeBounds(
        [
          [10, 10],
          [30, 20],
        ],
        5,
        100,
        100,
      ),
    ).toEqual({ x: 4, y: 4, w: 32, h: 22 });
    expect(strokeBounds([[2, 2]], 5, 100, 100)).toEqual({
      x: 0,
      y: 0,
      w: 8,
      h: 8,
    });
  });
});

describe("defaults", () => {
  it("scale with the image size inside their limits", () => {
    expect(defaultBlock(4000, 3000)).toBe(40);
    expect(defaultBlock(300, 200)).toBe(8);
    expect(defaultBlock(10000, 100)).toBe(48);
    expect(defaultRadius(4000, 3000)).toBe(100);
    expect(defaultRadius(200, 100)).toBe(8);
  });
});
