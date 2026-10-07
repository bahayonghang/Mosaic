import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PixelMark } from "@/components/layout/PixelMark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REPO_URL = "https://github.com/bahayonghang/Mosaic";

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!open || version) return;
    getVersion().then(setVersion, () => setVersion("未知"));
  }, [open, version]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader className="items-center text-center">
          <PixelMark size="lg" className="mb-2" />
          <DialogTitle>关于 Mosaic</DialogTitle>
          <DialogDescription className="tabular-nums">版本 {version ?? "…"}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 text-center text-sm">
          <p>给图片和 PDF 打马赛克的 Windows 桌面工具。导出到新文件，不覆盖原文件。</p>
          <p className="text-muted-foreground">作者：lyh</p>
          <button
            type="button"
            className="mx-auto rounded text-signal underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() =>
              void openUrl(REPO_URL).catch((e) => toast.error(`无法打开链接：${e instanceof Error ? e.message : String(e)}`))
            }
          >
            github.com/bahayonghang/Mosaic
          </button>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
