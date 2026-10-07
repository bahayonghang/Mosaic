import { CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { getImageBitmap } from "@/features/import/loadDocument";
import type { MosaicDoc } from "@/store/types";

/** Fitted, read-only preview. The editor task replaces the ready branch with the editing viewport. */
function ImagePreview({ doc }: { doc: MosaicDoc }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const bitmap = getImageBitmap(doc.id);
    if (!canvas || !bitmap) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  }, [doc]);
  return (
    <div className="flex h-full items-center justify-center p-6">
      <canvas ref={ref} className="max-h-full max-w-full object-contain shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_rgb(0_0_0/0.08)]" />
    </div>
  );
}

export function DocumentView({ doc }: { doc: MosaicDoc }) {
  return (
    <div className="h-full bg-canvas">
      {doc.status === "error" ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <CircleAlert className="size-6 text-destructive" />
          <p className="font-medium text-foreground">{doc.name}</p>
          <p>{doc.error}</p>
        </div>
      ) : doc.status === "ready" ? (
        <ImagePreview doc={doc} />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
