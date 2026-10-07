import { docIdOf, isUnexported, useDocStore } from "./docStore";

const file = (path: string) => ({
  path,
  name: path.split(/[\\/]/).pop()!,
  kind: "image" as const,
});

describe("docStore", () => {
  beforeEach(() => useDocStore.setState({ docs: [], currentId: null }));

  it("selects the first file of each import", () => {
    useDocStore.getState().addDocs([file("C:\\a.jpg"), file("C:\\b.png")]);
    expect(useDocStore.getState().currentId).toBe(docIdOf("C:\\a.jpg"));
    useDocStore.getState().addDocs([file("C:\\c.webp")]);
    expect(useDocStore.getState().currentId).toBe(docIdOf("C:\\c.webp"));
  });

  it("does not add an open path twice and selects the existing document", () => {
    const { addDocs } = useDocStore.getState();
    addDocs([file("C:\\a.jpg"), file("C:\\b.png")]);
    const { added } = addDocs([file("c:/A.JPG")]);
    expect(added).toBe(0);
    expect(useDocStore.getState().docs).toHaveLength(2);
    expect(useDocStore.getState().currentId).toBe(docIdOf("C:\\a.jpg"));
  });

  it("selects the next document after removing the current one", () => {
    const { addDocs, select, remove } = useDocStore.getState();
    addDocs([file("C:\\a.jpg"), file("C:\\b.png"), file("C:\\c.bmp")]);
    select(docIdOf("C:\\b.png"));
    remove(docIdOf("C:\\b.png"));
    expect(useDocStore.getState().currentId).toBe(docIdOf("C:\\c.bmp"));
    remove(docIdOf("C:\\c.bmp"));
    expect(useDocStore.getState().currentId).toBe(docIdOf("C:\\a.jpg"));
  });

  it("marks a document unexported only when it has ops after the last export", () => {
    const page = { width: 1, height: 1, ops: [], redo: [] };
    const base = {
      id: "x",
      path: "x",
      name: "x",
      kind: "image" as const,
      status: "ready" as const,
      currentPage: 0,
    };
    expect(isUnexported({ ...base, pages: [page], version: 0 })).toBe(false);
    const edited = {
      ...page,
      ops: [{ type: "rect" as const, x: 0, y: 0, w: 1, h: 1, block: 8 }],
    };
    expect(isUnexported({ ...base, pages: [edited], version: 1 })).toBe(true);
    expect(
      isUnexported({
        ...base,
        pages: [edited],
        version: 1,
        exportedVersion: 1,
      }),
    ).toBe(false);
  });
});
