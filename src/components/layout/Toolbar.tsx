import { Brush, ChevronDown, Download, FolderOpen, ImagePlus, Redo2, SquareDashed, Undo2 } from "lucide-react";
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
import { openFilesDialog, openFolderDialog } from "@/features/import/importActions";
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

function SizeControl({ label, value, min, max, disabled }: { label: string; value: number; min: number; max: number; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2 data-[disabled=true]:opacity-50" data-disabled={disabled}>
      <span className="text-muted-foreground">{label}</span>
      <Slider className="w-24" value={[value]} min={min} max={max} step={1} disabled={disabled} aria-label={label} />
      <span className="w-7 text-right tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

export function Toolbar() {
  // Editing controls are disabled placeholders until the editor task connects them.
  const noDoc = true;

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

      <ToggleGroup type="single" size="sm" defaultValue="rect" disabled={noDoc} aria-label="工具">
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
      </ToggleGroup>

      <SizeControl label="颗粒" value={16} min={4} max={96} disabled={noDoc} />
      <SizeControl label="笔刷" value={40} min={4} max={400} disabled={noDoc} />

      <Separator orientation="vertical" className="h-5!" />

      <div className="flex items-center">
        <Tip label="撤销" shortcut="Ctrl+Z">
          <Button variant="ghost" size="icon-sm" disabled aria-label="撤销">
            <Undo2 />
          </Button>
        </Tip>
        <Tip label="重做" shortcut="Ctrl+Shift+Z">
          <Button variant="ghost" size="icon-sm" disabled aria-label="重做">
            <Redo2 />
          </Button>
        </Tip>
      </div>

      <div className="ml-auto flex items-center">
        <Button variant="signal" size="sm" disabled className="rounded-r-none">
          <Download />
          导出
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="signal"
              size="icon-sm"
              disabled
              aria-label="更多导出选项"
              className="rounded-l-none border-l border-l-signal-foreground/25"
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>另存为…</DropdownMenuItem>
            <DropdownMenuItem>全部导出</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
