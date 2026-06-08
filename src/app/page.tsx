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
  type DragEndEvent,
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
  NotebookPen,
  Braces,
  Brain,
  GitCompare,
  Database,
  Workflow,
  FileText,
  PenLine,
  ArrowRight,
  Sparkles,
  KanbanSquare,
  GripVertical,
  CheckCircle2,
  Zap,
  Lock,
  Wifi,
  ChevronRight,
  Globe,
  Server,
  Users,
  GitFork,
  Map,
  GitBranch,
  HardDrive,
  Shield,
  ExternalLink,
  Circle,
} from "lucide-react";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FloatingSnippets } from "@/components/landing/FloatingSnippets";
import { TiltCard } from "@/components/landing/TiltCard";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ─── Tool registry ──────────────────────────────────────── */
const TOOLS = [
  {
    id: "notes",
    icon: NotebookPen,
    label: "Quick Notes",
    color: "#818cf8",
    href: "/app/notes",
    tagline: "Rich-text notes with smart code detection",
    bullets: [
      "TipTap editor — headings, lists, tables, code blocks",
      "Smart Paste — auto-detects JSON, DAX, SQL, Mermaid",
      "1-second autosave to browser storage",
      "Collapsible sidebar, search & pin",
    ],
    preview: `// Smart Paste — detects language, wraps in code block
const result = await fetch('/api/notes');
const notes  = await result.json();

// Also detects DAX, SQL, Mermaid, JSON, XML
CALCULATE(SUM(Sales[Amount]),
  FILTER(ALL(Calendar), ...))`,
  },
  {
    id: "markdown",
    icon: FileText,
    label: "MD Studio",
    color: "#38bdf8",
    href: "/app/markdown",
    tagline: "Documentation workspace with live preview",
    bullets: [
      "Monaco editor + GitHub-style live preview",
      "Mermaid diagram rendering built-in",
      "Pin, search & auto-save to local storage",
      "Word count, reading time, export to .md",
    ],
    preview: `┌─ Explorer ──┐ ┌─ Editor ───┐ ┌─ Preview ──┐
│ 📌 README   │ │ # My Docs  │ │ My Docs    │
│  API Guide  │ │            │ │ ─────────  │
│  Changelog  │ │ ## Setup   │ │ Setup      │
└─────────────┘ │ ...        │ │ ...        │
                └────────────┘ └────────────┘`,
  },
  {
    id: "insight",
    icon: Brain,
    label: "DAX Insight",
    color: "#a78bfa",
    href: "/app/insight",
    tagline: "AI-style DAX analysis with cited sources",
    bullets: [
      "Explains every keyword — dax.guide, SQLBI, MS Learn",
      "Generates Mermaid execution-flow automatically",
      "SE / FE cost estimate · cardinality warnings",
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
    id: "studio",
    icon: Database,
    label: "DAX Studio",
    color: "#34d399",
    href: "/app/studio",
    tagline: "Enterprise DAX IDE in the browser",
    bullets: [
      "Monaco editor with DAX syntax & hover citations",
      "Dev / QA / UAT / Prod connection profiles",
      "Paginated results grid — 100 / 500 / 1000 rows",
      "Sort, filter, resize, CSV & Excel export",
    ],
    preview: `┌─ Explorer ──────────┐  ┌─ Editor ───────────┐
│ ▼ Production        │  │  EVALUATE          │
│   └─ Sales Model    │  │  TOPN(10,          │
│ ▼ QA                │  │    SUMMARIZE(...)) │
└─────────────────────┘  └────────────────────┘
  SE: 82%  FE: 18%  1 000 rows  43 ms`,
  },
  {
    id: "mermaid",
    icon: Workflow,
    label: "Mermaid Studio",
    color: "#6366f1",
    href: "/app/mermaid",
    tagline: "Live diagram IDE — zoom, pan, export",
    bullets: [
      "Split-screen: code left, live diagram right",
      "5 themes · PNG (2× retina) · SVG export",
      "Mouse zoom & pan on rendered diagram",
    ],
    preview: `graph TD
  A[Request] --> B{Authenticated?}
  B -- Yes --> C[Load Data]
  B -- No  --> D[401]
  C --> E[Apply Filters]
  E --> F[Return JSON]`,
  },
  {
    id: "json",
    icon: Braces,
    label: "JSON Toolkit",
    color: "#fbbf24",
    href: "/app/json",
    tagline: "JSON utility belt — beautify to validate",
    bullets: [
      "Beautify / minify / validate in one click",
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
    id: "compare",
    icon: GitCompare,
    label: "Text Compare",
    color: "#f87171",
    href: "/app/compare",
    tagline: "GitHub-style diff with word-level precision",
    bullets: [
      "Side-by-side and inline diff modes",
      "Word-level highlighting inside changed lines",
      "Works with SQL · JSON · DAX · markdown",
    ],
    preview: `─── Left ──────────────  ─── Right ─────────────
  SELECT *              │   SELECT id, name
  FROM Orders           │   FROM Orders
- WHERE status='new'    │ + WHERE status IN
                        │     ('new','open')
  ORDER BY created      │   ORDER BY created`,
  },
  {
    id: "kanban",
    icon: KanbanSquare,
    label: "Kanban",
    color: "#fb923c",
    href: "/app/kanban",
    tagline: "Enterprise task board for developer workflows",
    bullets: [
      "Full task modal: type · priority · due date · tags",
      "Drag cards across 5 columns",
      "Insights dashboard with completion analytics",
    ],
    preview: `┌─ Backlog ──┐ ┌─ In Progress ─┐ ┌─ Done ─┐
│ Fix login  │ │ DAX Insight  │ │ Docs   │
│ Add tests  │ │ Landing page │ │ Auth   │
└────────────┘ └──────────────┘ └────────┘
         ↕ drag cards · full task details`,
  },
  {
    id: "whiteboard",
    icon: PenLine,
    label: "Quick Board",
    color: "#e879f9",
    href: "/app/whiteboard",
    tagline: "Coming soon — AI-powered infinite canvas",
    bullets: [
      "Infinite canvas with shapes, connectors & sticky notes",
      "AI Copilot: generate system designs from a prompt",
      "Real-time multiplayer editing with live cursors",
      "Export to PNG · SVG · PDF",
    ],
    preview: `  ┌──────────────────────────────────────┐
  │        🚧  Coming Soon               │
  │                                      │
  │  Quick Board is under active         │
  │  development. Sign up to get         │
  │  notified when it launches.          │
  │                                      │
  └──────────────────────────────────────┘`,
  },
];

const ROADMAP = [
  {
    status: "done",
    label: "Rich-text notes editor (TipTap v3)",
    desc: "Full slash-command support, smart paste, autosave",
  },
  {
    status: "done",
    label: "DAX Insight with cited sources",
    desc: "Keyword explanations with dax.guide, SQLBI & MS Learn",
  },
  {
    status: "done",
    label: "Mermaid Studio (zoom, pan, export)",
    desc: "Split-screen live editor with 5 themes and PNG/SVG export",
  },
  {
    status: "done",
    label: "DAX Studio enterprise grid",
    desc: "Monaco editor, connection profiles, 1 000-row pagination",
  },
  {
    status: "done",
    label: "Kanban board (drag-and-drop)",
    desc: "Task modal with 15+ fields, insights dashboard",
  },
  {
    status: "done",
    label: "JSON Toolkit (tree view + validate)",
    desc: "Beautify, minify, validate with tree explorer",
  },
  {
    status: "done",
    label: "Text Compare (word-level diff)",
    desc: "Side-by-side and inline modes, word highlighting",
  },
  {
    status: "done",
    label: "MD Studio (documentation workspace)",
    desc: "Monaco editor + live preview + Mermaid + localStorage",
  },
  {
    status: "active",
    label: "Quick Board (AI infinite canvas)",
    desc: "Infinite canvas with shapes, connectors, sticky notes and AI Copilot — in progress",
  },
  {
    status: "active",
    label: "Quick Board AI Copilot",
    desc: "Generate system designs and diagrams from natural language",
  },
  {
    status: "active",
    label: "Real-time collaboration (Liveblocks)",
    desc: "Live cursors, presence, and multi-user canvas editing",
  },
  {
    status: "planned",
    label: "AI DAX assistant (plug-in your key)",
    desc: "Natural language Q&A — cite your own sources first",
  },
  {
    status: "planned",
    label: "Dashboard with resizable widgets",
    desc: "Drag, resize and save your own analytics layout",
  },
];

/* ─── Section wrapper helper ─────────────────────────────── */
function SectionBadge({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1 text-xs font-medium text-fg-muted">
      <Icon size={12} className="text-accent" /> {label}
    </span>
  );
}

/* ─── Sortable tool card ─────────────────────────────────── */
function SortableTool({ tool }: { tool: (typeof TOOLS)[0] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.85 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <TiltCard
        className={`flex h-full select-none flex-col gap-3 p-4 ${isDragging ? "scale-105 shadow-2xl ring-2 ring-accent/50" : ""}`}>
        <div className="flex items-start justify-between">
          <span
            className="inline-grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: `${tool.color}18`, color: tool.color }}>
            <tool.icon size={20} />
          </span>
          <span
            className="cursor-grab touch-none text-fg-subtle/40 hover:text-fg-subtle/70"
            {...attributes}
            {...listeners}>
            <GripVertical size={16} />
          </span>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold">{tool.label}</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">
            {tool.tagline}
          </p>
        </div>
        <Link
          href={tool.href}
          className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium"
          style={{ color: tool.color }}
          onClick={(e) => e.stopPropagation()}>
          Open <ChevronRight size={11} />
        </Link>
      </TiltCard>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Landing() {
  const [tools, setTools] = useState(TOOLS.map((t) => t.id));
  const [activeTab, setActiveTab] = useState(TOOLS[0].id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <CursorGlow />

      {/* ══ Nav ═════════════════════════════════════════════ */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[18px] font-semibold sm:text-[16px]">
          <Image
            src="/logo-icon.png"
            alt="Quick Dev Tools"
            width={32}
            height={32}
            priority
            className="h-7 w-7 sm:h-8 sm:w-8"
          />
          <span>Quick Dev Tools</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <div className="[&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none">
            <ThemeToggle />
          </div>
          <Link
            href="https://github.com/kumaresh-rgb/quickdevtool"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-card hover:text-fg sm:inline-flex">
            <GitFork size={14} /> GitHub
          </Link>
          <Link href="/app/notes" className="btn btn-accent px-4 py-2 text-sm">
            Open app
          </Link>
        </nav>
      </header>

      {/* ══ Sections ════════════════════════════════════════ */}
      <div className="flex flex-col gap-28 pb-28">
        {/* ── Hero ──────────────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-16 text-center sm:pt-24">
          <FloatingSnippets />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative z-10 mx-auto max-w-[720px]">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-7 flex flex-wrap items-center justify-center gap-2">
              {[
                "Open Source",
                "Free Forever",
                "Local-First",
                "Self-Hostable",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1 text-xs font-medium text-fg-muted">
                  <CheckCircle2 size={10} className="text-success" /> {tag}
                </span>
              ))}
            </motion.div>

            {/* Heading */}
            <h1 className="text-balance text-[2.2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              One workspace for{" "}
              <span className="bg-gradient-to-r from-accent via-purple-400 to-accent-hover bg-clip-text text-transparent">
                everything you build
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-balance text-base text-fg-muted sm:text-lg">
              Notes · MD Studio · DAX Insight · Mermaid · JSON · Diff · Kanban
              — all local-first, all free, all in one tab.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <MagneticButton href="/app/notes">
                Open the workspace <ArrowRight size={16} />
              </MagneticButton>
              <MagneticButton
                href="https://github.com/kumaresh-rgb/quickdevtool"
                variant="ghost">
                <GitFork size={15} /> View on GitHub
              </MagneticButton>
            </div>
          </motion.div>

          {/* Stats strip */}
          <div className="relative z-10 mx-auto mt-14 grid max-w-xl grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
            {[
              { icon: Zap, value: "8", label: "Built-in tools" },
              { icon: Lock, value: "0", label: "Paid services" },
              { icon: Wifi, value: "100%", label: "Local-first" },
              { icon: GitFork, value: "MIT", label: "Open source" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="card flex flex-col items-center gap-1.5 px-4 py-5">
                <m.icon size={16} className="text-accent" />
                <div className="text-xl font-bold text-accent sm:text-2xl">
                  {m.value}
                </div>
                <div className="text-[11px] text-fg-subtle">{m.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Why open source ───────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center">
            <SectionBadge icon={Globe} label="Open Source Philosophy" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Built different. By design.
            </h2>
            <p className="mt-3 max-w-md mx-auto text-fg-muted">
              Most developer tools make you pay. Quick Dev Tools is different.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Open Source",
                color: "#6366f1",
                body: "Every line on GitHub. Fork it, extend it, submit a PR. No black boxes, no hidden logic.",
              },
              {
                icon: Lock,
                title: "Privacy First",
                color: "#10b981",
                body: "Notes and diagrams stay in your browser's local storage. Nothing is uploaded anywhere, ever.",
              },
              {
                icon: Server,
                title: "Self-Hostable",
                color: "#f59e0b",
                body: "Run it on your laptop, home server, or company VM. One command — no Docker required.",
              },
              {
                icon: Wifi,
                title: "Local-First",
                color: "#8b5cf6",
                body: "All data lives in your browser — no server, no sync, no account. Tools keep working after the page loads.",
              },
              {
                icon: Zap,
                title: "Genuinely Fast",
                color: "#ef4444",
                body: "Browser storage means instant reads. No CDN round-trips, no network latency, no spinners on every click.",
              },
              {
                icon: Users,
                title: "Community Driven",
                color: "#f97316",
                body: "Roadmap is public. Issues are open. Features are driven by what developers actually need.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}>
                <TiltCard className="h-full">
                  <span
                    className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl"
                    style={{ background: `${c.color}15`, color: c.color }}>
                    <c.icon size={20} />
                  </span>
                  <h3 className="text-[15px] font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {c.body}
                  </p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Drag-to-arrange toolkit ───────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center">
            <SectionBadge icon={GripVertical} label="Interactive" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Your toolkit — arrange it your way
            </h2>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-fg-muted">
              <GripVertical size={13} className="text-accent" />
              Drag the cards to reorder · click any to open
            </p>
          </motion.div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext items={tools} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {orderedTools.map((tool) => (
                  <SortableTool key={tool.id} tool={tool} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* ── Feature tabs ──────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center">
            <SectionBadge icon={Sparkles} label="Production Quality" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Every tool, deeply built
            </h2>
            <p className="mt-3 text-fg-muted">
              Click any tool to explore what it does
            </p>
          </motion.div>

          {/* Tab strip */}
          <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                  activeTab === t.id
                    ? "border-transparent text-white shadow-md"
                    : "border-border bg-bg-card text-fg-muted hover:text-fg"
                }`}
                style={activeTab === t.id ? { background: t.color } : {}}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {TOOLS.filter((t) => t.id === activeTab).map((tool) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-col gap-5">
                  <span
                    className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: `${tool.color}18`,
                      color: tool.color,
                    }}>
                    <tool.icon size={13} /> {tool.label}
                  </span>
                  <h3 className="text-2xl font-bold leading-snug sm:text-3xl">
                    {tool.tagline}
                  </h3>
                  <ul className="space-y-3">
                    {tool.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3 text-sm text-fg-muted">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0"
                          style={{ color: tool.color }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tool.href}
                    className="inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: tool.color }}>
                    Open {tool.label} <ArrowRight size={14} />
                  </Link>
                </div>

                <TiltCard className="overflow-hidden p-0">
                  <div
                    className="flex items-center gap-1.5 border-b border-border px-4 py-3"
                    style={{ background: `${tool.color}10` }}>
                    <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                    <span className="ml-3 font-mono text-[11px] text-fg-subtle">
                      {tool.label}
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-6 font-mono text-[11px] leading-relaxed text-fg-muted">
                    {tool.preview}
                  </pre>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* ── Self-host in 30 seconds ───────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-5xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center">
            <SectionBadge icon={Server} label="Self-Hosted" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              Up and running in 30 seconds
            </h2>
            <p className="mt-3 text-fg-muted">
              No Docker. No cloud account. No credit card.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Clone the repo",
                code: "git clone github.com/\nkumaresh-rgb/quickdevtool",
                note: "Public MIT-licensed repo",
              },
              {
                step: "02",
                title: "Install & start",
                code: "npm install\nnpm run dev",
                note: "Single command, no backend needed",
              },
              {
                step: "03",
                title: "Open localhost:3000",
                code: "# All tools open instantly\n# Saves to browser storage\n# Zero configuration",
                note: "Zero configuration",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}>
                <TiltCard className="h-full">
                  <div className="mb-4 font-mono text-4xl font-bold text-accent/20">
                    {s.step}
                  </div>
                  <h3 className="mb-1 font-semibold">{s.title}</h3>
                  <p className="mb-3 text-[11px] text-fg-subtle">{s.note}</p>
                  <pre className="rounded-lg bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
                    {s.code}
                  </pre>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Local-first callout ───────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-5xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <TiltCard className="p-8 sm:p-10">
              <div className="mb-8 text-center">
                <SectionBadge icon={Shield} label="Privacy First" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Your data stays yours. Always.
                </h2>
                <p className="mt-2 text-fg-muted">
                  No account required. No telemetry. No cloud sync. Ever.
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    icon: Lock,
                    title: "Zero cloud",
                    body: "Browser storage on your machine. Everything saves locally — nothing ever leaves your device.",
                  },
                  {
                    icon: Zap,
                    title: "Instant response",
                    body: "No API round-trips. Every tool responds in milliseconds — reads straight from browser storage.",
                  },
                  {
                    icon: Shield,
                    title: "Your data, always",
                    body: "No account, no sync, no telemetry. Your work stays yours. Permanently.",
                  },
                ].map((c) => (
                  <div key={c.title} className="flex flex-col gap-3">
                    <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                      <c.icon size={20} />
                    </span>
                    <h3 className="font-semibold">{c.title}</h3>
                    <p className="text-sm leading-relaxed text-fg-muted">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            </TiltCard>
          </motion.div>
        </section>

        {/* ── Public roadmap ────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-5xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center">
            <SectionBadge icon={Map} label="Public Roadmap" />
            <h2 className="text-3xl font-bold sm:text-4xl">
              What&apos;s coming next
            </h2>
            <p className="mt-3 text-fg-muted">
              Community-driven. Every feature starts as a GitHub issue.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ROADMAP.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 rounded-xl border border-border-soft bg-bg-card px-5 py-4">
                {/* Status dot */}
                <div className="mt-0.5 shrink-0">
                  {item.status === "done" ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15">
                      <CheckCircle2 size={13} className="text-success" />
                    </span>
                  ) : item.status === "active" ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
                      <Circle size={10} className="text-accent fill-accent" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-fg-subtle/10">
                      <Circle size={10} className="text-fg-subtle/40" />
                    </span>
                  )}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-medium ${item.status === "done" ? "text-fg-subtle line-through" : "text-fg"}`}>
                      {item.label}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.status === "done"
                          ? "bg-success/10 text-success"
                          : item.status === "active"
                            ? "bg-accent/10 text-accent"
                            : "bg-fg-subtle/10 text-fg-subtle"
                      }`}>
                      {item.status === "done"
                        ? "Done"
                        : item.status === "active"
                          ? "Active"
                          : "Planned"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center">
            <Link
              href="https://github.com/kumaresh-rgb/quickdevtool/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline">
              <GitBranch size={15} /> Request a feature on GitHub
            </Link>
          </motion.div>
        </section>

        {/* ── Final CTA ─────────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-3xl px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <div className="mb-5 flex justify-center">
              <Image
                src="/logo-icon.png"
                alt="Quick Dev Tools"
                width={56}
                height={56}
              />
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Your tools. Your machine. Your rules.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-fg-muted">
              No accounts. No cloud. No subscriptions. Just a workspace that
              works — offline, fast, forever free.
            </p>
            <p className="mt-3 text-xs text-fg-subtle">
              Crafted with ❤️ by{" "}
              <Link
                href="https://kumaresh.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline">
                Kumaresh
              </Link>
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <MagneticButton href="/app/notes">
                Open Workspace <ArrowRight size={15} />
              </MagneticButton>
              <MagneticButton
                href="https://github.com/kumaresh-rgb/quickdevtool"
                variant="ghost">
                <GitFork size={15} /> Star on GitHub
              </MagneticButton>
            </div>
          </motion.div>
        </section>
      </div>

      {/* ══ Footer ══════════════════════════════════════════ */}
      <footer className="relative z-10 mt-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] font-semibold">
            <Image
              src="/logo-icon.png"
              alt="Quick Dev Tools"
              width={20}
              height={20}
            />
            Quick Dev Tools
          </Link>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-fg-subtle">
            {TOOLS.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className="hidden transition-colors hover:text-fg lg:block">
                {t.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <HardDrive size={12} /> Local-first · MIT
            </span>
            <span className="text-fg-subtle/30">·</span>
            <Link
              href="https://kumaresh.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-fg">
              Crafted with ❤️ by{" "}
              <span className="font-semibold text-accent">Kumaresh</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
