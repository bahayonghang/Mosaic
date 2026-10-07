import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_EXPORT_SUFFIX, suffixError, suffixedName } from "@/lib/exportName";
import { useSettingsStore } from "@/store/settingsStore";

/** Full-window settings. Mounted only while open, so the draft starts from the saved suffix. */
export function SettingsPage({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState(() => useSettingsStore.getState().exportSuffix);
  const error = suffixError(draft);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div data-settings-page className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex h-11 shrink-0 items-center border-b bg-chrome px-3">
        <h1 className="text-[13px] font-semibold tracking-tight">设置</h1>
        <Button type="button" variant="outline" className="ml-auto" onClick={onClose}>
          关闭
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-md gap-6 px-6 py-8">
          <p className="text-sm text-muted-foreground">导出时，新文件名在原文件名后加上后缀。</p>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (error) return;
              useSettingsStore.getState().setExportSuffix(draft);
              onClose();
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
            <div className="flex items-center">
              <Button type="button" variant="ghost" className="mr-auto" onClick={() => setDraft(DEFAULT_EXPORT_SUFFIX)}>
                恢复默认
              </Button>
              <Button type="submit" disabled={error !== null}>
                保存
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
