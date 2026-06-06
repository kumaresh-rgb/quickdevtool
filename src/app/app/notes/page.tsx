"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, Search, Pin, Trash2, PanelLeftClose, PanelLeft, Loader2, Check, FileText,
} from "lucide-react";
import { api, type Note } from "@/lib/api";
import { RichEditor } from "@/components/notes/RichEditor";
import { log } from "@/lib/logger";
import { cn } from "@/lib/cn";

function plainPreview(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function QuickNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const load = useCallback(async () => {
    try {
      const data = await api.get<Note[]>(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setNotes(data);
      setError(null);
      setActiveId((cur) => cur ?? data[0]?.id ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync editor fields when the active note changes.
  useEffect(() => {
    if (active) {
      setTitle(active.title);
      setContent(active.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const persist = useCallback(
    async (nextTitle: string, nextContent: string) => {
      if (!active) return;
      setStatus("saving");
      try {
        const updated = await api.put<Note>(`/api/notes/${active.id}`, {
          title: nextTitle,
          content: nextContent,
          tags: active.tags,
          isPinned: active.isPinned,
          isArchived: active.isArchived,
          folder: active.folder,
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    },
    [active]
  );

  // Autosave 2s after the last edit — no save button.
  function scheduleSave(nextTitle: string, nextContent: string) {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextTitle, nextContent), 2000);
  }

  async function createNote() {
    const created = await api.post<Note>("/api/notes", {
      title: "Untitled", content: "", tags: "", isPinned: false, isArchived: false, folder: null,
    });
    setNotes((prev) => [created, ...prev]);
    setActiveId(created.id);
    log.action("QuickNotes", "create-note");
  }

  async function togglePin(e: React.MouseEvent, n: Note) {
    e.stopPropagation();
    const updated = await api.put<Note>(`/api/notes/${n.id}`, { ...n, isPinned: !n.isPinned });
    setNotes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    load();
  }

  async function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await api.del(`/api/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="flex h-full">
      {/* Notes list panel */}
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
            {loading && (
              <div className="flex items-center gap-2 p-4 text-xs text-fg-subtle">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {error && <div className="p-4 text-xs text-danger">Backend offline: {error}</div>}
            {!loading && notes.length === 0 && !error && (
              <p className="p-4 text-xs text-fg-subtle">No notes yet. Create one →</p>
            )}
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={cn(
                  "group flex w-full cursor-pointer items-start gap-2 border-b border-border-soft px-3 py-2.5 transition-colors",
                  activeId === n.id ? "bg-accent-soft" : "hover:bg-bg-card"
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
                <button onClick={(e) => togglePin(e, n)} title="Pin" className="mt-0.5 shrink-0 text-fg-subtle opacity-0 transition hover:text-accent group-hover:opacity-100">
                  <Pin size={13} />
                </button>
                <button onClick={(e) => remove(e, n.id)} title="Delete" className="mt-0.5 shrink-0 text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <button onClick={() => setListOpen(!listOpen)} className="btn btn-ghost p-1.5" title="Toggle list">
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

            {/* Status bar */}
            <div className="flex items-center justify-between border-t border-border px-4 py-1.5 text-xs text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <FileText size={12} /> {plainPreview(content).length} chars
              </span>
              <span className="flex items-center gap-1.5">
                {status === "saving" ? (
                  <><Loader2 size={12} className="animate-spin" /> Saving…</>
                ) : status === "saved" ? (
                  <><Check size={12} className="text-success" /> Autosaved</>
                ) : (
                  "Autosave on"
                )}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-fg-subtle">
            {error ? "Start the backend, then refresh." : "Select or create a note to begin."}
            {!error && (
              <button onClick={createNote} className="btn btn-accent px-4 py-2 text-sm">
                <Plus size={15} /> New note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
