import type { MosaicDoc } from "./types";
import { sizesOf, useEditorStore } from "./editorStore";

const doc: MosaicDoc = {
  id: "c:\\a.jpg",
  path: "C:\\a.jpg",
  name: "a.jpg",
  kind: "image",
  status: "ready",
  pages: [{ width: 4000, height: 3000, ops: [], redo: [] }],
  currentPage: 0,
  version: 0,
};

describe("editorStore sizes", () => {
  beforeEach(() => useEditorStore.setState({ sizes: {} }));

  it("resetSizes restores the defaults of the document", () => {
    const { setSizes, resetSizes } = useEditorStore.getState();
    setSizes(doc, { block: 20, radius: 120 });
    expect(sizesOf(useEditorStore.getState().sizes, doc)).toEqual({
      block: 20,
      radius: 120,
    });
    resetSizes(doc);
    expect(useEditorStore.getState().sizes[doc.id]).toBeUndefined();
    expect(sizesOf(useEditorStore.getState().sizes, doc)).toEqual({
      block: 40,
      radius: 100,
    });
  });
});
