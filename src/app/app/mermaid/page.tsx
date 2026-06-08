"use client";

import { useRef, useState } from "react";
import { Workflow, FileImage, FileCode2, Columns2, Eye } from "lucide-react";
import { MermaidView } from "@/components/MermaidView";
import { log } from "@/lib/logger";
import { useSplitResize } from "@/lib/useSplitResize";
import { SplitDivider } from "@/components/SplitDivider";

const SAMPLE = `flowchart TD
    A[User pastes DAX] --> B{Detect keywords}
    B --> C[Build flow diagram]
    B --> D[Explain with citations]
    C --> E[Estimate cost]
    D --> E
    E --> F[Show insights]`;

const THEMES = ["auto", "dark", "default", "neutral", "forest"] as const;
type Theme = (typeof THEMES)[number];

export default function MermaidStudioPage() {
  const [code, setCode] = useState(SAMPLE);
  const [theme, setTheme] = useState<Theme>("auto");
  const [view, setView] = useState<"split" | "preview">("split");
  const svgRef = useRef<string>("");
  const split = useSplitResize("qdt-mermaid-split");

  function downloadSvg() {
    if (!svgRef.current) return;
    const blob = new Blob([svgRef.current], { type: "image/svg+xml" });
    triggerDownload(URL.createObjectURL(blob), "diagram.svg");
    log.action("MermaidStudio", "export-svg");
  }

  function downloadPng() {
    if (!svgRef.current) return;
    const svgBlob = new Blob([svgRef.current], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2; // retina export
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      triggerDownload(canvas.toDataURL("image/png"), "diagram.png");
      log.action("MermaidStudio", "export-png");
    };
    img.src = url;
  }

  function triggerDownload(href: string, name: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  }

  const editor = (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      spellCheck={false}
      className="h-full w-full resize-none bg-bg p-4 font-mono text-xs leading-6 outline-none"
      placeholder="Write Mermaid here…"
    />
  );

  const preview = (
    <MermaidView
      chart={code}
      theme={theme}
      pannable
      onRendered={(svg) => (svgRef.current = svg)}
      className="h-full bg-bg-elevated"
    />
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Workflow size={16} className="text-accent" />
        <span className="text-sm font-semibold">Mermaid Studio</span>
        <span className="hidden text-xs text-fg-subtle sm:inline">Scroll to zoom · drag to pan</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs outline-none"
          >
            {THEMES.map((t) => <option key={t} value={t}>{t === "auto" ? "Theme: auto" : t}</option>)}
          </select>
          <button
            onClick={() => setView(view === "split" ? "preview" : "split")}
            className="btn btn-ghost px-3 py-1.5 text-xs"
          >
            {view === "split" ? <><Eye size={14} /> Preview</> : <><Columns2 size={14} /> Split</>}
          </button>
          <button onClick={downloadSvg} className="btn btn-ghost px-3 py-1.5 text-xs"><FileCode2 size={14} /> SVG</button>
          <button onClick={downloadPng} className="btn btn-accent px-3 py-1.5 text-xs"><FileImage size={14} /> PNG</button>
        </div>
      </div>

      {view === "split" ? (
        <div ref={split.containerRef} className="flex min-h-0 flex-1 flex-col divide-y divide-border md:flex-row md:divide-x md:divide-y-0">
          <div className="flex-1 overflow-hidden" style={split.leftStyle}>{editor}</div>
          <SplitDivider onMouseDown={split.onDragStart} />
          <div className="flex-1 overflow-hidden" style={split.rightStyle}>{preview}</div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">{preview}</div>
      )}
    </div>
  );
}
