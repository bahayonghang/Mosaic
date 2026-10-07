import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { hasEdits, markExported, useDocStore } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";
import { exporters } from "./exporters";

const IMAGE_FILTERS = [
  { name: "JPG", extensions: ["jpg", "jpeg"] },
  { name: "PNG", extensions: ["png"] },
  { name: "WebP", extensions: ["webp"] },
  { name: "BMP", extensions: ["bmp"] },
];

/** One export at a time, so a repeated Ctrl+S does not write two numbered copies. */
let busy = false;

const fileName = (path: string) => path.split(/[\\/]/).pop()!;
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

function currentDoc(): MosaicDoc | undefined {
  const { docs, currentId } = useDocStore.getState();
  return docs.find((d) => d.id === currentId);
}

function latest(id: string): MosaicDoc | undefined {
  return useDocStore.getState().docs.find((d) => d.id === id);
}

async function run(
  doc: MosaicDoc,
  target?: string,
  progress?: (done: number, total: number) => void,
): Promise<string> {
  const version = doc.version;
  const path = await exporters[doc.kind](doc, target, progress);
  markExported(doc.id, version);
  return path;
}

function revealAction(path: string) {
  return {
    label: "打开文件夹",
    onClick: () =>
      void invoke("reveal_in_folder", { path }).catch((e) =>
        toast.error(message(e)),
      ),
  };
}

async function exclusive(task: () => Promise<void>) {
  if (busy) return;
  busy = true;
  try {
    await task();
  } finally {
    busy = false;
  }
}

async function exportOne(doc: MosaicDoc, target?: string) {
  const id = toast.loading("正在导出…");
  try {
    const path = await run(doc, target, (done, total) => {
      if (total > 1)
        toast.loading(`正在导出第 ${Math.min(done + 1, total)} / ${total} 页`, {
          id,
        });
    });
    toast.success(`已导出：${fileName(path)}`, {
      id,
      action: revealAction(path),
    });
  } catch (e) {
    toast.error(message(e), { id });
  }
}

/** Export the current document next to its source (E9). */
export function exportCurrent(): Promise<void> {
  return exclusive(async () => {
    const doc = currentDoc();
    if (doc && hasEdits(doc)) await exportOne(doc);
  });
}

/** Save the current document to a path picked in the system dialog (E10). */
export function saveAsCurrent(): Promise<void> {
  return exclusive(async () => {
    const doc = currentDoc();
    if (!doc || !hasEdits(doc)) return;
    const dot = doc.name.lastIndexOf(".");
    const stem = dot > 0 ? doc.name.slice(0, dot) : doc.name;
    const ext = dot > 0 ? doc.name.slice(dot + 1).toLowerCase() : "";
    const dir = doc.path.slice(0, doc.path.length - doc.name.length);
    // The source format first, so the dialog preselects it.
    const filters =
      doc.kind === "pdf"
        ? [{ name: "PDF", extensions: ["pdf"] }]
        : [...IMAGE_FILTERS].sort(
            (a, b) =>
              Number(b.extensions.includes(ext)) -
              Number(a.extensions.includes(ext)),
          );
    const target = await save({
      title: "另存为",
      defaultPath: `${dir}${stem}_mosaic.${ext}`,
      filters,
    });
    const fresh = target && latest(doc.id);
    if (fresh) await exportOne(fresh, target);
  });
}

/** Export every edited document next to its source (E11). */
export function exportAll(): Promise<void> {
  return exclusive(async () => {
    const todo = useDocStore.getState().docs.filter(hasEdits);
    if (todo.length === 0) return;
    const id = toast.loading(`正在导出 0 / ${todo.length}`);
    let ok = 0;
    let lastPath = "";
    const errors: string[] = [];
    for (const [i, doc] of todo.entries()) {
      toast.loading(`正在导出 ${i + 1} / ${todo.length}`, {
        id,
        description: undefined,
      });
      const fresh = latest(doc.id);
      if (!fresh) continue;
      try {
        lastPath = await run(fresh, undefined, (done, total) => {
          if (total > 1)
            toast.loading(`正在导出 ${i + 1} / ${todo.length}`, {
              id,
              description: `第 ${Math.min(done + 1, total)} / ${total} 页`,
            });
        });
        ok++;
      } catch (e) {
        errors.push(`${doc.name}：${message(e)}`);
      }
    }
    const description =
      errors.length > 0 ? `${errors.length} 个失败（${errors[0]}）` : undefined;
    const action = ok > 0 ? revealAction(lastPath) : undefined;
    if (errors.length > 0)
      toast.warning(`已导出 ${ok} 个文件`, { id, description, action });
    else toast.success(`已导出 ${ok} 个文件`, { id, description, action });
  });
}
