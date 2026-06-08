"use client";

import { useEffect, useState, useId } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  Plus, Loader2, X, Calendar, Tag, User, Clock,
  AlertCircle, BarChart2, Flag,
} from "lucide-react";
import type { KanbanCard } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

/* ─── Constants ─────────────────────────────────────────── */
const COLUMNS = [
  { id: "Backlog", label: "Backlog", color: "#6b7280" },
  { id: "Todo", label: "Todo", color: "#6366f1" },
  { id: "InProgress", label: "In Progress", color: "#f59e0b" },
  { id: "Review", label: "Review", color: "#8b5cf6" },
  { id: "Done", label: "Done", color: "#10b981" },
];

const TASK_TYPES = ["Feature", "Bug", "Research", "Documentation", "Refactor", "Meeting", "Learning", "Personal"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const PRIORITY_COLOR: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#6366f1",
  Low: "#6b7280",
};
const PRIORITY_BG: Record<string, string> = {
  Critical: "rgba(239,68,68,0.12)",
  High: "rgba(249,115,22,0.12)",
  Medium: "rgba(99,102,241,0.12)",
  Low: "rgba(107,114,128,0.12)",
};

/* ─── Local task extension (fields beyond what the backend stores) */
interface TaskMeta {
  taskType: string;
  estimatedHours: string;
  actualHours: string;
  assignee: string;
  referenceLinks: string;
  notes: string;
}

/* ─── localStorage helpers ───────────────────────────────── */

const CARDS_KEY = "qdt-kanban-cards";
const META_KEY  = "qdt-kanban-meta";

function loadCards(): KanbanCard[] {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || "[]"); }
  catch { return []; }
}
function saveCards(cards: KanbanCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

let metaStore: Record<string, TaskMeta> = {};
function loadMeta(): Record<string, TaskMeta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); }
  catch { return {}; }
}
function saveMeta(store: Record<string, TaskMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(store));
}

function getMeta(id: string): TaskMeta {
  return metaStore[id] ?? {
    taskType: "Feature", estimatedHours: "", actualHours: "",
    assignee: "", referenceLinks: "", notes: "",
  };
}

