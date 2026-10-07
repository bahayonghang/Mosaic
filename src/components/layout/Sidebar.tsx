import {
  CircleAlert,
  FileImage,
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { releaseDocument } from "@/features/import/loadDocument";
import { cn } from "@/lib/utils";
import { isUnexported, useDocStore } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";

function DocRow({
  doc,
  active,
  onRemove,
}: {
  doc: MosaicDoc;
  active: boolean;
  onRemove: () => void;
}) {
  const select = useDocStore((s) => s.select);
  const Icon = doc.kind === "pdf" ? FileText : FileImage;
  const unexported = isUnexported(doc);

  return (
    <div
      data-active={active}
      className="group relative flex h-8 items-center rounded-md text-[13px] transition-colors duration-100 hover:bg-foreground/5 data-[active=true]:bg-foreground/8"
    >
      <button
        type="button"
        onClick={() => select(doc.id)}
        title={doc.path}
        className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 pl-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        {doc.status === "loading" ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : doc.status === "error" ? (
          <CircleAlert className="size-4 shrink-0 text-destructive" />
        ) : (
          <Icon
            className={cn(
              "size-4 shrink-0",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          />
        )}
        <span className="min-w-0 flex-1 truncate">{doc.name}</span>
        {unexported && (
          <span
            aria-label="已编辑未导出"
            className="size-1.5 shrink-0 rounded-full bg-signal"
          />
        )}
      </button>
      <button
        type="button"
        aria-label={`移除 ${doc.name}`}
        onClick={onRemove}
        className="mr-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity duration-100 group-hover:opacity-100 hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Sidebar() {
  const docs = useDocStore((s) => s.docs);
  const currentId = useDocStore((s) => s.currentId);
  const remove = useDocStore((s) => s.remove);
  const [pending, setPending] = useState<MosaicDoc | null>(null);

  const removeNow = (doc: MosaicDoc) => {
    releaseDocument(doc.id);
    remove(doc.id);
  };

  return (
    <aside className="flex h-full flex-col bg-chrome">
      <div className="flex h-9 shrink-0 items-center px-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">文件</span>
        <span className="ml-1.5 tabular-nums">{docs.length}</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-px px-1.5 pb-2">
          {docs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              active={doc.id === currentId}
              onRemove={() =>
                isUnexported(doc) ? setPending(doc) : removeNow(doc)
              }
            />
          ))}
        </div>
      </ScrollArea>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>移除已编辑的文件？</AlertDialogTitle>
            <AlertDialogDescription>
              「{pending?.name}」的编辑还没有导出，移除后编辑内容会丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => pending && removeNow(pending)}
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
