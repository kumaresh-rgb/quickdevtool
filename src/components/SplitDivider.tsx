import type { MouseEventHandler } from "react";
import { cn } from "@/lib/cn";

interface Props {
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  /** Tailwind classes controlling visibility — default hidden on mobile, flex on md+ */
  className?: string;
}

export function SplitDivider({ onMouseDown, className = "hidden md:flex" }: Props) {
  return (
    <div
      className={cn(
        "group w-1 shrink-0 cursor-col-resize select-none flex-col items-center justify-center bg-border transition-colors hover:bg-accent/50 active:bg-accent/70",
        className,
      )}
      onMouseDown={onMouseDown}
    >
      <div className="pointer-events-none flex flex-col items-center gap-[3px]">
        <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
        <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
        <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
      </div>
    </div>
  );
}
