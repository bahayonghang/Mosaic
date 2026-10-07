import { ListRestart } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isUnexported, useDocStore } from "@/store/docStore";
import { useEditorStore } from "@/store/editorStore";
import { resetWorkspace } from "./resetWorkspace";

/** Counts taken when the dialog opens. */
interface Pending {
  total: number;
  unexported: number;
}

export function ResetButton() {
  const hasDocs = useDocStore((s) => s.docs.length > 0);
  const exporting = useEditorStore((s) => s.exporting);
  const [pending, setPending] = useState<Pending | null>(null);

  const ask = () => {
    const { docs } = useDocStore.getState();
    setPending({ total: docs.length, unexported: docs.filter(isUnexported).length });
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!hasDocs || exporting}
            onClick={ask}
            aria-label="重置"
          >
            <ListRestart />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">关闭全部文件，回到初始界面</TooltipContent>
      </Tooltip>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>重置工作区？</AlertDialogTitle>
            <AlertDialogDescription>
              将关闭全部 <span className="tabular-nums">{pending?.total}</span> 个文件，回到初始界面。原文件不会改变。
              {!!pending?.unexported && (
                <>
                  其中 <span className="tabular-nums">{pending.unexported}</span> 个文件的编辑还没有导出，重置后会丢失。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant={pending?.unexported ? "destructive" : "default"}
              onClick={resetWorkspace}
            >
              重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
