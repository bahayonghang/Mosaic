import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { useDocStore, type NewDoc } from "@/store/docStore";

interface ScanResult {
  files: (NewDoc & { size: number })[];
  ignored: number;
  skippedDirs: number;
}

export async function importPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  let result: ScanResult;
  try {
    result = await invoke<ScanResult>("scan_paths", { paths });
  } catch (e) {
    toast.error(String(e));
    return;
  }

  const notes: string[] = [];
  if (result.ignored > 0) notes.push(`已忽略 ${result.ignored} 个不支持的文件`);
  if (result.skippedDirs > 0) notes.push(`${result.skippedDirs} 个项目无法读取`);
  const description = notes.join("，") || undefined;

  if (result.files.length === 0) {
    toast.warning("没有找到支持的文件", { description });
    return;
  }
  const { added } = useDocStore.getState().addDocs(result.files);
  if (added > 0) toast.success(`已导入 ${added} 个文件`, { description });
  else toast.info("文件已在列表中", { description });
}

export async function openFilesDialog(): Promise<void> {
  const picked = await open({
    multiple: true,
    title: "打开文件",
    filters: [{ name: "图片和 PDF", extensions: [...SUPPORTED_EXTENSIONS] }],
  });
  if (picked) await importPaths(picked);
}

export async function openFolderDialog(): Promise<void> {
  const picked = await open({ directory: true, title: "打开文件夹" });
  if (picked) await importPaths([picked]);
}
