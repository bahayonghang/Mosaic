import { CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Viewport } from "@/features/editor/Viewport";
import { getImageBitmap } from "@/features/import/loadDocument";
import { renderPage } from "@/features/pdf/pageCache";
import { getPdf } from "@/features/pdf/pdfLoader";
import type { MosaicDoc } from "@/store/types";

interface PageBase {
  key: string;
  base?: ImageBitmap;
  error?: string;
}

/** Base raster of the current page: the decoded image, or the PDF page rendered on demand. */
function usePageBase(doc: MosaicDoc): Omit<PageBase, "key"> {
  const key = `${doc.id}#${doc.currentPage}`;
  const pdf =
    doc.kind === "pdf" && doc.status === "ready" ? getPdf(doc.id) : undefined;
  const [state, setState] = useState<PageBase>();

  useEffect(() => {
    if (!pdf) return;
    let alive = true;
    renderPage(pdf, doc.id, doc.currentPage).then(
      (base) => alive && setState({ key, base }),
      (e) =>
        alive &&
        setState({ key, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
  }, [pdf, key, doc.id, doc.currentPage]);

  if (doc.kind === "image") return { base: getImageBitmap(doc.id) };
  return state?.key === key ? state : {};
}

export function DocumentView({ doc }: { doc: MosaicDoc }) {
  const { base, error } = usePageBase(doc);
  const message = doc.status === "error" ? doc.error : error;
  return (
    <div className="h-full bg-canvas">
      {message ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <CircleAlert className="size-6 text-destructive" />
          <p className="font-medium text-foreground">{doc.name}</p>
          <p>{message}</p>
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
