"use client";

import {
  MousePointer2, Pencil, Minus, Square, Circle, Type,
  StickyNote, ArrowRight, ZoomIn, ZoomOut, Maximize2,
  Sparkles, Layers, Grid3x3, Download, Users, Undo2, Redo2,
  Hand, Diamond, Triangle, Workflow, Braces, PenLine,
  Zap, Clock, Bell, ChevronRight,
} from "lucide-react";

/* ─── Demo canvas nodes ──────────────────────────────────────── */
const DEMO_NODES = [
  { id: 1, x: 160,  y: 120, w: 140, h: 48, label: "Client App",    color: "#6366f1" },
  { id: 2, x: 380,  y: 120, w: 140, h: 48, label: "API Gateway",   color: "#0ea5e9" },
  { id: 3, x: 600,  y: 60,  w: 140, h: 48, label: "Auth Service",  color: "#10b981" },
  { id: 4, x: 600,  y: 180, w: 140, h: 48, label: "User Service",  color: "#10b981" },
  { id: 5, x: 820,  y: 60,  w: 140, h: 48, label: "PostgreSQL",    color: "#f59e0b" },
  { id: 6, x: 820,  y: 180, w: 140, h: 48, label: "Redis Cache",   color: "#ef4444" },
  { id: 7, x: 380,  y: 280, w: 140, h: 48, label: "Message Queue", color: "#8b5cf6" },
  { id: 8, x: 600,  y: 280, w: 140, h: 48, label: "Notification",  color: "#ec4899" },
];

const DEMO_ARROWS = [
  { x1: 300, y1: 144, x2: 380, y2: 144 },
  { x1: 520, y1: 130, x2: 600, y2: 90  },
  { x1: 520, y1: 158, x2: 600, y2: 204 },
  { x1: 740, y1: 84,  x2: 820, y2: 84  },
  { x1: 740, y1: 204, x2: 820, y2: 204 },
  { x1: 520, y1: 304, x2: 600, y2: 304 },
];

const TOOLS = [
  MousePointer2, Hand, Pencil, Type, StickyNote,
  Square, Circle, Diamond, ArrowRight, Minus,
];

const UPCOMING = [
  { icon: PenLine,   label: "Infinite Canvas",          desc: "Pan, zoom, unlimited workspace" },
  { icon: Sparkles,  label: "AI Copilot",                desc: "Generate diagrams from a prompt" },
  { icon: Users,     label: "Real-time Collaboration",   desc: "Live cursors & multiplayer editing" },
  { icon: Layers,    label: "Smart Templates",           desc: "System design, ERD, flowchart & more" },
  { icon: Workflow,  label: "Mermaid & Code Blocks",     desc: "Render diagrams inside the canvas" },
  { icon: Download,  label: "Export PNG / SVG / PDF",    desc: "One-click professional exports" },
];

/* ─── Background canvas (blurred, decorative) ───────────────── */
function BackgroundCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Fake toolbar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-bg/60 px-4 py-2">
        <div className="flex items-center gap-1">
          <div className="h-6 w-6 rounded bg-fg-subtle/10" />
          <div className="h-6 w-6 rounded bg-fg-subtle/10" />
          <div className="mx-1 h-4 w-px bg-border/40" />
          <div className="h-5 w-20 rounded bg-fg-subtle/10" />
        </div>
        <div className="flex gap-1">
          {[ZoomOut, ZoomIn, Maximize2, Grid3x3, Layers].map((Icon, i) => (
            <div key={i} className="flex h-7 w-7 items-center justify-center rounded bg-fg-subtle/5">
              <Icon size={13} className="text-fg-subtle/30" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {["#6366f1","#10b981","#f59e0b"].map((c, i) => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-bg/60" style={{ background: c, opacity: 0.5 }} />
            ))}
          </div>
          <div className="h-6 w-16 rounded bg-accent/20" />
          <div className="h-6 w-20 rounded bg-accent/30" />
        </div>
      </div>

      <div className="flex h-full">
        {/* Fake left toolbar */}
        <div className="flex w-12 flex-col items-center gap-1 border-r border-border/30 bg-bg/40 py-2">
          {TOOLS.map((Icon, i) => (
            <div key={i} className="flex h-8 w-8 items-center justify-center rounded">
              <Icon size={14} className="text-fg-subtle/25" />
            </div>
          ))}
        </div>

        {/* Fake canvas */}
        <div className="relative flex-1 overflow-hidden">
          <svg viewBox="0 0 1060 380" className="h-full w-full opacity-30">
            <defs>
              <pattern id="bg-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="currentColor" className="text-fg-subtle" opacity="0.4" />
              </pattern>
              <marker id="bg-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="#64748b" opacity="0.5" />
              </marker>
            </defs>
            <rect width="1060" height="380" fill="url(#bg-grid)" />
            {DEMO_ARROWS.map((a, i) => (
              <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                stroke="#64748b" strokeWidth="1.5" opacity="0.4"
                markerEnd="url(#bg-arrow)" />
            ))}
            {DEMO_NODES.map((n) => (
              <g key={n.id}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8"
                  fill={`${n.color}15`} stroke={n.color} strokeWidth="1.5" opacity="0.5" />
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 4}
                  textAnchor="middle" fontSize="11" fontWeight="500"
                  fill={n.color} opacity="0.6">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Fake right panel */}
        <div className="hidden w-44 flex-col gap-3 border-l border-border/30 bg-bg/40 p-3 lg:flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 rounded" style={{ width: `${40 + i * 8}px`, background: "var(--color-fg-subtle)", opacity: 0.1 }} />
              <div className="h-5 w-12 rounded bg-fg-subtle/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function WhiteboardPage() {
  return (
    <div className="relative flex h-full overflow-hidden bg-bg">

      {/* Blurred background */}
      <BackgroundCanvas />

      {/* Blur + dim overlay */}
      <div className="absolute inset-0 z-10 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--color-bg) 55%, transparent)" }} />

      {/* Coming soon card — centred */}
      <div className="relative z-20 flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              <Clock size={11} /> Coming Soon
            </span>
          </div>

          {/* Icon + heading */}
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-card shadow-xl">
              <PenLine size={28} className="text-accent" />
            </div>
          </div>

          <h1 className="mb-3 text-center text-[1.75rem] font-bold leading-tight tracking-tight text-fg">
            Quick Board
          </h1>
          <p className="mb-8 text-center text-sm leading-relaxed text-fg-muted">
            An AI-powered infinite canvas for visual thinking — draw system architectures,
            flowcharts, and diagrams with a built-in AI copilot.
          </p>

          {/* Feature grid */}
          <div className="mb-8 grid grid-cols-2 gap-2.5">
            {UPCOMING.map(({ icon: Icon, label, desc }) => (
              <div key={label}
                className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/80 px-3.5 py-3 backdrop-blur-sm">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                  <Icon size={14} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-fg">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notify CTA */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg-card px-3.5 py-2.5">
              <Bell size={14} className="shrink-0 text-fg-subtle" />
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
              />
            </div>
            <button className="btn btn-accent flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium">
              Notify me <ChevronRight size={14} />
            </button>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] text-fg-subtle/60">
            We&apos;ll let you know the moment Quick Board is ready. No spam, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
