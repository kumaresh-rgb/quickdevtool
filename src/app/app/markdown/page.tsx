"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FileText, Plus, Trash2, Search, Edit3, Eye, Columns2, Focus,
  Download, Copy, Check, Clock, AlignLeft, Hash, BookOpen,
  ChevronRight, FileCode, Star, StarOff, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useCopy } from "@/lib/useCopy";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/* ─── Types ─────────────────────────────────────────────── */
interface MdDoc {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: number;
}

type ViewMode = "edit" | "split" | "preview";

/* ─── Storage ───────────────────────────────────────────── */
const STORAGE_KEY = "qdt-md-docs";

function loadDocs(): MdDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MdDoc[]) : [];
  } catch {
    return [];
  }
}
function saveDocs(docs: MdDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ─── Stats helper ──────────────────────────────────────── */
function textStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return { words, chars, mins };
}

/* ─── Markdown preview ──────────────────────────────────── */
function MarkdownPreview({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;

    async function render() {
      const { marked } = await import("marked");
      marked.setOptions({ breaks: true, gfm: true } as Parameters<typeof marked.setOptions>[0]);

      // Pre-process: replace mermaid blocks with placeholders
      const mermaidBlocks: string[] = [];
      const withPlaceholders = content.replace(
        /```mermaid\n([\s\S]*?)```/g,
        (_, code: string) => {
          const idx = mermaidBlocks.length;
          mermaidBlocks.push(code.trim());
          return `<div data-mermaid="${idx}" class="mermaid-placeholder"></div>`;
        }
      );

      const html = await marked.parse(withPlaceholders);
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = html;

      // Render mermaid diagrams
      if (mermaidBlocks.length) {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
        const placeholders = ref.current.querySelectorAll<HTMLElement>("[data-mermaid]");
        for (const el of placeholders) {
          const idx = Number(el.getAttribute("data-mermaid"));
          const code = mermaidBlocks[idx];
          const id = `md-mermaid-${idx}-${Date.now()}`;
          try {
            const { svg } = await mermaid.render(id, code);
            if (!cancelled) el.innerHTML = svg;
          } catch {
            if (!cancelled) el.textContent = "⚠ Mermaid syntax error";
          }
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [content]);

  return (
    <div
      ref={ref}
      className="md-preview min-h-full p-6 sm:p-8"
    />
  );
}

/* ─── Empty state ───────────────────────────────────────── */
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
        <FileText size={28} className="text-accent" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">No document selected</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Create a new document or select one from the explorer
        </p>
      </div>
      <button onClick={onNew} className="btn btn-accent gap-2 px-5 py-2.5 text-sm">
        <Plus size={16} /> New Document
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function MdStudioPage() {
  const [docs, setDocs]         = useState<MdDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView]         = useState<ViewMode>("split");
  const [search, setSearch]     = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [isDark, setIsDark]     = useState(false);
  const [copied, copy]          = useCopy();
  const saveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [splitPct, setSplitPct] = useState(50);
  const splitRef                = useRef(50);
  const panelsRef               = useRef<HTMLDivElement>(null);

  /* load from localStorage on mount */
  useEffect(() => {
    const stored = loadDocs();
    if (stored.length) {
      setDocs(stored);
      setActiveId(stored[0].id);
    }
    setIsDark(!document.documentElement.classList.contains("light"));
    const s = Number(localStorage.getItem("qdt-md-split") || "0");
    if (s >= 15 && s <= 85) { setSplitPct(s); splitRef.current = s; }
  }, []);

  /* detect theme changes */
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(!document.documentElement.classList.contains("light"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const activeDoc = useMemo(() => docs.find((d) => d.id === activeId) ?? null, [docs, activeId]);
  const stats     = useMemo(() => textStats(activeDoc?.content ?? ""), [activeDoc?.content]);

  /* auto-save with debounce */
  const updateContent = useCallback((val: string | undefined) => {
    if (val === undefined) return;
    setDocs((prev) => {
      const next = prev.map((d) =>
        d.id === activeId ? { ...d, content: val, updatedAt: Date.now() } : d
      );
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDocs(next), 800);
      return next;
    });
  }, [activeId]);

  function newDoc() {
    const doc: MdDoc = {
      id: makeId(),
      title: "Untitled",
      content: STARTER,
      pinned: false,
      updatedAt: Date.now(),
    };
    setDocs((prev) => {
      const next = [doc, ...prev];
      saveDocs(next);
      return next;
    });
    setActiveId(doc.id);
  }

  function deleteDoc(id: string) {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveDocs(next);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  function togglePin(id: string) {
    setDocs((prev) => {
      const next = prev.map((d) => d.id === id ? { ...d, pinned: !d.pinned } : d);
      saveDocs(next);
      return next;
    });
  }

  function startRename(doc: MdDoc) {
    setRenaming(doc.id);
    setRenameVal(doc.title);
  }

  function commitRename() {
    if (!renaming) return;
    const title = renameVal.trim() || "Untitled";
    setDocs((prev) => {
      const next = prev.map((d) => d.id === renaming ? { ...d, title, updatedAt: Date.now() } : d);
      saveDocs(next);
      return next;
    });
    setRenaming(null);
  }

  function downloadMd() {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: "text/markdown" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${activeDoc.title.replace(/[^a-z0-9]/gi, "-")}.md`;
    a.click();
  }

  function startSplitDrag(e: React.MouseEvent) {
    e.preventDefault();
    function move(ev: MouseEvent) {
      if (!panelsRef.current) return;
      const { left, width } = panelsRef.current.getBoundingClientRect();
      const pct = Math.max(15, Math.min(85, ((ev.clientX - left) / width) * 100));
      setSplitPct(pct);
      splitRef.current = pct;
    }
    function up() {
      localStorage.setItem("qdt-md-split", String(splitRef.current));
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const sorted = [...docs].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return q ? sorted.filter((d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)) : sorted;
  }, [docs, search]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: Explorer ─────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-bg-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Explorer</span>
          <button
            onClick={newDoc}
            className="rounded p-1 text-fg-subtle hover:bg-bg-card hover:text-fg"
            title="New document">
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-2 py-2">
          <div className="flex items-center gap-1.5 rounded-md bg-bg px-2 py-1.5">
            <Search size={12} className="shrink-0 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search docs…"
              className="w-full bg-transparent text-[11px] outline-none placeholder:text-fg-subtle"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={11} className="text-fg-subtle" />
              </button>
            )}
          </div>
        </div>

        {/* Doc list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-[11px] text-fg-subtle">
              {search ? "No results" : "No documents yet"}
            </div>
          )}
          {filtered.map((doc) => (
            <div key={doc.id}
              className={cn(
                "group flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] transition-colors",
                activeId === doc.id
                  ? "bg-accent-soft text-accent"
                  : "text-fg-muted hover:bg-bg-card hover:text-fg"
              )}
              onClick={() => setActiveId(doc.id)}>

              {renaming === doc.id ? (
                <input
                  autoFocus
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                  className="flex-1 rounded bg-bg px-1 text-[12px] outline-none ring-1 ring-accent"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <FileText size={13} className="shrink-0" />
                  <span className="flex-1 truncate">{doc.title}</span>
                  {doc.pinned && <Star size={10} className="shrink-0 text-warning" />}
                  <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(doc.id); }}
                      className="rounded p-0.5 hover:bg-bg-elevated"
                      title={doc.pinned ? "Unpin" : "Pin"}>
                      {doc.pinned ? <StarOff size={10} /> : <Star size={10} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(doc); }}
                      className="rounded p-0.5 hover:bg-bg-elevated"
                      title="Rename">
                      <Edit3 size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                      className="rounded p-0.5 hover:bg-bg-elevated hover:text-danger"
                      title="Delete">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 text-[10px] text-fg-subtle">
          {docs.length} document{docs.length !== 1 ? "s" : ""}
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-bg px-4 py-2">
          {/* Left: title + stats */}
          <div className="flex min-w-0 items-center gap-3">
            {activeDoc ? (
              <span
                className="cursor-pointer truncate text-sm font-semibold text-fg hover:text-accent"
                onClick={() => activeDoc && startRename(activeDoc)}
                title="Click to rename">
                {activeDoc.title}
              </span>
            ) : (
              <span className="text-sm text-fg-subtle">MD Studio</span>
            )}
            {activeDoc && (
              <div className="hidden items-center gap-3 text-[10px] text-fg-subtle sm:flex">
                <span className="flex items-center gap-1"><AlignLeft size={10} /> {stats.words} words</span>
                <span className="flex items-center gap-1"><Hash size={10} /> {stats.chars} chars</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {stats.mins} min read</span>
              </div>
            )}
          </div>

          {/* Right: view + actions */}
          <div className="flex items-center gap-1">
            {/* View modes */}
            <div className="flex rounded-lg border border-border">
              {([ ["edit", Edit3, "Edit"], ["split", Columns2, "Split"], ["preview", Eye, "Preview"] ] as const).map(
                ([mode, Icon, label]) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    title={label}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors first:rounded-l-md last:rounded-r-md",
                      view === mode ? "bg-accent text-white" : "text-fg-subtle hover:text-fg"
                    )}>
                    <Icon size={13} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                )
              )}
            </div>

            {activeDoc && (
              <>
                <button
                  onClick={() => copy(activeDoc.content)}
                  className="btn btn-ghost p-2 text-xs"
                  title="Copy markdown">
                  {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
                <button
                  onClick={downloadMd}
                  className="btn btn-ghost p-2 text-xs"
                  title="Download .md">
                  <Download size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content area */}
        {!activeDoc ? (
          <EmptyState onNew={newDoc} />
        ) : (
          <div ref={panelsRef} className="flex min-h-0 flex-1 overflow-hidden">

            {/* Editor panel */}
            {(view === "edit" || view === "split") && (
              <div
                className={cn("flex min-w-0 flex-col border-r border-border", view !== "split" && "flex-1")}
                style={view === "split" ? { width: `${splitPct}%` } : undefined}
              >
                <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[10px] text-fg-subtle">
                  <FileCode size={11} /> Markdown
                </div>
                <div className="min-h-0 flex-1">
                  <MonacoEditor
                    language="markdown"
                    value={activeDoc.content}
                    onChange={updateContent}
                    theme={isDark ? "vs-dark" : "light"}
                    options={{
                      fontSize: 13,
                      fontFamily: "JetBrains Mono, Menlo, monospace",
                      lineHeight: 22,
                      wordWrap: "on",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      padding: { top: 16, bottom: 16 },
                      lineNumbers: "off",
                      folding: false,
                      renderLineHighlight: "none",
                      overviewRulerLanes: 0,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Draggable divider */}
            {view === "split" && (
              <div
                className="group relative flex w-1 shrink-0 cursor-col-resize select-none items-center justify-center bg-border transition-colors hover:bg-accent/50 active:bg-accent/70"
                onMouseDown={startSplitDrag}
              >
                <div className="pointer-events-none flex flex-col items-center gap-[3px]">
                  <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
                  <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
                  <span className="h-1 w-1 rounded-full bg-fg-subtle/30 group-hover:bg-accent/80" />
                </div>
              </div>
            )}

            {/* Preview panel */}
            {(view === "preview" || view === "split") && (
              <div
                className={cn("flex min-w-0 flex-col overflow-hidden", view !== "split" && "flex-1")}
                style={view === "split" ? { width: `${100 - splitPct}%` } : undefined}
              >
                <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[10px] text-fg-subtle">
                  <BookOpen size={11} /> Preview
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <MarkdownPreview content={activeDoc.content} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Starter document ───────────────────────────────────── */
const STARTER = `# Quick Dev Tools — Documentation

Welcome to **MD Studio**, your developer documentation workspace.

## What is MD Studio?

MD Studio is a **local-first documentation workspace** built for developers.
Think GitHub README + Obsidian + VS Code Preview — all in one panel.

## Features

- ✅ Live split-screen preview
- ✅ Monaco editor with markdown syntax
- ✅ Mermaid diagram support
- ✅ Auto-save to browser storage
- ✅ Word count & reading time
- ✅ Pin & search documents

## Architecture

\`\`\`mermaid
graph TD
  A[User] --> B[Quick Dev Tools]
  B --> C[Quick Notes]
  B --> D[MD Studio]
  B --> E[DAX Insight]
  B --> F[Kanban]
  D --> G[Monaco Editor]
  D --> H[Live Preview]
  D --> I[Mermaid Renderer]
\`\`\`

## Code Example

\`\`\`typescript
interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

function saveDoc(doc: Document): void {
  localStorage.setItem(doc.id, JSON.stringify(doc));
}
\`\`\`

## Task List

- [x] Build the notes module
- [x] Build DAX Insight
- [x] Build MD Studio
- [ ] Add knowledge graph
- [ ] AI documentation generation

## Table

| Tool         | Type          | Status |
|--------------|---------------|--------|
| Quick Notes  | Text editor   | ✅ Done |
| MD Studio    | Doc workspace | ✅ Done |
| DAX Insight  | Analysis      | ✅ Done |
| Kanban       | Task board    | ✅ Done |

> **Tip:** Use \`Split\` view to edit and preview simultaneously.
`;
