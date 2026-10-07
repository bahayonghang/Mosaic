import { useState } from "react";
import { DocumentView } from "@/components/layout/DocumentView";
import { DropOverlay } from "@/components/layout/DropOverlay";
import { EmptyState } from "@/components/layout/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Toolbar } from "@/components/layout/Toolbar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useShortcuts } from "@/features/editor/useShortcuts";
import { CloseGuard } from "@/features/export/CloseGuard";
import { openFilesDialog, openFolderDialog } from "@/features/import/importActions";
import { useDocumentLoader } from "@/features/import/useDocumentLoader";
import { useDragDrop } from "@/features/import/useDragDrop";
import { useOpenShortcut } from "@/features/import/useOpenShortcut";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useCurrentDoc, useDocStore } from "@/store/docStore";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasDocs = useDocStore((s) => s.docs.length > 0);
  const doc = useCurrentDoc();
  const dragging = useDragDrop();
  useOpenShortcut();
  useDocumentLoader();
  useShortcuts();

  return (
    <TooltipProvider delayDuration={400}>
      <div inert={settingsOpen} className="flex h-full flex-col">
        <Toolbar onOpenSettings={() => setSettingsOpen(true)} />
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
      {settingsOpen && <SettingsPage onClose={() => setSettingsOpen(false)} />}
      <CloseGuard />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
