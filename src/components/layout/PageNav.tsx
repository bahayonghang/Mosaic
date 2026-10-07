import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setPage } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";

/** PDF page navigation in the status bar (P2, P5). */
export function PageNav({ doc }: { doc: MosaicDoc }) {
  const count = doc.pages.length;
  const index = doc.currentPage;
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const n = Number.parseInt(draft ?? "", 10);
    if (Number.isFinite(n)) setPage(doc.id, n - 1);
    setDraft(null);
  };

  return (
    <div className="flex items-center gap-1">
      {doc.pages[index]?.ops.length > 0 && (
        <span className="mr-1 flex items-center gap-1.5 text-signal">
          <span className="size-1.5 rounded-full bg-signal" />
          本页已打码
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={index === 0}
        onClick={() => setPage(doc.id, index - 1)}
        aria-label="上一页"
      >
        <ChevronLeft />
      </Button>
      <input
        value={draft ?? String(index + 1)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        aria-label="页码"
        inputMode="numeric"
        className="h-5 w-9 rounded border bg-background text-center tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span className="tabular-nums">/ {count}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={index >= count - 1}
        onClick={() => setPage(doc.id, index + 1)}
        aria-label="下一页"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
