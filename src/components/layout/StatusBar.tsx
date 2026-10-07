import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatusBar() {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-chrome px-3 text-xs text-muted-foreground">
      <span>未打开文件</span>
      <div className="ml-auto flex items-center gap-0.5">
        <Button variant="ghost" size="icon-xs" disabled aria-label="缩小">
          <ZoomOut />
        </Button>
        <span className="w-10 text-center tabular-nums">100%</span>
        <Button variant="ghost" size="icon-xs" disabled aria-label="放大">
          <ZoomIn />
        </Button>
        <Button variant="ghost" size="icon-xs" disabled aria-label="适应窗口">
          <Scan />
        </Button>
      </div>
    </footer>
  );
}
