import { docIdOf, isUnexported } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";

export interface FolderNode {
  type: "folder";
  /** Stable id for collapse state: lowercased root id plus folder names. */
  key: string;
  name: string;
  /** Full path, for the tooltip. */
  path: string;
  children: TreeNode[];
  /** Files under this folder, all levels. */
  count: number;
  /** Any file under this folder is edited and not exported. */
  unexported: boolean;
}

export type TreeNode = { type: "file"; doc: MosaicDoc } | FolderNode;

const SEP = /[\\/]/;

function folderName(root: string): string {
  const trimmed = root.replace(/[\\/]+$/, "");
  return trimmed.split(SEP).pop() || root;
}

function joinPath(base: string, name: string): string {
  return SEP.test(base.slice(-1)) ? base + name : `${base}\\${name}`;
}

/** Keys of the folders that contain `doc`, outermost first. */
export function ancestorKeys(doc: MosaicDoc): string[] {
  if (doc.root === undefined) return [];
  let key = docIdOf(doc.root);
  const keys = [key];
  for (const dir of doc.dirs ?? []) {
    key = `${key}\\${dir.toLowerCase()}`;
    keys.push(key);
  }
  return keys;
}

/**
 * Folder tree of the open documents (PRD F1-F4): one node per imported folder, files opened on
 * their own at the top level. Order is first appearance in `docs`; inside a folder, folders first.
 */
export function buildTree(docs: MosaicDoc[]): TreeNode[] {
  const top: TreeNode[] = [];
  const folders = new Map<string, FolderNode>();

  const folder = (
    key: string,
    name: string,
    path: string,
    parent: TreeNode[],
  ) => {
    let node = folders.get(key);
    if (!node) {
      node = {
        type: "folder",
        key,
        name,
        path,
        children: [],
        count: 0,
        unexported: false,
      };
      folders.set(key, node);
      parent.push(node);
    }
    return node;
  };

  for (const doc of docs) {
    if (doc.root === undefined) {
      top.push({ type: "file", doc });
      continue;
    }
    const keys = ancestorKeys(doc);
    let path = doc.root;
    let node = folder(keys[0], folderName(doc.root), path, top);
    (doc.dirs ?? []).forEach((dir, i) => {
      path = joinPath(path, dir);
      node = folder(keys[i + 1], dir, path, node.children);
    });
    node.children.push({ type: "file", doc });
  }

  const finish = (node: FolderNode) => {
    const sub = node.children.filter((c) => c.type === "folder");
    const files = node.children.filter((c) => c.type === "file");
    sub.forEach(finish);
    node.children = [...sub, ...files];
    node.count = files.length + sub.reduce((n, f) => n + f.count, 0);
    node.unexported =
      files.some((f) => isUnexported(f.doc)) || sub.some((f) => f.unexported);
  };
  for (const node of top) if (node.type === "folder") finish(node);
  return top;
}

/** Folder keys in `nodes`, parent before its children. */
export function folderKeys(nodes: readonly TreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: readonly TreeNode[]) => {
    for (const node of list) {
      if (node.type !== "folder") continue;
      keys.push(node.key);
      walk(node.children);
    }
  };
  walk(nodes);
  return keys;
}
