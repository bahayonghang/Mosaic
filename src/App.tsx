import { DocumentView } from "@/components/layout/DocumentView";
import { DropOverlay } from "@/components/layout/DropOverlay";
import { EmptyState } from "@/components/layout/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Toolbar } from "@/components/layout/Toolbar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { openFilesDialog, openFolderDialog } from "@/features/import/importActions";
import { useDocumentLoader } from "@/features/import/useDocumentLoader";
import { useDragDrop } from "@/features/import/useDragDrop";
import { useOpenShortcut } from "@/features/import/useOpenShortcut";
import { useCurrentDoc, useDocStore } from "@/store/docStore";

function App() {
  const hasDocs = useDocStore((s) => s.docs.length > 0);
  const doc = useCurrentDoc();
  const dragging = useDragDrop();
  useOpenShortcut();
  useDocumentLoader();

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-full flex-col">
        <Toolbar />
        <main className="relative min-h-0 flex-1">
          {hasDocs ? (
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel defaultSize={240} minSize={180} maxSize={420} collapsible collapsedSize={0}>
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel>{doc ? <DocumentView doc={doc} /> : <div className="h-full bg-canvas" />}</ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <EmptyState
              dragging={dragging}
              onOpenFiles={() => void openFilesDialog()}
              onOpenFolder={() => void openFolderDialog()}
            />
          )}
          {hasDocs && dragging && <DropOverlay />}
        </main>
        <StatusBar />
      </div>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
