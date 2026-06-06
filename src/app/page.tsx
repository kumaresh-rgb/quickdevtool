"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  NotebookPen, Braces, Brain, GitCompare, Database,
  Workflow, ArrowRight, HardDrive, Sparkles, KanbanSquare,
  GripVertical, CheckCircle2, Zap, Lock, Wifi, ChevronRight,
} from "lucide-react";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FloatingSnippets } from "@/components/landing/FloatingSnippets";
import { TiltCard } from "@/components/landing/TiltCard";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ─── Tool data ──────────────────────────────────────────── */
const TOOLS = [
  {
    id: "notes", icon: NotebookPen, label: "Quick Notes", color: "#818cf8",
    href: "/app/notes",
    tagline: "Rich-text editor that thinks like a developer",
    bullets: [
      "Slash commands: /code, /dax, /json, /table, /todo",
      "Smart Paste — auto-detects JSON, DAX, SQL, Mermaid",
      "2-second autosave with per-note history",
      "Collapsible sidebar, search, pin & archive",
    ],
    preview: `// Paste any code → Smart Paste detects language
const result = await fetch('/api/notes');
const notes = await result.json();

// Slash-command inline: type /dax →
CALCULATE(SUM(Sales[Amount]),
  FILTER(ALL(Calendar), ...)
)`,
  },
  {
    id: "insight", icon: Brain, label: "DAX Insight", color: "#a78bfa",
    href: "/app/insight",
    tagline: "AI-style DAX analysis with cited sources",
    bullets: [
      "Explains every DAX keyword — dax.guide, SQLBI, MS Learn",
      "Generates Mermaid execution-flow diagram automatically",
      "SE / FE cost estimate, cardinality warnings",
      "20+ built-in patterns: CALCULATE, SUMX, RELATED…",
    ],
    preview: `CALCULATE(
  SUMX(Sales, Sales[Qty] * Sales[Price]),
  KEEPFILTERS(Date[Year] = 2024)
)
─────────────────────────────────
📘 CALCULATE  → dax.guide/calculate
⚡ Cost: SE-heavy · high cardinality
🔀 Flow: Filter ctx → SUMX iterator`,
  },
  {
    id: "studio", icon: Database, label: "DAX Studio", color: "#34d399",
    href: "/app/studio",
    tagline: "Enterprise DAX IDE in the browser",
    bullets: [
      "Monaco editor with DAX syntax & hover citations",
      "Workspace Explorer: Dev / QA / UAT / Prod profiles",
      "Paginated results grid — 100 / 500 / 1000 rows",
      "Sort, filter, resize, CSV & Excel export",
    ],
    preview: `┌─ Workspace Explorer ──┐  ┌─ Editor ─────────────┐
│ ▼ Production          │  │  EVALUATE            │
│   └─ Sales Model      │  │  TOPN(10,            │
│ ▼ QA                  │  │    SUMMARIZE(Sales,  │
│   └─ Inventory        │  │      'Product'[Name],│
└───────────────────────┘  └──────────────────────┘
  SE: 82%  FE: 18%  Rows: 1 000  Time: 43 ms`,
  },
  {
    id: "mermaid", icon: Workflow, label: "Mermaid Studio", color: "#818cf8",
    href: "/app/mermaid",
    tagline: "Live diagram IDE with zoom, pan & export",
    bullets: [
      "Split-screen: code left, diagram right",
      "5 themes: dark · default · forest · neutral · base",
      "Export PNG (2× retina) or SVG",
      "Mouse zoom & pan on rendered diagram",
    ],
    preview: `graph TD
  A[User Request] --> B{Auth?}
  B -- Yes --> C[Load Data]
  B -- No  --> D[401 Error]
  C --> E[Apply Filters]
  E --> F[Return JSON]

► Renders in real-time · Ctrl+scroll to zoom`,
  },
  {
    id: "json", icon: Braces, label: "JSON Toolkit", color: "#fbbf24",
    href: "/app/json",
    tagline: "JSON utility belt — beautify to validate",
    bullets: [
      "Beautify / minify with one click",
      "Validate with line-precise error reporting",
      "Interactive tree view with collapsible nodes",
      "Smart unescape for copied API payloads",
    ],
    preview: `// Input (minified)
{"id":1,"name":"Kumaresh","roles":["admin"]}

// Beautified
{
  "id": 1,
  "name": "Kumaresh",
  "roles": ["admin"]
}
✔ Valid JSON · 3 keys · depth 2`,
  },
  {
    id: "compare", icon: GitCompare, label: "Text Compare", color: "#f87171",
    href: "/app/compare",
    tagline: "GitHub-style diff with word-level precision",
    bullets: [
      "Side-by-side and inline diff modes",
      "Word-level highlighting inside changed lines",
      "Line numbers, added / removed counts",
      "Works with any text: SQL, JSON, DAX, markdown",
    ],
    preview: `─── Left ────────────  ─── Right ───────────
  SELECT *            │   SELECT id, name
  FROM Orders         │   FROM Orders
- WHERE status='new'  │ + WHERE status IN
                      │     ('new','open')
  ORDER BY created    │   ORDER BY created
  ↑ 1 removed  ↑ 2 added  ↑ word diff on`,
  },
  {
    id: "kanban", icon: KanbanSquare, label: "Kanban", color: "#fb923c",
    href: "/app/kanban",
    tagline: "Drag-and-drop board for your dev tasks",
    bullets: [
      "5 columns: Backlog → Today → In Progress → Testing → Done",
      "Priority labels, due dates, sub-tasks",
      "Smooth drag-and-drop powered by dnd-kit",
      "Persisted via local .NET backend",
    ],
    preview: `┌─ Backlog ─┐ ┌─ Today ───┐ ┌─ In Progress ─┐
│ Fix login │ │ API refac │ │ DAX Insight  │
│ Add tests │ │ Dark mode │ │ Landing page │
│ Docs      │ └───────────┘ └──────────────┘
└───────────┘
           ↕ drag cards between columns`,
  },
];

