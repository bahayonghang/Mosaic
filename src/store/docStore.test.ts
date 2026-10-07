import {
  docIdOf,
  hasEdits,
  isUnexported,
  pushOp,
  redo,
  rotate,
  undo,
  useDocStore,
} from "./docStore";

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

  it("undoes and redoes ops of the current page; a new op clears redo", () => {
    const id = docIdOf("C:\\a.jpg");
    useDocStore.getState().addDocs([file("C:\\a.jpg")]);
    useDocStore
      .getState()
      .update(id, { pages: [{ width: 10, height: 10, ops: [], redo: [] }] });
    const op = (x: number) => ({
      type: "rect" as const,
      x,
      y: 0,
      w: 1,
      h: 1,
      block: 8,
    });
    const page = () => useDocStore.getState().docs[0].pages[0];
    const [a, b, c] = [op(0), op(1), op(2)];
    pushOp(id, a);
    pushOp(id, b);
    undo(id);
    undo(id);
    undo(id);
    expect(page()).toMatchObject({ ops: [], redo: [b, a] });
    redo(id);
    expect(page()).toMatchObject({ ops: [a], redo: [b] });
    pushOp(id, c);
    expect(page()).toMatchObject({ ops: [a, c], redo: [] });
    expect(useDocStore.getState().docs[0].version).toBe(6);
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

  it("rotates image documents in 90 degree steps as an edit", () => {
    const id = docIdOf("C:\\a.jpg");
    useDocStore.getState().addDocs([file("C:\\a.jpg")]);
    useDocStore
      .getState()
      .update(id, { pages: [{ width: 10, height: 10, ops: [], redo: [] }] });
    const doc = () => useDocStore.getState().docs[0];
    rotate(id, -1);
    expect(doc()).toMatchObject({ rotation: 270, version: 1 });
    expect(hasEdits(doc())).toBe(true);
    expect(isUnexported(doc())).toBe(true);
    expect(doc().pages[0].redo).toEqual([]);
    rotate(id, 1);
    expect(doc()).toMatchObject({ rotation: 0, version: 2 });
    expect(hasEdits(doc())).toBe(false);
    expect(isUnexported(doc())).toBe(false);
    for (let i = 0; i < 3; i++) rotate(id, 1);
    expect(doc().rotation).toBe(270);
  });

  it("does not rotate PDF documents", () => {
    const id = docIdOf("C:\\a.pdf");
    useDocStore
      .getState()
      .addDocs([{ path: "C:\\a.pdf", name: "a.pdf", kind: "pdf" }]);
    rotate(id, 1);
    expect(useDocStore.getState().docs[0]).toMatchObject({ version: 0 });
    expect(useDocStore.getState().docs[0].rotation).toBeUndefined();
  });
});
