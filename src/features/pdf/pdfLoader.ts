import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PageState } from "@/store/types";
import { releasePages } from "./pageCache";
import { pageGeometry } from "./pageGeometry";

GlobalWorkerOptions.workerSrc = workerUrl;

/** CMaps, fonts, ICC profiles and wasm decoders; see the pdfjsAssets plugin in vite.config.ts. */
const ASSETS = import.meta.env.DEV ? "/node_modules/pdfjs-dist/" : "/pdfjs/";

// Open documents, outside the store (not serializable).
const handles = new Map<string, PDFDocumentProxy>();

export async function openPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({
      data: bytes,
      cMapUrl: ASSETS + "cmaps/",
      standardFontDataUrl: ASSETS + "standard_fonts/",
      iccUrl: ASSETS + "iccs/",
      wasmUrl: ASSETS + "wasm/",
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
