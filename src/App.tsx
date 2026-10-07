import { EmptyState } from "@/components/layout/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Toolbar } from "@/components/layout/Toolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDocStore } from "@/store/docStore";

function App() {
  const hasDocs = useDocStore((s) => s.docs.length > 0);
  const canvas = <EmptyState />;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-full flex-col">
        <Toolbar />
        <main className="min-h-0 flex-1">
          {hasDocs ? (
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel
                defaultSize={240}
                minSize={180}
                maxSize={420}
                collapsible
                collapsedSize={0}
              >
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel>{canvas}</ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            canvas
          )}
        </main>
        <StatusBar />
      </div>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;
