import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * Shared hook for drag-to-resize split panels.
 * Works for any two-panel horizontal layout.
 * @param storageKey  localStorage key to persist the split percentage
 * @param defaultPct  initial split percentage (0-100), default 50
 * @param min         minimum pct for the left panel, default 15
 * @param max         maximum pct for the left panel, default 85
 * @param breakpointPx only enable resize above this viewport width (default 768 = md)
 */
export function useSplitResize(
  storageKey: string,
  defaultPct = 50,
  min = 15,
  max = 85,
  breakpointPx = 768,
) {
  const [pct, setPct] = useState(defaultPct);
  const [isDesktop, setIsDesktop] = useState(false);
  const pctRef = useRef(defaultPct);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = Number(localStorage.getItem(storageKey) || "0");
    if (v >= min && v <= max) { setPct(v); pctRef.current = v; }
    const check = () => setIsDesktop(window.innerWidth >= breakpointPx);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDragStart(e: React.MouseEvent) {
    if (!containerRef.current) return;
    e.preventDefault();
    function onMove(ev: MouseEvent) {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      const next = Math.max(min, Math.min(max, ((ev.clientX - left) / width) * 100));
      setPct(next);
      pctRef.current = next;
    }
    function onUp() {
      localStorage.setItem(storageKey, String(Math.round(pctRef.current)));
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const leftStyle: CSSProperties = isDesktop ? { width: `${pct}%`, flex: "none" } : {};
  const rightStyle: CSSProperties = isDesktop ? { width: `${100 - pct}%`, flex: "none" } : {};

  return { pct, isDesktop, containerRef, onDragStart, leftStyle, rightStyle };
}
