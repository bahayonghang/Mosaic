import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentDoc } from "@/store/docStore";
import { useEditorStore } from "@/store/editorStore";

export function StatusBar() {
  const doc = useCurrentDoc();
  const page = doc?.status === "ready" ? doc.pages[doc.currentPage] : undefined;
  const zoom = useEditorStore((s) => s.zoom);
  const view = useEditorStore((s) => s.view);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-chrome px-3 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {page
          ? `${page.width} × ${page.height}`
          : doc
            ? doc.name
            : "未打开文件"}
      </span>
      <div className="ml-auto flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!view}
          onClick={() => view?.zoomBy(0.8)}
          aria-label="缩小"
        >
          <ZoomOut />
        </Button>
        <span className="w-10 text-center tabular-nums">
          {zoom === null ? "–" : `${Math.round(zoom * 100)}%`}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!view}
          onClick={() => view?.zoomBy(1.25)}
          aria-label="放大"
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!view}
          onClick={() => view?.fit()}
          aria-label="适应窗口"
        >
          <Scan />
        </Button>
      </div>
    </footer>
  );
}
