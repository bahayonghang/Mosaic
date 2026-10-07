// Dev-only: lets the UI run in a plain browser (no Tauri runtime) for visual checks.
// Loaded from main.tsx only when import.meta.env.DEV is true and Tauri is absent.
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { useDocStore } from "@/store/docStore";

mockWindows("main");
mockIPC(async (cmd, args) => {
  const a = args as Record<string, unknown>;
  if (cmd === "read_file") {
    const res = await fetch(`/@fs/${String(a.path).replaceAll("\\", "/")}`);
    if (!res.ok) throw new Error(`文件无法读取：${res.status}`);
    return await res.arrayBuffer();
  }
  if (cmd === "scan_paths") {
    const files = (a.paths as string[]).map((path) => {
      const name = path.split(/[\\/]/).pop()!;
      return {
        path,
        name,
        kind: name.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
        size: 0,
      };
    });
    return { files, ignored: 0, skippedDirs: 0 };
  }
  return null;
});

Object.assign(window, { __mosaic: { useDocStore } });
