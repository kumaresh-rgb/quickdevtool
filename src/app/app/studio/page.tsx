"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play, Wand2, Star, History, Plus, Loader2, Database, AlertCircle,
  FolderTree, Gauge, ChevronRight, ChevronDown, Server,
} from "lucide-react";
import { api, type DaxProfile, type DaxFavorite, type ExecuteResult } from "@/lib/api";
import { DaxEditor } from "@/components/DaxEditor";
import { ResultGrid } from "@/components/studio/ResultGrid";
import { ProfileDialog } from "@/components/studio/ProfileDialog";
import { formatDax } from "@/lib/dax-format";
import { analyzeDax } from "@/lib/dax-analyze";
import { log } from "@/lib/logger";
import { cn } from "@/lib/cn";

interface HistoryItem {
  id: string; query: string; profileName: string | null;
  durationMs: number; rowCount: number; status: string; createdAt: string;
}

const STARTER = `EVALUATE
SUMMARIZECOLUMNS(
    'Product'[Category],
    "Total Sales", [Total Sales],
    "Orders", [Order Count]
)
ORDER BY [Total Sales] DESC`;

function Section({ icon: Icon, title, count, children, defaultOpen = true }: {
  icon: typeof Star; title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-semibold text-fg-muted hover:text-fg">
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Icon size={13} /> {title}
        {count !== undefined && <span className="ml-auto rounded bg-bg px-1.5 text-[10px] text-fg-subtle">{count}</span>}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

export default function StudioPage() {
  const [profiles, setProfiles] = useState<DaxProfile[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [favorites, setFavorites] = useState<DaxFavorite[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState(STARTER);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSidebar = useCallback(async () => {
    const [favs, hist] = await Promise.all([
      api.get<DaxFavorite[]>("/api/dax/favorites"),
      api.get<HistoryItem[]>("/api/dax/history"),
    ]);
    setFavorites(favs);
    setHistory(hist);
  }, []);

  useEffect(() => {
    api.get<DaxProfile[]>("/api/dax/profiles")
      .then((p) => {
        setProfiles(p);
        const def = p.find((x) => x.isDefault) ?? p[0];
        if (def) setProfileId(def.id);
      })
      .catch((e) => setError((e as Error).message));
    refreshSidebar().catch((e) => setError((e as Error).message));
  }, [refreshSidebar]);

  async function run() {
    setRunning(true);
    setError(null);
    const profile = profiles.find((p) => p.id === profileId);
    try {
      const res = await api.post<ExecuteResult>("/api/dax/execute", {
        query,
        profileName: profile?.name ?? null,
        workspaceId: profile?.workspaceId ?? null,
        datasetId: profile?.datasetId ?? null,
      });
      setResult(res);
      if (!res.success) setError(res.error);
      log.action("DaxStudio", "execute", { rows: res.rowCount, ms: res.durationMs });
      refreshSidebar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function saveFavorite() {
    const name = prompt("Favorite name?");
    if (!name) return;
    await api.post("/api/dax/favorites", { name, query, folder: "Saved", tags: "" });
    refreshSidebar();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Execution insights: split simulated duration into SE/FE and surface advice.
  const insights = result
    ? {
        seMs: Math.round(result.durationMs * 0.7),
        feMs: Math.round(result.durationMs * 0.3),
        rows: result.rowCount,
        recommendations: analyzeDax(query).cost.bottlenecks,
        warnings: analyzeDax(query).warnings,
      }
    : null;

  const explorer = (
    <div className="flex h-full flex-col overflow-auto bg-bg-elevated">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-semibold">
        <FolderTree size={14} className="text-accent" /> Workspace Explorer
      </div>
      <Section icon={Server} title="Connections" count={profiles.length}>
        {profiles.length === 0 && <p className="px-3 text-xs text-fg-subtle">No profiles yet.</p>}
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfileId(p.id)}
            className={cn("block w-full truncate px-5 py-1.5 text-left text-xs", profileId === p.id ? "text-accent" : "text-fg-muted hover:text-fg")}
          >
            {p.name} · <span className="text-fg-subtle">{p.environment}</span>
          </button>
        ))}
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-1 px-5 py-1.5 text-xs text-accent hover:underline">
          <Plus size={12} /> Add connection
        </button>
      </Section>
      <Section icon={Star} title="Saved Queries" count={favorites.length}>
        {favorites.length === 0 && <p className="px-3 text-xs text-fg-subtle">No favorites.</p>}
        {favorites.map((f) => (
          <button key={f.id} onClick={() => setQuery(f.query)} title={f.query}
            className="block w-full truncate px-5 py-1.5 text-left text-xs text-fg-muted hover:text-fg">
            {f.name}
          </button>
        ))}
      </Section>
      <Section icon={History} title="Recent" count={history.length} defaultOpen={false}>
        {history.length === 0 && <p className="px-3 text-xs text-fg-subtle">No history.</p>}
        {history.slice(0, 20).map((h) => (
          <button key={h.id} onClick={() => setQuery(h.query)}
            className="block w-full truncate px-5 py-1.5 text-left text-xs text-fg-muted hover:text-fg">
            <span className={h.status === "Success" ? "text-success" : "text-danger"}>•</span>{" "}
            {h.query.split("\n")[0]}
          </button>
        ))}
      </Section>
    </div>
  );

  const insightsPanel = (
    <div className="flex h-full flex-col overflow-auto border-border bg-bg-elevated">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-semibold">
        <Gauge size={14} className="text-accent" /> Execution Insights
      </div>
      {insights ? (
        <div className="space-y-3 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-bg p-2"><div className="text-[10px] text-fg-subtle">Duration</div><div className="text-sm font-semibold">{result!.durationMs} ms</div></div>
            <div className="rounded-lg border border-border bg-bg p-2"><div className="text-[10px] text-fg-subtle">Rows</div><div className="text-sm font-semibold">{insights.rows}</div></div>
            <div className="rounded-lg border border-border bg-bg p-2"><div className="text-[10px] text-fg-subtle">SE time</div><div className="text-sm font-semibold text-accent">{insights.seMs} ms</div></div>
            <div className="rounded-lg border border-border bg-bg p-2"><div className="text-[10px] text-fg-subtle">FE time</div><div className="text-sm font-semibold text-warning">{insights.feMs} ms</div></div>
          </div>
          {insights.warnings.length > 0 && (
            <div>
              <div className="mb-1 font-semibold text-warning">Warnings</div>
              <ul className="list-disc space-y-1 pl-4 text-fg-muted">{insights.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          <div>
            <div className="mb-1 font-semibold text-fg">Recommendations</div>
            {insights.recommendations.length ? (
              <ul className="list-disc space-y-1 pl-4 text-fg-muted">{insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            ) : <p className="text-fg-subtle">No obvious bottlenecks detected. 🎉</p>}
          </div>
        </div>
      ) : (
        <p className="p-3 text-xs text-fg-subtle">Run a query to see execution insights.</p>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Database size={16} className="text-accent" />
        <span className="text-sm font-semibold">DAX Studio</span>
        <select value={profileId} onChange={(e) => setProfileId(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none focus:border-accent">
          {profiles.length === 0 && <option value="">No profiles</option>}
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.environment}</option>)}
        </select>
        <button onClick={() => setShowProfile(true)} className="btn btn-ghost px-2.5 py-1.5 text-xs"><Plus size={13} /> Profile</button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setQuery(formatDax(query))} className="btn btn-ghost px-3 py-1.5 text-xs"><Wand2 size={14} /> Format</button>
          <button onClick={saveFavorite} className="btn btn-ghost px-3 py-1.5 text-xs"><Star size={14} /> Save</button>
          <button onClick={run} disabled={running} className="btn btn-accent px-4 py-1.5 text-xs disabled:opacity-60">
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run <span className="opacity-60">⌘↵</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-border bg-danger/10 px-4 py-2 text-xs text-danger">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Desktop 4-panel */}
      <div
        className="hidden min-h-0 flex-1 lg:grid"
        style={{
          gridTemplateColumns: "230px minmax(0,1fr) 300px",
          gridTemplateRows: "minmax(0,1fr) minmax(0,42%)",
          gridTemplateAreas: `"explorer editor insights" "explorer results results"`,
        }}
      >
        <div style={{ gridArea: "explorer" }} className="border-r border-border">{explorer}</div>
        <div style={{ gridArea: "editor" }} className="min-h-0"><DaxEditor value={query} onChange={setQuery} /></div>
        <div style={{ gridArea: "insights" }} className="border-l border-border">{insightsPanel}</div>
        <div style={{ gridArea: "results" }} className="min-h-0 border-t border-border">
          {result ? <ResultGrid result={result} /> : <div className="flex h-full items-center justify-center text-sm text-fg-subtle">Run a query (⌘↵) to see results.</div>}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="h-56 shrink-0 border-b border-border"><DaxEditor value={query} onChange={setQuery} /></div>
        <div className="h-64 shrink-0 border-b border-border">
          {result ? <ResultGrid result={result} /> : <div className="flex h-full items-center justify-center text-sm text-fg-subtle">Run a query to see results.</div>}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{insightsPanel}</div>
      </div>

      {showProfile && (
        <ProfileDialog onClose={() => setShowProfile(false)} onSaved={(p) => { setProfiles((prev) => [...prev, p]); setProfileId(p.id); }} />
      )}
    </div>
  );
}
