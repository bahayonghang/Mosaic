import { Brush, ChevronDown, Download, FolderOpen, Hand, ImagePlus, Redo2, SquareDashed, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BLOCK_MAX, BLOCK_MIN, RADIUS_MAX, RADIUS_MIN } from "@/features/editor/mosaicEngine";
import { exportAll, exportCurrent, saveAsCurrent } from "@/features/export/exportActions";
import { openFilesDialog, openFolderDialog } from "@/features/import/importActions";
import { hasOps, redo, undo, useCurrentDoc, useDocStore } from "@/store/docStore";
import { defaultSizes, useEditorStore, useSizes, type Tool } from "@/store/editorStore";
import { Kbd } from "./Kbd";
import { PixelMark } from "./PixelMark";

function Tip({ label, shortcut, children }: { label: string; shortcut?: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

function SizeControl({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 data-[disabled=true]:opacity-50" data-disabled={disabled}>
      <span className="text-muted-foreground">{label}</span>
      <Slider
        className="w-24"
        value={[value]}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={label}
        onValueChange={([v]) => onChange(v)}
      />
      <span className="w-7 text-right tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

export function Toolbar() {
  const doc = useCurrentDoc();
  const page = doc?.status === "ready" ? doc.pages[doc.currentPage] : undefined;
  const sizes = useSizes(doc);
  const tool = useEditorStore((s) => s.tool);
  const { setTool, setSizes, resetSizes } = useEditorStore.getState();
  const anyEdited = useDocStore((s) => s.docs.some(hasOps));
  const noDoc = !doc || !page || !sizes;
  const canExport = !!doc && hasOps(doc);
  const defaults = doc && defaultSizes(doc);
  const atDefaults =
    !!sizes && !!defaults && sizes.block === defaults.block && sizes.radius === defaults.radius;

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b bg-chrome px-3">
      <div className="flex items-center gap-2 pr-1">
        <PixelMark />
        <span className="text-[13px] font-semibold tracking-tight">Mosaic</span>
      </div>

      <Separator orientation="vertical" className="h-5!" />

      <div className="flex items-center gap-1">
        <Tip label="打开文件" shortcut="Ctrl+O">
          <Button variant="ghost" size="sm" onClick={() => void openFilesDialog()}>
            <ImagePlus />
            打开文件
          </Button>
        </Tip>
        <Tip label="打开文件夹">
          <Button variant="ghost" size="sm" onClick={() => void openFolderDialog()}>
            <FolderOpen />
            打开文件夹
          </Button>
        </Tip>
      </div>

      <Separator orientation="vertical" className="h-5!" />

      <ToggleGroup
        type="single"
        size="sm"
        value={tool}
        onValueChange={(v) => v && setTool(v as Tool)}
        disabled={noDoc}
        aria-label="工具"
      >
        <Tip label="矩形打码" shortcut="R">
          <ToggleGroupItem value="rect" aria-label="矩形打码" className="px-2">
            <SquareDashed />
            矩形
          </ToggleGroupItem>
        </Tip>
        <Tip label="画笔打码" shortcut="B">
          <ToggleGroupItem value="brush" aria-label="画笔打码" className="px-2">
            <Brush />
            画笔
          </ToggleGroupItem>
        </Tip>
        <Tip label="抓手（平移和缩放）" shortcut="H">
          <ToggleGroupItem value="hand" aria-label="抓手" className="px-2">
            <Hand />
            抓手
          </ToggleGroupItem>
        </Tip>
      </ToggleGroup>

      <SizeControl
        label="颗粒大小"
        value={sizes?.block ?? 16}
        min={BLOCK_MIN}
        max={BLOCK_MAX}
        disabled={noDoc}
        onChange={(block) => doc && setSizes(doc, { block })}
      />
      {tool === "brush" && (
        <SizeControl
          label="笔刷大小"
          value={sizes?.radius ?? 40}
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          disabled={noDoc}
          onChange={(radius) => doc && setSizes(doc, { radius })}
        />
      )}
      <Tip label="恢复默认颗粒和笔刷大小">
        <Button
          variant="ghost"
          size="sm"
          disabled={noDoc || atDefaults}
          onClick={() => doc && resetSizes(doc)}
        >
          恢复默认
        </Button>
      </Tip>

      <Separator orientation="vertical" className="h-5!" />

      <div className="flex items-center">
        <Tip label="撤销" shortcut="Ctrl+Z">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!page || page.ops.length === 0}
            onClick={() => doc && undo(doc.id)}
            aria-label="撤销"
          >
            <Undo2 />
          </Button>
        </Tip>
        <Tip label="重做" shortcut="Ctrl+Shift+Z">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!page || page.redo.length === 0}
            onClick={() => doc && redo(doc.id)}
            aria-label="重做"
          >
            <Redo2 />
          </Button>
        </Tip>
      </div>

      <div className="ml-auto flex items-center">
        <Tip label="导出到原文件旁" shortcut="Ctrl+S">
          <Button
            variant="signal"
            size="sm"
            disabled={!canExport}
            onClick={() => void exportCurrent()}
            className="rounded-r-none"
          >
            <Download />
            导出
          </Button>
        </Tip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="signal"
              size="icon-sm"
              disabled={!anyEdited}
              aria-label="更多导出选项"
              className="rounded-l-none border-l border-l-signal-foreground/25"
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!canExport} onSelect={() => void saveAsCurrent()}>
              另存为…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportAll()}>全部导出</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
