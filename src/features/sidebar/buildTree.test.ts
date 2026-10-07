import { docIdOf } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";
import {
  ancestorKeys,
  buildTree,
  type FolderNode,
  type TreeNode,
} from "./buildTree";

function doc(
  path: string,
  root?: string,
  dirs?: string[],
  edited = false,
): MosaicDoc {
  return {
    id: docIdOf(path),
    path,
    name: path.split(/[\\/]/).pop()!,
    kind: "image",
    ...(root !== undefined && { root, dirs: dirs ?? [] }),
    status: "ready",
    pages: [
      {
        width: 10,
        height: 10,
        ops: edited ? [{ type: "rect", x: 0, y: 0, w: 1, h: 1, block: 1 }] : [],
        redo: [],
      },
    ],
    currentPage: 0,
    version: edited ? 1 : 0,
  };
}

/** Indented outline: folders as `name/ (count)`, files by name. */
function outline(nodes: TreeNode[], depth = 0): string[] {
  return nodes.flatMap((n) =>
    n.type === "file"
      ? ["  ".repeat(depth) + n.doc.name]
      : [
          "  ".repeat(depth) + `${n.name}/ (${n.count})`,
          ...outline(n.children, depth + 1),
        ],
  );
}

const R = "D:\\证书";

describe("buildTree", () => {
  it("follows the folder structure, folders before files, loose files at the top level", () => {
    const tree = buildTree([
      doc(`${R}\\2024\\b.png`, R, ["2024"]),
      doc(`${R}\\2024\\省赛\\c.pdf`, R, ["2024", "省赛"]),
      doc(`${R}\\a.jpg`, R, []),
      doc("E:\\x.png"),
    ]);
    expect(outline(tree)).toEqual([
      "证书/ (3)",
      "  2024/ (2)",
      "    省赛/ (1)",
      "      c.pdf",
      "    b.png",
      "  a.jpg",
      "x.png",
    ]);
    const sub = (tree[0] as FolderNode).children[0] as FolderNode;
    expect(sub.path).toBe(`${R}\\2024`);
    expect(sub.key).toBe(`${docIdOf(R)}\\2024`);
  });

  it("keeps the first appearance order at the top level", () => {
    const tree = buildTree([
      doc("E:\\x.png"),
      doc(`${R}\\a.jpg`, R),
      doc("E:\\y.png"),
    ]);
    expect(outline(tree)).toEqual(["x.png", "证书/ (1)", "  a.jpg", "y.png"]);
  });

  it("merges two imports of one folder and names a drive root", () => {
    const tree = buildTree([
      doc(`${R}\\a.jpg`, R),
      doc("D:\\证书\\b.jpg", "d:/证书"),
      doc("D:\\c.png", "D:\\"),
    ]);
    expect(outline(tree)).toEqual([
      "证书/ (2)",
      "  a.jpg",
      "  b.jpg",
      "D:/ (1)",
      "  c.png",
    ]);
    expect((tree[1] as FolderNode).path).toBe("D:\\");
  });

  it("marks folders that contain unexported documents", () => {
    const tree = buildTree([
      doc(`${R}\\2024\\c.pdf`, R, ["2024"], true),
      doc(`${R}\\a.jpg`, R),
    ]);
    const root = tree[0] as FolderNode;
    expect(root.unexported).toBe(true);
    expect((root.children[0] as FolderNode).unexported).toBe(true);
    expect(buildTree([doc(`${R}\\a.jpg`, R)])[0]).toMatchObject({
      unexported: false,
    });
  });

  it("builds folders from documents only, so no folder is empty", () => {
    expect(outline(buildTree([doc(`${R}\\a.jpg`, R)]))).toEqual([
      "证书/ (1)",
      "  a.jpg",
    ]);
    expect(buildTree([])).toEqual([]);
  });

  it("lists ancestor keys outermost first", () => {
    expect(
      ancestorKeys(doc(`${R}\\2024\\省赛\\c.pdf`, R, ["2024", "省赛"])),
    ).toEqual([docIdOf(R), `${docIdOf(R)}\\2024`, `${docIdOf(R)}\\2024\\省赛`]);
    expect(ancestorKeys(doc("E:\\x.png"))).toEqual([]);
  });
});
