import {
  ChevronRight,
  CircleAlert,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  LoaderCircle,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  ancestorKeys,
  buildTree,
  type FolderNode,
  type TreeNode,
} from "@/features/sidebar/buildTree";
import { cn } from "@/lib/utils";
import { isUnexported, useDocStore } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";

/** Left padding of a row: 10 px plus 20 px per level, so a file icon lines up with its folder icon. */
const indent = (depth: number) => ({ paddingLeft: 10 + depth * 20 });

function EditedMarker() {
  return (
    <span
      aria-label="已编辑未导出"
      className="size-1.5 shrink-0 rounded-full bg-signal"
    />
  );
}

function DocRow({
  doc,
  depth,
  active,
  onRemove,
}: {
  doc: MosaicDoc;
  depth: number;
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
        style={indent(depth)}
        className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
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
        {unexported && <EditedMarker />}
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

function FolderRow({
  node,
  depth,
  open,
  onToggle,
}: {
  node: FolderNode;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = open ? FolderOpen : Folder;
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      title={node.path}
      style={indent(depth)}
      className="flex h-8 w-full min-w-0 items-center gap-1.5 rounded-md pr-2 text-left text-[13px] outline-none transition-colors duration-100 hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight
        className={cn(
          "size-3.5 shrink-0 text-muted-foreground transition-transform duration-100",
          open && "rotate-90",
        )}
      />
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="ml-0.5 min-w-0 flex-1 truncate">{node.name}</span>
      {!open && node.unexported && <EditedMarker />}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {node.count}
      </span>
    </button>
  );
}

export function Sidebar() {
  const docs = useDocStore((s) => s.docs);
  const currentId = useDocStore((s) => s.currentId);
  const remove = useDocStore((s) => s.remove);
  const [pending, setPending] = useState<MosaicDoc | null>(null);
  /** Keys of collapsed folders (UI state of this view only). */
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const tree = useMemo(() => buildTree(docs), [docs]);

  // F8: a newly selected document is not hidden in a collapsed folder. Adjusted during render
  // when the selection changes, so the user can still collapse the folder of the current file.
  const [shownId, setShownId] = useState(currentId);
  if (shownId !== currentId) {
    setShownId(currentId);
    const current = docs.find((d) => d.id === currentId);
    const keys = current ? ancestorKeys(current) : [];
    if (keys.some((k) => collapsed.has(k)))
      setCollapsed(new Set([...collapsed].filter((k) => !keys.includes(k))));
  }

  const toggle = (key: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const removeNow = (doc: MosaicDoc) => {
    releaseDocument(doc.id);
    remove(doc.id);
  };

  const render = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((node) => {
      if (node.type === "file")
        return (
          <DocRow
            key={node.doc.id}
            doc={node.doc}
            depth={depth}
            active={node.doc.id === currentId}
            onRemove={() =>
              isUnexported(node.doc)
                ? setPending(node.doc)
                : removeNow(node.doc)
            }
          />
        );
      const open = !collapsed.has(node.key);
      return (
        <div key={node.key} className="flex flex-col gap-px">
          <FolderRow
            node={node}
            depth={depth}
            open={open}
            onToggle={() => toggle(node.key)}
          />
          {open && render(node.children, depth + 1)}
        </div>
      );
    });

  return (
    <aside className="flex h-full flex-col bg-chrome">
      <div className="flex h-9 shrink-0 items-center px-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">文件</span>
        <span className="ml-1.5 tabular-nums">{docs.length}</span>
      </div>
      {/* Radix wraps the content in a `display: table` div that grows with long names; block keeps it at the panel width so names truncate. */}
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col gap-px px-1.5 pb-2">
          {render(tree, 0)}
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
