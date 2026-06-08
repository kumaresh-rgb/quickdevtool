"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/* ─── Types ─────────────────────────────────────────────────── */

interface Section {
  id: string;
  label: string;
  collapsed: boolean;
  items: string[]; // nav hrefs
}

interface NavState {
  /** Root-level IDs: mix of ungrouped hrefs + section IDs, ordered. */
  root: string[];
  sections: Section[];
}

/* ─── Storage ────────────────────────────────────────────────── */

const STORAGE_KEY = "qdt-sidebar-v3";

function buildDefault(): NavState {
  return { root: NAV_ITEMS.map((i) => i.href), sections: [] };
}

function hydrate(): NavState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefault();

    const saved = JSON.parse(raw) as NavState;
    const validHrefs = new Set(NAV_ITEMS.map((i) => i.href));

    const cleanRoot = saved.root.filter(
      (id) => id.startsWith("sec-") || validHrefs.has(id),
    );
    const cleanSections: Section[] = (saved.sections ?? []).map((s) => ({
      ...s,
      items: s.items.filter((h) => validHrefs.has(h)),
    }));

    const placed = new Set([
      ...cleanRoot,
      ...cleanSections.flatMap((s) => s.items),
    ]);
    const newItems = NAV_ITEMS.filter((i) => !placed.has(i.href)).map(
      (i) => i.href,
    );

    return { root: [...cleanRoot, ...newItems], sections: cleanSections };
  } catch {
    return buildDefault();
  }
}

function persist(s: NavState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function mkSecId() {
  return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

/* ─── Nav item lookup ────────────────────────────────────────── */

const NAV_MAP = Object.fromEntries(NAV_ITEMS.map((i) => [i.href, i]));

/* ─── DnD helpers ────────────────────────────────────────────── */

function containerOf(id: string, s: NavState): string {
  if (s.root.includes(id)) return "root";
  for (const sec of s.sections) {
    if (sec.items.includes(id)) return sec.id;
  }
  return "root";
}

/* ─── Sortable nav item ──────────────────────────────────────── */

function SortableNavItem({
  href,
  inSection,
}: {
  href: string;
  inSection?: boolean;
}) {
  const pathname = usePathname();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: href });

  const item = NAV_MAP[href];
  if (!item) return null;

  const Icon = item.icon;
  const active = pathname.startsWith(href);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative flex items-center",
        isDragging && "pointer-events-none opacity-30",
      )}
    >
      <Link
        href={href}
        className={cn(
          "flex flex-1 items-center gap-2.5 rounded-md py-[7px] pr-6 text-[13px] transition-colors",
          inSection ? "pl-2" : "pl-2.5",
          active
            ? "bg-accent-soft font-medium text-accent"
            : "text-fg-muted hover:bg-bg-card hover:text-fg",
        )}
      >
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>

      <span
        {...attributes}
        {...listeners}
        className="absolute right-0.5 z-10 flex h-6 w-5 cursor-grab touch-none select-none items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-40 hover:opacity-90 active:cursor-grabbing"
        onMouseDown={(e) => e.preventDefault()}
      >
        <GripVertical size={12} className="text-fg-subtle" />
      </span>
    </div>
  );
}

/* ─── Drag overlay cards ─────────────────────────────────────── */

function ItemOverlay({ href }: { href: string }) {
  const item = NAV_MAP[href];
  if (!item) return null;
  const Icon = item.icon;
  return (
    <div className="flex w-48 items-center gap-2.5 rounded-lg border border-accent/25 bg-bg-card px-2.5 py-[7px] shadow-2xl ring-1 ring-accent/10">
      <Icon size={15} className="shrink-0 text-accent" />
      <span className="truncate text-[13px] font-medium text-fg">
        {item.label}
      </span>
      <GripVertical size={12} className="ml-auto shrink-0 text-fg-subtle/50" />
    </div>
  );
}

function SectionOverlay({ label }: { label: string }) {
  return (
    <div className="flex w-48 items-center gap-2 rounded-lg border border-accent/25 bg-bg-card px-2 py-1.5 shadow-2xl ring-1 ring-accent/10">
      <Folder size={12} className="shrink-0 text-accent" />
      <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
        {label}
      </span>
    </div>
  );
}

/* ─── Section body (droppable zone) ─────────────────────────── */

