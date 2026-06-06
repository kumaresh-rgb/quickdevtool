"use client";

import Link from "next/link";
import { useRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Button that is gently "pulled" toward the cursor — the Raycast/Arc feel. */
export function MagneticButton({
  href,
  children,
  variant = "accent",
}: {
  href: string;
  children: ReactNode;
  variant?: "accent" | "ghost";
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  }

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "btn px-6 py-3 text-sm transition-transform duration-200 will-change-transform",
        variant === "accent" ? "btn-accent shadow-lg shadow-accent/25" : "btn-ghost"
      )}
    >
      {children}
    </Link>
  );
}
