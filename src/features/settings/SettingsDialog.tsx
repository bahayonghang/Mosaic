import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_EXPORT_SUFFIX, suffixError, suffixedName } from "@/lib/exportName";
import { useSettingsStore } from "@/store/settingsStore";

function SettingsForm({ onDone }: { onDone: () => void }) {
  const [draft, setDraft] = useState(() => useSettingsStore.getState().exportSuffix);
  const error = suffixError(draft);

  const save = () => {
    if (error) return;
    useSettingsStore.getState().setExportSuffix(draft);
    onDone();
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="export-suffix">导出文件名后缀</Label>
        <Input
          id="export-suffix"
          value={draft}
          autoFocus
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby="export-suffix-hint"
          onChange={(e) => setDraft(e.target.value)}
        />
        <p id="export-suffix-hint" className="text-xs text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <>示例：证书.jpg → {suffixedName("证书.jpg", draft.trim())}</>
          )}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" className="mr-auto" onClick={() => setDraft(DEFAULT_EXPORT_SUFFIX)}>
          恢复默认
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          取消
        </Button>
        <Button type="submit" disabled={error !== null}>
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>导出时，新文件名在原文件名后加上后缀。</DialogDescription>
        </DialogHeader>
        {/* Mounted per open, so the draft starts from the saved value each time. */}
        {open && <SettingsForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