const METRICS = [
  { value: "7", label: "Tools unified", icon: Zap },
  { value: "0", label: "Paid services", icon: Lock },
  { value: "< 1s", label: "First load", icon: Sparkles },
  { value: "100%", label: "Local-first", icon: Wifi },
];

/* ─── Sortable tool card ─────────────────────────────────── */
function SortableTool({ tool }: { tool: typeof TOOLS[0] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.85 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <TiltCard className={`flex h-full cursor-grab flex-col gap-3 select-none ${isDragging ? "shadow-2xl ring-2 ring-accent/50 scale-105" : ""}`}>
        <div className="flex items-start justify-between">
          <span
            className="inline-grid h-11 w-11 place-items-center rounded-xl"
            style={{ background: `${tool.color}18`, color: tool.color }}>
            <tool.icon size={22} />
          </span>
          <span
            className="touch-none text-fg-subtle opacity-40 hover:opacity-70"
            {...attributes}
            {...listeners}>
            <GripVertical size={18} />
          </span>
        </div>
        <div>
          <h3 className="font-semibold">{tool.label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{tool.tagline}</p>
        </div>
        <Link
          href={tool.href}
          className="mt-auto inline-flex items-center gap-1 text-xs font-medium"
          style={{ color: tool.color }}
          onClick={(e) => e.stopPropagation()}>
          Open <ChevronRight size={12} />
        </Link>
      </TiltCard>
    </div>
  );
}

/* ─── Feature deep-dive row ─────────────────────────────── */
function FeatureRow({
  tool,
  flip = false,
  index,
}: {
  tool: typeof TOOLS[0];
  flip?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`flex flex-col gap-10 lg:flex-row lg:items-center ${flip ? "lg:flex-row-reverse" : ""}`}>
      {/* Text */}
      <div className="flex-1 space-y-5">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: `${tool.color}18`, color: tool.color }}>
          <tool.icon size={13} /> {tool.label}
        </span>
        <h3 className="text-2xl font-bold sm:text-3xl">{tool.tagline}</h3>
        <ul className="space-y-2.5">
          {tool.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: tool.color }} />
              {b}
            </li>
          ))}
        </ul>
        <MagneticButton href={tool.href} variant={index % 2 === 0 ? "accent" : "ghost"}>
          Try {tool.label} <ArrowRight size={15} />
        </MagneticButton>
      </div>

      {/* Code preview */}
      <div className="flex-1">
        <div className="card overflow-hidden p-0">
          <div
            className="flex items-center gap-1.5 border-b border-border px-4 py-2.5"
            style={{ background: `${tool.color}10` }}>
            <span className="h-3 w-3 rounded-full bg-danger/60" />
            <span className="h-3 w-3 rounded-full bg-warning/60" />
            <span className="h-3 w-3 rounded-full bg-success/60" />
            <span className="ml-3 text-xs text-fg-subtle font-mono">{tool.label}</span>
          </div>
          <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-fg-muted font-mono whitespace-pre">
            {tool.preview}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Landing() {
  const [tools, setTools] = useState(TOOLS.map((t) => t.id));
  const [activeTab, setActiveTab] = useState(TOOLS[0].id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTools((prev) => {
        const from = prev.indexOf(String(active.id));
        const to = prev.indexOf(String(over.id));
        return arrayMove(prev, from, to);
      });
    }
  }

  const orderedTools = tools.map((id) => TOOLS.find((t) => t.id === id)!);

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <CursorGlow />

      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2.5 text-lg font-bold sm:text-xl">
          <Image src="/logo-icon.png" alt="Quick Dev Tools" width={32} height={32} priority />
          <span className="hidden xs:block sm:block">Quick Dev Tools</span>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/app/notes" className="btn btn-accent px-4 py-2 text-sm">
            Open app
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 text-center">
        <FloatingSnippets />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 mx-auto max-w-3xl">

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs text-fg-muted">
            <Sparkles size={13} className="text-accent" />
            7 developer tools · 1 tab · zero paid services
          </span>

          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            One workspace for{" "}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-accent-hover bg-clip-text text-transparent">
              everything you build
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-fg-muted">
            Stop switching between Notepad++, DAX Studio, JSON validators and
            diff tools. Quick Dev Tools is your single ultra-fast local-first workspace.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <MagneticButton href="/app/notes">
              Open the workspace <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton href="/app/insight" variant="ghost">
              Try DAX Insight
            </MagneticButton>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="relative z-10 mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="card px-4 py-5 text-center">
              <m.icon size={16} className="mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold text-accent">{m.value}</div>
              <div className="mt-1 text-xs text-fg-subtle">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Drag-to-arrange toolkit ────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Your toolkit — arrange it your way</h2>
          <p className="mt-3 text-fg-muted flex items-center justify-center gap-2">
            <GripVertical size={14} className="text-accent" />
            Drag the cards to reorder · click to open any tool
          </p>
        </motion.div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tools} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {orderedTools.map((tool) => (
                <SortableTool key={tool.id} tool={tool} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      {/* ── Interactive feature tabs ───────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Every tool, deeply built</h2>
          <p className="mt-3 text-fg-muted">Click a tool to see what it does</p>
        </motion.div>

        {/* Tab strip — horizontally scrollable on mobile */}
        <div className="mb-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "border-transparent text-white shadow-lg"
                  : "border-border bg-bg-card text-fg-muted hover:border-border-soft hover:text-fg"
              }`}
              style={activeTab === t.id ? { background: t.color } : {}}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <AnimatePresence mode="wait">
          {TOOLS.filter((t) => t.id === activeTab).map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid gap-8 lg:grid-cols-2">

              {/* Info */}
              <div className="flex flex-col justify-center gap-5">
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: `${tool.color}20`, color: tool.color }}>
                  <tool.icon size={13} /> {tool.label}
                </span>
                <h3 className="text-2xl font-bold">{tool.tagline}</h3>
                <ul className="space-y-3">
                  {tool.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-fg-muted">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: tool.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <MagneticButton href={tool.href}>
                  Open {tool.label} <ArrowRight size={15} />
                </MagneticButton>
              </div>

              {/* Preview */}
              <TiltCard className="p-0 overflow-hidden">
                <div
                  className="flex items-center gap-1.5 border-b border-border px-4 py-2.5"
                  style={{ background: `${tool.color}12` }}>
                  <span className="h-3 w-3 rounded-full bg-danger/60" />
                  <span className="h-3 w-3 rounded-full bg-warning/60" />
                  <span className="h-3 w-3 rounded-full bg-success/60" />
                  <span className="ml-3 font-mono text-xs text-fg-subtle">{tool.label}.tsx</span>
                </div>
                <pre className="p-5 font-mono text-xs leading-relaxed text-fg-muted whitespace-pre overflow-x-auto">
                  {tool.preview}
                </pre>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* ── Feature deep-dives ─────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl space-y-28 px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for professionals</h2>
          <p className="mt-3 text-fg-muted">
            Not a prototype — production-quality tools you reach for every day.
          </p>
        </motion.div>

        {TOOLS.slice(0, 4).map((tool, i) => (
          <FeatureRow key={tool.id} tool={tool} flip={i % 2 === 1} index={i} />
        ))}
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Up in 30 seconds</h2>
          <p className="mt-3 text-fg-muted">No account, no cloud, no config.</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: "Clone & install", body: "git clone + npm install. One command starts both servers." },
            { step: "02", title: "Open localhost:3000", body: "All tools immediately available. Sample notes and DAX queries pre-loaded." },
            { step: "03", title: "Work, don't switch tabs", body: "Notes, DAX, JSON, diffs and diagrams — one browser tab, zero friction." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}>
              <TiltCard className="h-full">
                <div className="mb-4 font-mono text-4xl font-bold text-accent/30">{s.step}</div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Local-first callout ────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          <TiltCard>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: Lock, title: "Zero cloud", body: "SQLite on your machine. Your notes, queries and diagrams never leave your computer." },
                { icon: Zap, title: "Instant response", body: "No API round-trips. Every tool responds in milliseconds — even search across thousands of notes." },
                { icon: Wifi, title: "Works offline", body: "All 7 tools function without internet. DAX Insight, JSON Toolkit, Mermaid — all fully offline." },
              ].map((c) => (
                <div key={c.title} className="flex flex-col gap-3">
                  <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <c.icon size={20} />
                  </span>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">{c.body}</p>
                </div>
              ))}
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          <TiltCard className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              One workspace for every developer tool you touch daily
            </h2>
            <p className="mx-auto mt-4 max-w-md text-fg-muted">
              Free, open-source, local-first. No sign-up.
              Clone it and start in 30 seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/app/notes">
                Open Quick Dev Tools <ArrowRight size={16} />
              </MagneticButton>
              <MagneticButton href="https://github.com/kumaresh-rgb/quickdevtool" variant="ghost">
                View on GitHub
              </MagneticButton>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3 font-semibold">
            <Image src="/logo-icon.png" alt="Quick Dev Tools" width={28} height={28} />
            Quick Dev Tools
          </div>
          <div className="flex items-center gap-6 text-sm text-fg-subtle">
            {TOOLS.map((t) => (
              <Link key={t.id} href={t.href} className="hover:text-fg transition-colors hidden lg:block">
                {t.label}
              </Link>
            ))}
          </div>
          <span className="flex items-center gap-2 text-sm text-fg-subtle">
            <HardDrive size={14} /> Built local-first · MIT license
          </span>
        </div>
      </footer>
    </div>
  );
}
