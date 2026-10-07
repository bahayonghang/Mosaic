import { cn } from "@/lib/utils";

// 4 x 4 tiles. Values are opacity steps; "s" marks the signal-colored 2 x 2 block.
const TILES = [
  0.18, 0.32, 0.12, 0.26,
  0.4, "s", "s", 0.2,
  0.14, "s", "s", 0.36,
  0.3, 0.1, 0.24, 0.16,
] as const;

// Alternate opacities used when the parent `group` is hovered or marked active.
const SHIFTED = [0.3, 0.14, 0.36, 0.12, 0.2, "s", "s", 0.4, 0.34, "s", "s", 0.14, 0.12, 0.28, 0.1, 0.32] as const;

export function PixelMark({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const lg = size === "lg";
  return (
    <div
      aria-hidden
      className={cn("grid grid-cols-4", lg ? "size-14 gap-[3px]" : "size-4 gap-px", className)}
    >
      {TILES.map((t, i) => {
        const shifted = SHIFTED[i];
        return t === "s" ? (
          <span key={i} className={cn("bg-signal", lg ? "rounded-[2px]" : "rounded-[0.5px]")} />
        ) : (
          <span
            key={i}
            className={cn(
              "bg-foreground transition-opacity duration-300 ease-out",
              lg ? "rounded-[2px]" : "rounded-[0.5px]",
              lg && "group-hover:[opacity:var(--o2)] group-data-[active=true]:[opacity:var(--o2)]",
            )}
            style={{ opacity: t, ["--o2" as string]: shifted === "s" ? t : shifted }}
          />
        );
      })}
    </div>
  );
}
