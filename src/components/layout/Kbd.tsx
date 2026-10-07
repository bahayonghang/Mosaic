export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1.5 rounded-[4px] border border-border bg-muted px-1 font-sans text-[11px] leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