function SectionBody({ section }: { section: Section }) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-${section.id}` });

  if (section.collapsed) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "ml-3.5 mt-0.5 flex min-h-[4px] flex-col gap-0.5 border-l pb-1 pl-1.5 transition-colors duration-100",
        isOver ? "border-accent/60" : "border-border-soft",
      )}
    >
      <SortableContext
        items={section.items}
        strategy={verticalListSortingStrategy}
      >
        {section.items.map((href) => (
          <SortableNavItem key={href} href={href} inSection />
        ))}
      </SortableContext>

      {section.items.length === 0 && (
        <p
          className={cn(
            "rounded px-2 py-2 text-center text-[11px] transition-colors duration-100",
            isOver ? "bg-accent-soft text-accent" : "text-fg-subtle/50",
          )}
        >
          {isOver ? "Release to add" : "Drag items here"}
        </p>
      )}
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────── */

function SortableSection({
  section,
  onToggle,
  onRename,
  onDelete,
}: {
  section: Section;
  onToggle: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(section.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setEditVal(section.label);
  }, [section.label, editing]);

  function commit() {
    const v = editVal.trim() || section.label;
    onRename(section.id, v);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("mt-1 select-none", isDragging && "opacity-30")}
    >
      {/* Header row */}
      <div className="group flex items-center gap-0.5 rounded-md py-[3px] pl-0.5 pr-0.5 hover:bg-bg-card">
        {/* Collapse toggle */}
        <button
          onClick={() => onToggle(section.id)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-subtle/60 hover:text-fg"
        >
          {section.collapsed ? (
            <ChevronRight size={11} />
          ) : (
            <ChevronDown size={11} />
          )}
        </button>

        {/* Folder icon */}
        {section.collapsed ? (
          <Folder size={11} className="mr-0.5 shrink-0 text-fg-subtle/60" />
        ) : (
          <FolderOpen size={11} className="mr-0.5 shrink-0 text-fg-subtle/60" />
        )}

        {/* Label / rename input */}
        {editing ? (
          <input
            ref={inputRef}
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setEditVal(section.label);
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded bg-bg px-1 py-px text-[11px] text-fg outline-none ring-1 ring-accent"
          />
        ) : (
          <span
            className="flex-1 cursor-default truncate text-[10px] font-semibold uppercase tracking-widest text-fg-subtle/60"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {section.label}
          </span>
        )}

        {/* Hover action buttons */}
        {!editing && (
          <div className="ml-auto flex shrink-0 items-center gap-px opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-bg-elevated"
              title="Rename"
            >
              <Pencil size={10} className="text-fg-subtle/60" />
            </button>
            <button
              onClick={() => onDelete(section.id)}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-bg-elevated hover:text-danger"
              title="Delete section (items return to root)"
            >
              <Trash2 size={10} className="text-fg-subtle/60" />
            </button>
            <span
              {...attributes}
              {...listeners}
              className="flex h-5 w-5 cursor-grab items-center justify-center rounded hover:bg-bg-elevated active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical size={11} className="text-fg-subtle/60" />
            </span>
          </div>
        )}
      </div>

      <SectionBody section={section} />
    </div>
  );
}

/* ─── Main SidebarNav export ─────────────────────────────────── */

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<NavState>(buildDefault);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const stateRef = useRef<NavState>(state);

  const update = useCallback((fn: (prev: NavState) => NavState) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const loaded = hydrate();
    setState(loaded);
    stateRef.current = loaded;
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ── Section actions ──────────────────────────────────────── */

  const addSection = useCallback(() => {
    const id = mkSecId();
    update((prev) => ({
      root: [...prev.root, id],
      sections: [
        ...prev.sections,
        { id, label: "New Section", collapsed: false, items: [] },
      ],
    }));
  }, [update]);

  const toggleSection = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === id ? { ...s, collapsed: !s.collapsed } : s,
        ),
      }));
    },
    [update],
  );

  const renameSection = useCallback(
    (id: string, label: string) => {
      update((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === id ? { ...s, label } : s,
        ),
      }));
    },
    [update],
  );

  const deleteSection = useCallback(
    (id: string) => {
      update((prev) => {
        const sec = prev.sections.find((s) => s.id === id);
        return {
          root: [
            ...prev.root.filter((r) => r !== id),
            ...(sec?.items ?? []),
          ],
          sections: prev.sections.filter((s) => s.id !== id),
        };
      });
    },
    [update],
  );

  /* ── DnD handlers ─────────────────────────────────────────── */

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return;

      const aid = active.id as string;
      const oid = over.id as string;
      const cur = stateRef.current;

      // Sections only sort at root level — never enter other sections
      if (aid.startsWith("sec-")) return;

      const fromContainer = containerOf(aid, cur);

      // Resolve target container from the over-element ID
      let toContainer: string;
      if (oid.startsWith("drop-")) {
        toContainer = oid.slice(5); // "drop-{sectionId}" → sectionId
      } else if (oid.startsWith("sec-")) {
        toContainer = oid; // hovering over a section header
      } else {
        toContainer = containerOf(oid, cur);
      }

      if (fromContainer === toContainer) return;

      // Cross-container: move item optimistically
      update((prev) => {
        let newRoot = [...prev.root];
        let newSections = prev.sections.map((s) => ({
          ...s,
          items: [...s.items],
        }));

        // Remove from source
        if (fromContainer === "root") {
          newRoot = newRoot.filter((id) => id !== aid);
        } else {
          newSections = newSections.map((s) =>
            s.id === fromContainer
              ? { ...s, items: s.items.filter((i) => i !== aid) }
              : s,
          );
        }

        // Insert into target
        if (toContainer === "root") {
          const idx = newRoot.indexOf(oid);
          idx >= 0 ? newRoot.splice(idx, 0, aid) : newRoot.push(aid);
        } else {
          const sec = newSections.find((s) => s.id === toContainer);
          if (sec) {
            const idx = sec.items.indexOf(oid);
            idx >= 0 ? sec.items.splice(idx, 0, aid) : sec.items.push(aid);
          }
        }

        // Auto-expand a collapsed target section
        if (toContainer !== "root") {
          newSections = newSections.map((s) =>
            s.id === toContainer ? { ...s, collapsed: false } : s,
          );
        }

        return { root: newRoot, sections: newSections };
      });
    },
    [update],
  );

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const aid = active.id as string;
      const oid = over.id as string;

      // Drop-zone IDs mean cross-container was already handled in onDragOver
      if (oid.startsWith("drop-")) return;

      const cur = stateRef.current;
      const fromContainer = containerOf(aid, cur);
      const toContainer = containerOf(oid, cur);

      // Cross-container already settled in onDragOver; only do same-container sort
      if (fromContainer !== toContainer) return;

      update((prev) => {
        if (fromContainer === "root") {
          const fi = prev.root.indexOf(aid);
          const ti = prev.root.indexOf(oid);
          if (fi < 0 || ti < 0) return prev;
          return { ...prev, root: arrayMove(prev.root, fi, ti) };
        }

        return {
          ...prev,
          sections: prev.sections.map((s) => {
            if (s.id !== fromContainer) return s;
            const fi = s.items.indexOf(aid);
            const ti = s.items.indexOf(oid);
            if (fi < 0 || ti < 0) return s;
            return { ...s, items: arrayMove(s.items, fi, ti) };
          }),
        };
      });
    },
    [update],
  );

  /* ── Collapsed / SSR render ───────────────────────────────── */

  const orderedItems = useMemo(() => {
    const result: string[] = [];
    for (const id of state.root) {
      if (id.startsWith("sec-")) {
        const sec = state.sections.find((s) => s.id === id);
        if (sec) result.push(...sec.items);
      } else {
        result.push(id);
      }
    }
    return result;
  }, [state]);

  if (collapsed || !mounted) {
    return (
      <nav className="flex flex-1 flex-col items-center gap-0.5">
        {(mounted ? orderedItems : NAV_ITEMS.map((i) => i.href)).map(
          (href) => {
            const item = NAV_MAP[href];
            if (!item) return null;
            const Icon = item.icon;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                title={item.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-fg-muted hover:bg-bg-card hover:text-fg",
                )}
              >
                <Icon size={16} className="shrink-0" />
              </Link>
            );
          },
        )}
      </nav>
    );
  }

  /* ── Full expanded render ─────────────────────────────────── */

  const renderList = state.root
    .map((id) => {
      if (id.startsWith("sec-")) {
        const sec = state.sections.find((s) => s.id === id);
        if (!sec) return null;
        return { kind: "section" as const, id, section: sec };
      }
      if (!NAV_MAP[id]) return null;
      return { kind: "item" as const, id, href: id };
    })
    .filter(
      (x): x is
        | { kind: "item"; id: string; href: string }
        | { kind: "section"; id: string; section: Section } => x !== null,
    );

  const activeIsItem = activeId != null && !activeId.startsWith("sec-");
  const activeSection = activeId?.startsWith("sec-")
    ? state.sections.find((s) => s.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pb-1">
        <SortableContext
          items={state.root}
          strategy={verticalListSortingStrategy}
        >
          {renderList.map((entry) =>
            entry.kind === "item" ? (
              <SortableNavItem key={entry.id} href={entry.href} />
            ) : (
              <SortableSection
                key={entry.id}
                section={entry.section}
                onToggle={toggleSection}
                onRename={renameSection}
                onDelete={deleteSection}
              />
            ),
          )}
        </SortableContext>
      </nav>

      {/* New section button */}
      <button
        onClick={addSection}
        className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-fg-subtle/60 transition-colors hover:bg-bg-card hover:text-fg-subtle"
      >
        <FolderPlus size={13} />
        <span>New section</span>
      </button>

      {/* Drag overlay */}
      <DragOverlay
        dropAnimation={{ duration: 120, easing: "ease-out" }}
      >
        {activeIsItem && activeId && <ItemOverlay href={activeId} />}
        {activeSection && <SectionOverlay label={activeSection.label} />}
      </DragOverlay>
    </DndContext>
  );
}
