import { CircleAlert, LoaderCircle } from "lucide-react";
import { Viewport } from "@/features/editor/Viewport";
import { getImageBitmap } from "@/features/import/loadDocument";
import type { MosaicDoc } from "@/store/types";

/** Base raster of the current page. PDF pages are supplied by the PDF task. */
function pageBase(doc: MosaicDoc): ImageBitmap | undefined {
  return doc.kind === "image" ? getImageBitmap(doc.id) : undefined;
}

export function DocumentView({ doc }: { doc: MosaicDoc }) {
  const base = pageBase(doc);
  return (
    <div className="h-full bg-canvas">
      {doc.status === "error" ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <CircleAlert className="size-6 text-destructive" />
          <p className="font-medium text-foreground">{doc.name}</p>
          <p>{doc.error}</p>
        </div>
      ) : doc.status === "ready" && base ? (
        <Viewport key={doc.id} doc={doc} base={base} />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