function mkCard(data: Partial<KanbanCard>): KanbanCard {
  const now = new Date().toISOString();
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    title: data.title ?? "Untitled",
    description: data.description ?? "",
    column: data.column ?? "Backlog",
    order: data.order ?? Date.now(),
    priority: data.priority ?? "Medium",
    labels: data.labels ?? "",
    dueDate: data.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

/* ─── Task Modal ─────────────────────────────────────────── */
function TaskModal({
  initial,
  column,
  onSave,
  onClose,
}: {
  initial?: KanbanCard;
  column: string;
  onSave: (data: Partial<KanbanCard>, meta: TaskMeta) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const meta = initial ? getMeta(initial.id) : {
    taskType: "Feature", estimatedHours: "", actualHours: "",
    assignee: "", referenceLinks: "", notes: "",
  };

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    column: initial?.column ?? column,
    priority: initial?.priority ?? "Medium",
    labels: initial?.labels ?? "",
    dueDate: initial?.dueDate ?? "",
  });
  const [localMeta, setLocalMeta] = useState<TaskMeta>(meta);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function updateMeta<K extends keyof TaskMeta>(k: K, v: TaskMeta[K]) {
    setLocalMeta((m) => ({ ...m, [k]: v }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form, localMeta);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{initial ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted" htmlFor={`${uid}-title`}>
              Title <span className="text-danger">*</span>
            </label>
            <input
              id={`${uid}-title`}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add more context..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* Row: Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Task Type</label>
              <select
                value={localMeta.taskType}
                onChange={(e) => updateMeta("taskType", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent">
                {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent">
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Status + Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Column / Status</label>
              <select
                value={form.column}
                onChange={(e) => update("column", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent">
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                <User size={11} className="inline mr-1" />Assignee
              </label>
              <input
                value={localMeta.assignee}
                onChange={(e) => updateMeta("assignee", e.target.value)}
                placeholder="@username"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Row: Due date + Estimated hours + Actual hours */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                <Calendar size={11} className="inline mr-1" />Due Date
              </label>
              <input
                type="date"
                value={form.dueDate ? String(form.dueDate).split("T")[0] : ""}
                onChange={(e) => update("dueDate", e.target.value || null as unknown as string)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                <Clock size={11} className="inline mr-1" />Est. Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={localMeta.estimatedHours}
                onChange={(e) => updateMeta("estimatedHours", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">Actual Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={localMeta.actualHours}
                onChange={(e) => updateMeta("actualHours", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">
              <Tag size={11} className="inline mr-1" />Tags (comma-separated)
            </label>
            <input
              value={form.labels}
              onChange={(e) => update("labels", e.target.value)}
              placeholder="backend, urgent, v2"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* Reference links */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Reference Links</label>
            <input
              value={localMeta.referenceLinks}
              onChange={(e) => updateMeta("referenceLinks", e.target.value)}
              placeholder="https://github.com/... or Jira ticket"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-fg-muted">Additional Notes</label>
            <textarea
              value={localMeta.notes}
              onChange={(e) => updateMeta("notes", e.target.value)}
              placeholder="Acceptance criteria, edge cases, links..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || saving}
            className="btn btn-accent px-5 py-2 text-sm disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : (initial ? "Save changes" : "Create task")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card view ──────────────────────────────────────────── */
function CardView({
  card,
  overlay = false,
  onClick,
}: {
  card: KanbanCard;
  overlay?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  const meta = getMeta(card.id);
  const pColor = PRIORITY_COLOR[card.priority] ?? "#6b7280";
  const pBg = PRIORITY_BG[card.priority] ?? "rgba(107,114,128,0.1)";

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onClick}
      className={cn(
        "group card cursor-pointer p-3 transition-shadow hover:shadow-md active:cursor-grabbing border-l-[3px]",
        isDragging && !overlay && "opacity-30",
        overlay && "shadow-2xl ring-2 ring-accent/30"
      )}
      style={{ borderLeftColor: pColor }}
    >
      {/* Type + Priority badges */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle bg-bg-elevated">
          {meta.taskType}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: pBg, color: pColor }}>
          <Flag size={9} className="inline mr-0.5" />
          {card.priority}
        </span>
      </div>

      <p className="text-sm font-medium leading-snug">{card.title}</p>
      {card.description && (
        <p className="mt-1 text-[11px] leading-relaxed text-fg-subtle line-clamp-2">{card.description}</p>
      )}

      {/* Meta row */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {card.dueDate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-fg-subtle">
            <Calendar size={10} />
            {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {meta.estimatedHours && (
          <span className="inline-flex items-center gap-1 text-[10px] text-fg-subtle">
            <Clock size={10} /> {meta.estimatedHours}h
          </span>
        )}
        {meta.assignee && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-accent">
            {meta.assignee.replace("@", "").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Tags */}
      {card.labels && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.split(",").filter(Boolean).map((l) => (
            <span key={l} className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
              {l.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Column ─────────────────────────────────────────────── */
function Column({
  id, label, color, cards, onAdd, onDelete, onEdit,
}: {
  id: string;
  label: string;
  color: string;
  cards: KanbanCard[];
  onAdd: (col: string) => void;
  onDelete: (id: string) => void;
  onEdit: (card: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-[13px] font-semibold">{label}</span>
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(id)}
          className="btn btn-ghost p-1 text-fg-subtle hover:text-fg"
          title="Add task">
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors",
          isOver
            ? "border-accent bg-accent-soft"
            : "border-border-soft bg-bg-elevated/30"
        )}
      >
        {cards.map((c) => (
          <div key={c.id} className="group relative">
            <CardView card={c} onClick={() => onEdit(c)} />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="absolute right-1.5 top-1.5 rounded p-0.5 text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100">
              <X size={12} />
            </button>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-xs text-fg-subtle">
            <Plus size={20} className="mb-1 opacity-30" />
            <button onClick={() => onAdd(id)} className="hover:text-fg">Add task</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Insights panel ─────────────────────────────────────── */
function InsightsPanel({ cards, onClose }: { cards: KanbanCard[]; onClose: () => void }) {
  const total = cards.length;
  const done = cards.filter((c) => c.column === "Done").length;
  const inProgress = cards.filter((c) => c.column === "InProgress").length;
  const backlog = cards.filter((c) => c.column === "Backlog").length;
  const rate = total ? Math.round((done / total) * 100) : 0;

  const byPriority = PRIORITIES.map((p) => ({
    label: p,
    count: cards.filter((c) => c.priority === p).length,
    color: PRIORITY_COLOR[p],
  }));

  const byColumn = COLUMNS.map((col) => ({
    label: col.label,
    count: cards.filter((c) => c.column === col.id).length,
    color: col.color,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BarChart2 size={17} className="text-accent" /> Kanban Insights
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Tasks", value: total, color: "#6366f1" },
              { label: "Done", value: done, color: "#10b981" },
              { label: "In Progress", value: inProgress, color: "#f59e0b" },
              { label: "Completion", value: `${rate}%`, color: rate >= 70 ? "#10b981" : "#f59e0b" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-bg p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
                <div className="mt-1 text-[11px] text-fg-subtle">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
              <span>Completion rate</span>
              <span className="font-semibold text-fg">{rate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-success transition-all duration-700"
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>

          {/* By status */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">By Status</h3>
            <div className="space-y-2">
              {byColumn.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="w-24 truncate text-[12px] text-fg-muted">{c.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: total ? `${(c.count / total) * 100}%` : "0%", background: c.color }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-medium text-fg">{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By priority */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">By Priority</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {byPriority.map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg p-3 text-center"
                  style={{ background: `${p.color}12` }}>
                  <div className="text-xl font-bold" style={{ color: p.color }}>{p.count}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: p.color }}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Backlog warning */}
          {backlog > 5 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-sm text-fg-muted">
                <span className="font-semibold text-fg">{backlog} tasks</span> are sitting in Backlog.
                Consider triaging and moving high-priority items to Today or In Progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function KanbanPage() {
  const [cards, setCards]           = useState<KanbanCard[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [modal, setModal]           = useState<{ column: string; card?: KanbanCard } | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [mounted, setMounted]       = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* Load from localStorage on mount */
  useEffect(() => {
    const stored = loadCards();
    setCards(stored);
    metaStore = loadMeta();
    setMounted(true);
  }, []);

  function updateCards(next: KanbanCard[]) {
    setCards(next);
    saveCards(next);
  }

  function handleSave(data: Partial<KanbanCard>, localMeta: TaskMeta) {
    const isEdit = !!modal?.card;
    if (isEdit && modal?.card) {
      const now = new Date().toISOString();
      const updated: KanbanCard = { ...modal.card, ...data, updatedAt: now };
      metaStore[updated.id] = localMeta;
      saveMeta(metaStore);
      updateCards(cards.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const created = mkCard({
        ...data,
        column: data.column ?? modal?.column ?? "Backlog",
        order: Date.now(),
      });
      metaStore[created.id] = localMeta;
      saveMeta(metaStore);
      updateCards([...cards, created]);
    }
    setModal(null);
  }

  function deleteCard(id: string) {
    updateCards(cards.filter((c) => c.id !== id));
  }

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const card = cards.find((c) => c.id === active.id);
    const targetCol = String(over.id);
    if (!card || card.column === targetCol) return;
    updateCards(cards.map((c) =>
      c.id === card.id ? { ...c, column: targetCol, order: Date.now() } : c
    ));
  }

  const activeCard = cards.find((c) => c.id === activeId) ?? null;

  if (!mounted) return null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Kanban"
        subtitle="Track tasks across your development workflow"
        actions={
          <button
            onClick={() => setShowInsights(true)}
            className="btn btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <BarChart2 size={14} /> Insights
          </button>
        }
      />

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              cards={cards.filter((c) => c.column === col.id).sort((a, b) => a.order - b.order)}
              onAdd={(colId) => setModal({ column: colId })}
              onDelete={deleteCard}
              onEdit={(card) => setModal({ column: card.column, card })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CardView card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {modal && (
        <TaskModal
          column={modal.column}
          initial={modal.card}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {showInsights && (
        <InsightsPanel cards={cards} onClose={() => setShowInsights(false)} />
      )}
    </div>
  );
}
