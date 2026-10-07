/** Shown over an open document while files are dragged over the window. */
export function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-xl border-[1.5px] border-dashed border-signal bg-canvas/85 animate-in fade-in-0 duration-150">
      <p className="text-[15px] font-semibold">松开以导入</p>
    </div>
  );
}
