import { blockMean } from "./mosaicEngine";

export interface MosaicRequest {
  id: number;
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  block: number;
}

self.onmessage = (e: MessageEvent<MosaicRequest>) => {
  const { id, data, width, height, block } = e.data;
  const out = blockMean(new ImageData(data, width, height), block);
  self.postMessage({ id, data: out.data }, { transfer: [out.data.buffer] });
};
