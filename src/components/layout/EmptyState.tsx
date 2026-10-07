import { FolderOpen, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "./Kbd";
import { PixelMark } from "./PixelMark";

interface EmptyStateProps {
  onOpenFiles?: () => void;
  onOpenFolder?: () => void;
  /** True while files are dragged over the window. */
  dragging?: boolean;
}

export function EmptyState({
  onOpenFiles,
  onOpenFolder,
  dragging = false,
}: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center bg-canvas p-8">
      <div
        data-active={dragging}
        className="group flex w-full max-w-[420px] flex-col items-center rounded-xl border-[1.5px] border-dashed border-foreground/15 px-10 pt-11 pb-9 text-center transition-colors duration-200 ease-out data-[active=true]:border-signal data-[active=true]:bg-signal/5"
      >
        <PixelMark size="lg" />
        <h1 className="mt-6 text-[15px] font-semibold">
          拖入图片、PDF 或文件夹
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          支持 JPG、PNG、WebP、BMP、PDF
        </p>
        <div className="mt-7 flex items-center gap-2">
          <Button variant="signal" onClick={onOpenFiles}>
            <ImagePlus />
            打开文件
          </Button>
          <Button variant="outline" onClick={onOpenFolder}>
            <FolderOpen />
            打开文件夹
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          也可以按 <Kbd>Ctrl+O</Kbd>
        </p>
      </div>
    </div>
  );
}
