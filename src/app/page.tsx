"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  NotebookPen,
  Braces,
  Brain,
  GitCompare,
  Database,
  Workflow,
  ArrowRight,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FloatingSnippets } from "@/components/landing/FloatingSnippets";
import { TiltCard } from "@/components/landing/TiltCard";
import { MagneticButton } from "@/components/landing/MagneticButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Quick Notes",
    body: "A HyperNotepad-style rich-text editor with slash commands, code blocks, tables, autosave and smart paste for C#, SQL, DAX & JSON.",
    color: "var(--accent)",
  },
  {
    icon: Brain,
    title: "DAX Insight",
    body: "Paste DAX — it explains every keyword with cited sources (dax.guide, SQLBI, MS Learn), draws a flow diagram and estimates execution cost.",
    color: "var(--accent-hover)",
  },
  {
    icon: Database,
    title: "DAX Studio",
    body: "Browser-based DAX studio. Workspace explorer, Monaco editor, execution insights and a paginated enterprise results grid.",
    color: "var(--success)",
  },
  {
    icon: Workflow,
    title: "Mermaid Studio",
    body: "Write Mermaid and render instantly. Zoom, pan, themes, split-screen and export to PNG / SVG.",
    color: "var(--accent)",
  },
  {
    icon: Braces,
    title: "JSON Toolkit",
    body: "Beautify, minify, validate and tree-view JSON. Smart unescape that turns copied payloads into clean DAX.",
    color: "var(--warning)",
  },
  {
    icon: GitCompare,
    title: "Text & Code Compare",
    body: "GitHub-style side-by-side and inline diff with word-level highlighting, plus a drag-and-drop Kanban board.",
    color: "var(--danger)",
  },
];

const METRICS = [
  { value: "< 1s", label: "First load" },
  { value: "< 50ms", label: "Interaction" },
  { value: "< 100ms", label: "Search" },
  { value: "6-in-1", label: "Tools unified" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <CursorGlow />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo.png"
            alt="Quick Notes"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          Quick Notes
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/app/notes" className="btn btn-ghost px-4 py-2 text-sm">
            Open app
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 text-center">
        <FloatingSnippets />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 mx-auto max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs text-fg-muted">
            <Sparkles size={13} className="text-accent" />
            Notion + Obsidian + VS Code + DAX Studio — for developers
          </span>

          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            One ultra-fast workspace for{" "}
            <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              everything you build
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-fg-muted">
            Stop context-switching between Notepad++, DAX Studio, JSON tools and
            diff viewers. Notes, DAX, JSON, diffs and Kanban — all in one place.
            Built to feel instant.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton href="/app/notes">
              Start writing <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton href="/app/studio" variant="ghost">
              Open DAX Studio
            </MagneticButton>
            <MagneticButton href="/app/json" variant="ghost">
              Try JSON formatter
            </MagneticButton>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="relative z-10 mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="card px-4 py-5">
              <div className="text-2xl font-bold text-accent">{m.value}</div>
              <div className="mt-1 text-xs text-fg-subtle">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything a developer touches daily
          </h2>
          <p className="mt-3 text-fg-muted">
            Six tools, one tab, zero context switching.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}>
              <TiltCard className="h-full">
                <span
                  className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: "var(--accent-soft)", color: f.color }}>
                  <f.icon size={20} />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {f.body}
                </p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <TiltCard className="text-center">
          <h2 className="text-3xl font-bold">Ready to work in one place?</h2>
          <p className="mx-auto mt-3 max-w-md text-fg-muted">
            No sign-up needed. Runs locally on your machine — your notes and
            queries never leave it.
          </p>
          <div className="mt-7 flex justify-center">
            <MagneticButton href="/app/notes">
              Open the workspace <ArrowRight size={16} />
            </MagneticButton>
          </div>
        </TiltCard>
      </section>

      <footer className="relative z-10 border-t border-border-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-fg-subtle sm:flex-row">
          <span>Quick Developer Notes — built local-first.</span>
          <span className="inline-flex items-center gap-2">
            <HardDrive size={15} /> Self-hosted
          </span>
        </div>
      </footer>
    </div>
  );
}
