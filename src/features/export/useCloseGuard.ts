import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { isUnexported, useDocStore } from "@/store/docStore";

/** E15: block the window close while edited documents are not exported. */
export function useCloseGuard() {
  /** Unexported documents at the blocked close; 0 when no dialog is open. */
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const unlisten = getCurrentWindow().onCloseRequested((e) => {
      const n = useDocStore.getState().docs.filter(isUnexported).length;
      if (n === 0) return;
      e.preventDefault();
      setPending(n);
    });
    return () => void unlisten.then((fn) => fn());
  }, []);

  return {
    pending,
    cancel: () => setPending(0),
    quit: () => void getCurrentWindow().destroy(),
  };
}
