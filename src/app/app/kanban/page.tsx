"use client";

import { useEffect, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Loader2, X } from "lucide-react";
import { api, type KanbanCard } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

const COLUMNS = [
  { id: "Backlog", label: "Backlog" },
  { id: "Today", label: "Today" },
  { id: "InProgress", label: "In Progress" },
  { id: "Testing", label: "Testing" },
  { id: "Done", label: "Done" },
];

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: "var(--danger)",
  High: "var(--warning)",
  Medium: "var(--accent)",
  Low: "var(--fg-subtle)",
};

function CardView({ card, overlay = false }: { card: KanbanCard; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        "card cursor-grab p-3 active:cursor-grabbing",
        isDragging && !overlay && "opacity-30",
        overlay && "shadow-2xl"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{card.title}</p>
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: PRIORITY_COLOR[card.priority] ?? "var(--fg-subtle)" }}
          title={card.priority}
        />
      </div>
      {card.description && <p className="mt-1 text-xs text-fg-subtle">{card.description}</p>}
      {card.labels && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.split(",").filter(Boolean).map((l) => (
            <span key={l} className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
              {l.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Column({
  id, label, cards, onAdd, onDelete,
}: {
  id: string;
  label: string;
  cards: KanbanCard[];
  onAdd: (col: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-fg-subtle">
            {cards.length}
          </span>
        </div>
        <button onClick={() => onAdd(id)} className="btn btn-ghost p-1" title="Add card">
          <Plus size={14} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-accent bg-accent-soft" : "border-border-soft bg-bg-elevated/40"
        )}
      >
        {cards.map((c) => (
          <div key={c.id} className="group relative">
            <CardView card={c} />
            <button
              onClick={() => onDelete(c.id)}
              className="absolute right-1.5 top-1.5 rounded p-0.5 text-fg-subtle opacity-0 transition hover:text-danger group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {cards.length === 0 && <p className="px-1 py-4 text-center text-xs text-fg-subtle">Drop here</p>}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get<KanbanCard[]>("/api/kanban")
      .then(setCards)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function addCard(col: string) {
    const title = prompt("Card title?");
    if (!title) return;
    const created = await api.post<KanbanCard>("/api/kanban", {
      title, description: "", column: col, order: Date.now(), priority: "Medium", labels: "", dueDate: null,
    });
    setCards((prev) => [...prev, created]);
  }

  async function deleteCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await api.del(`/api/kanban/${id}`);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const card = cards.find((c) => c.id === active.id);
    const targetCol = String(over.id);
    if (!card || card.column === targetCol) return;
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, column: targetCol } : c)));
    await api.patch(`/api/kanban/${card.id}/move`, { column: targetCol, order: Date.now() });
  }

  const activeCard = cards.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Kanban Board" subtitle="Drag cards across columns — saved automatically" />
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-fg-subtle">
          <Loader2 size={16} className="animate-spin" /> Loading board…
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-danger">
          Backend offline: {error}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto p-5">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                cards={cards.filter((c) => c.column === col.id).sort((a, b) => a.order - b.order)}
                onAdd={addCard}
                onDelete={deleteCard}
              />
            ))}
          </div>
          <DragOverlay>{activeCard ? <CardView card={activeCard} overlay /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
