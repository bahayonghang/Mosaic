import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocStore } from "@/store/docStore";

export function Sidebar() {
  const count = useDocStore((s) => s.docs.length);

  return (
    <aside className="flex h-full flex-col bg-chrome">
      <div className="flex h-9 shrink-0 items-center px-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">文件</span>
        <span className="ml-1.5 tabular-nums">{count}</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {/* Document rows are added by the file-import task. */}
      </ScrollArea>
    </aside>
  );
}
