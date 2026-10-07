import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PageState } from "@/store/types";
import { releasePages } from "./pageCache";
import { pageGeometry } from "./pageGeometry";

/**
 * CMaps, fonts, ICC profiles and wasm decoders.
 * Dev serves those directories from /node_modules/pdfjs-dist/; the build copies them to dist/pdfjs/.
 * The worker is always /pdfjs/pdf.worker.min.mjs: a prebuilt 1.2 MB file, not a bundled chunk.
 */
const ASSET_ROOT = import.meta.env.DEV ? "/node_modules/pdfjs-dist/" : "/pdfjs/";
const WORKER_SRC = "/pdfjs/pdf.worker.min.mjs";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | undefined;

function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    return pdfjs;
  });
  return pdfjsPromise;
}

// Open documents, outside the store (not serializable).
const handles = new Map<string, PDFDocumentProxy>();

export async function openPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const { getDocument } = await loadPdfjs();
  try {
    return await getDocument({
      data: bytes,
      cMapUrl: ASSET_ROOT + "cmaps/",
      standardFontDataUrl: ASSET_ROOT + "standard_fonts/",
      iccUrl: ASSET_ROOT + "iccs/",
      wasmUrl: ASSET_ROOT + "wasm/",
    }).promise;
  } catch (e) {
    if (e instanceof Error && e.name === "PasswordException")
      throw new Error("暂不支持受密码保护的 PDF", { cause: e });
    throw new Error("无法打开此 PDF", { cause: e });
  }
}

/** Open a PDF and describe its pages; pages are rendered on demand by pageCache. */
export async function loadPdf(
  docId: string,
  bytes: Uint8Array,
): Promise<PageState[]> {
  const pdf = await openPdf(bytes);
  releasePdf(docId);
  handles.set(docId, pdf);
  const pages: PageState[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const g = pageGeometry(page.view, page.rotate);
    pages.push({
      width: g.width,
      height: g.height,
      ops: [],
      redo: [],
      pdfPointSize: { w: g.wPt, h: g.hPt },
    });
  }
  return pages;
}

export function getPdf(docId: string): PDFDocumentProxy | undefined {
  return handles.get(docId);
}

export function releasePdf(docId: string) {
  releasePages(docId);
  void handles.get(docId)?.loadingTask.destroy();
  handles.delete(docId);
}
