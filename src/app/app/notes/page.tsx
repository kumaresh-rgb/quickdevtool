"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, Search, Pin, Trash2, PanelLeftClose, PanelLeft, Check, FileText,
} from "lucide-react";
import type { Note } from "@/lib/api";
import { RichEditor } from "@/components/notes/RichEditor";
import { cn } from "@/lib/cn";

/* ─── localStorage helpers ───────────────────────────────── */

const STORE_KEY = "qdt-notes-v2";

function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
  catch { return []; }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}

function mkNote(title = "Untitled"): Note {
  const now = new Date().toISOString();
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title, content: "", tags: "", isPinned: false,
    isArchived: false, folder: null, createdAt: now, updatedAt: now,
  };
}

function plainPreview(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/* ─── Page ───────────────────────────────────────────────── */

export default function QuickNotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery]       = useState("");
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [status, setStatus]     = useState<"idle" | "saving" | "saved">("idle");
  const [listOpen, setListOpen] = useState(true);
  const [mounted, setMounted]   = useState(false);
  const saveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Load from localStorage on mount */
  useEffect(() => {
    const stored = loadNotes();
    setNotes(stored);
    setActiveId(stored[0]?.id ?? null);
    setMounted(true);
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  /* Sync editor when active note changes */
  useEffect(() => {
    if (active) {
      setTitle(active.title);
      setContent(active.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  /* Filtered list */
  const filtered = query
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        plainPreview(n.content).toLowerCase().includes(query.toLowerCase())
      )
    : notes;

  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  /* Persist changes */
  const persist = useCallback(
    (nextTitle: string, nextContent: string) => {
      if (!active) return;
      const now = new Date().toISOString();
      const updated: Note = { ...active, title: nextTitle, content: nextContent, updatedAt: now };
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === active.id ? updated : n));
        saveNotes(next);
        return next;
      });
      setStatus("saved");
    },
    [active],
  );

  function scheduleSave(nextTitle: string, nextContent: string) {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextTitle, nextContent), 1000);
  }

  function createNote() {
    const note = mkNote();
    setNotes((prev) => {
      const next = [note, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveId(note.id);
  }

  function togglePin(e: React.MouseEvent, n: Note) {
    e.stopPropagation();
    setNotes((prev) => {
      const next = prev.map((x) => x.id === n.id ? { ...x, isPinned: !x.isPinned } : x);
      saveNotes(next);
      return next;
    });
  }

  function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotes(next);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  if (!mounted) return null;

  return (
    <div className="flex h-full">

      {/* ── Notes list ───────────────────────────────────── */}
      {listOpen && (
        <div className="flex w-72 shrink-0 flex-col border-r border-border bg-bg-elevated">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-fg-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-lg border border-border bg-bg py-1.5 pl-8 pr-2 text-xs outline-none focus:border-accent"
              />
            </div>
            <button onClick={createNote} className="btn btn-accent p-2" title="New note">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {sorted.length === 0 && (
              <p className="p-4 text-xs text-fg-subtle">No notes yet. Create one →</p>
            )}
            {sorted.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={cn(
                  "group flex w-full cursor-pointer items-start gap-2 border-b border-border-soft px-3 py-2.5 transition-colors",
                  activeId === n.id ? "bg-accent-soft" : "hover:bg-bg-card",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {n.isPinned && <Pin size={11} className="shrink-0 text-accent" />}
                    <span className="truncate text-sm font-medium">{n.title || "Untitled"}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg-subtle">
                    {plainPreview(n.content).slice(0, 60) || "Empty note"}
                  </p>
                </div>
                <button
                  onClick={(e) => togglePin(e, n)}
                  title={n.isPinned ? "Unpin" : "Pin"}
                  className="mt-0.5 shrink-0 text-fg-subtle opacity-0 transition hover:text-accent group-hover:opacity-100">
                  <Pin size={13} />
                </button>
                <button
                  onClick={(e) => remove(e, n.id)}
                  title="Delete"
                  className="mt-0.5 shrink-0 text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Editor ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <button
                onClick={() => setListOpen(!listOpen)}
                className="btn btn-ghost p-1.5"
                title="Toggle list">
                {listOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              </button>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleSave(e.target.value, content);
                }}
                placeholder="Untitled"
                className="flex-1 bg-transparent text-base font-semibold outline-none"
              />
            </div>

            <div className="min-h-0 flex-1">
              <RichEditor
                key={active.id}
                noteId={active.id}
                content={content}
                onChange={(html) => {
                  setContent(html);
                  scheduleSave(title, html);
                }}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-1.5 text-xs text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <FileText size={12} /> {plainPreview(content).length} chars
              </span>
              <span className="flex items-center gap-1.5">
                {status === "saving" ? (
                  <span className="text-fg-subtle">Saving…</span>
                ) : status === "saved" ? (
                  <><Check size={12} className="text-success" /> Saved</>
                ) : (
                  "Autosave on"
                )}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-fg-subtle">
            <p>Select or create a note to begin.</p>
            <button onClick={createNote} className="btn btn-accent px-4 py-2 text-sm">
              <Plus size={15} /> New note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
