"use client";

import { useEffect, useRef, useState, useCallback } from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  return mermaidPromise;
}

let counter = 0;

export function MermaidView({
  chart,
  theme = "auto",
  pannable = false,
  onRendered,
  className,
}: {
  chart: string;
  theme?: "auto" | "dark" | "default" | "neutral" | "forest";
  pannable?: boolean;
  onRendered?: (svg: string) => void;
  className?: string;
}) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await getMermaid();
        const resolved =
          theme === "auto"
            ? document.documentElement.classList.contains("light")
              ? "default"
              : "dark"
            : theme;
        mermaid.initialize({ startOnLoad: false, theme: resolved, securityLevel: "loose" });
        const id = `mmd-${counter++}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
          onRendered?.(svg);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, theme, onRendered]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!pannable) return;
      e.preventDefault();
      setTransform((t) => ({ ...t, scale: Math.min(4, Math.max(0.2, t.scale - e.deltaY * 0.001)) }));
    },
    [pannable]
  );

  function onDown(e: React.MouseEvent) {
    if (!pannable) return;
    drag.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    setDragging(true);
  }
  function onMove(e: React.MouseEvent) {
    if (!pannable || !drag.current) return;
    setTransform((t) => ({ ...t, x: e.clientX - drag.current!.x, y: e.clientY - drag.current!.y }));
  }
  function onUp() {
    drag.current = null;
    setDragging(false);
  }

  if (error) {
    return (
      <div className={className}>
        <div className="m-4 rounded-lg border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <p className="mb-1 font-semibold">Diagram error</p>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      onWheel={onWheel}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      style={{ cursor: pannable ? (dragging ? "grabbing" : "grab") : "default", overflow: "hidden" }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "center center",
          transition: dragging ? "none" : "transform 0.08s ease-out",
        }}
        className="grid h-full w-full place-items-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
