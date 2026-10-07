import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AboutDialog } from "./AboutDialog";
import { SettingsDialog } from "./SettingsDialog";

/** Toolbar gear: opens the settings or the about dialog. */
export function SettingsMenu() {
  const [open, setOpen] = useState<"settings" | "about" | null>(null);
  const change = (which: "settings" | "about") => (next: boolean) => setOpen(next ? which : null);

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="设置">
                <Settings />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">设置和关于</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen("settings")}>设置…</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen("about")}>关于 Mosaic</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog open={open === "settings"} onOpenChange={change("settings")} />
      <AboutDialog open={open === "about"} onOpenChange={change("about")} />
    </>
  );
}
