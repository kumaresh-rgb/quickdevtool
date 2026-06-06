"use client";

import { useMemo, useState } from "react";
import {
  Brain, Workflow, BookOpen, Gauge, AlertTriangle, ExternalLink, Sparkles, Code2,
} from "lucide-react";
import { DaxEditor } from "@/components/DaxEditor";
import { MermaidView } from "@/components/MermaidView";
import { analyzeDax } from "@/lib/dax-analyze";
import { TRUSTED_SOURCES, type DaxKeyword } from "@/lib/dax-knowledge";
import { log } from "@/lib/logger";
import { cn } from "@/lib/cn";

const SAMPLE = `EVALUATE
CALCULATETABLE(
    SUMMARIZECOLUMNS(
        'Product'[Category],
        "Total Sales", [Total Sales],
        "Top Products", TOPN(3, VALUES('Product'[Name]), [Total Sales])
    ),
    FILTER('Date', 'Date'[Year] = 2024)
)
ORDER BY [Total Sales] DESC`;

type MobileTab = "editor" | "flow" | "insights";

const COST_COLOR: Record<string, string> = {
  Low: "var(--success)",
  Medium: "var(--warning)",
  High: "var(--danger)",
};

function CostBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className="text-sm font-semibold" style={{ color: COST_COLOR[value] }}>{value}</div>
    </div>
  );
}

function KeywordCard({ k }: { k: DaxKeyword }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-bg-elevated"
      >
        <span className="flex items-center gap-2">
          <Code2 size={14} className="text-accent" />
          <span className="font-mono text-sm font-semibold">{k.name}</span>
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">{k.category}</span>
        </span>
        <span className="text-xs text-fg-subtle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-border-soft px-3 py-2.5 text-xs">
          <p className="text-fg">{k.purpose}</p>
          <p className="text-fg-muted"><span className="text-warning">⚡ Performance:</span> {k.performance}</p>
          {k.alternative && <p className="text-fg-muted"><span className="text-accent">🔁 Alternative:</span> {k.alternative}</p>}
          <pre className="overflow-x-auto rounded-lg bg-bg-elevated p-2 font-mono text-[11px] text-fg">{k.example}</pre>
          <div className="flex flex-wrap gap-2 pt-1">
            {k.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 rounded bg-bg-elevated px-2 py-0.5 text-[11px] text-accent hover:underline">
                <ExternalLink size={10} /> {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DaxInsightPage() {
  const [dax, setDax] = useState(SAMPLE);
  const [tab, setTab] = useState<MobileTab>("editor");
  const analysis = useMemo(() => analyzeDax(dax), [dax]);

  function explain() {
    log.action("DaxInsight", "analyze", { keywords: analysis.detected.length });
  }

  const Editor = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Brain size={16} className="text-accent" />
        <span className="text-sm font-semibold">DAX Insight</span>
        <span className="hidden text-xs text-fg-subtle sm:inline">Paste DAX — hover a keyword for a cited explanation</span>
        <button onClick={explain} className="btn btn-accent ml-auto px-3 py-1.5 text-xs">
          <Sparkles size={14} /> Analyze
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <DaxEditor value={dax} onChange={setDax} />
      </div>
    </div>
  );

  const Flow = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold">
        <Workflow size={15} className="text-accent" /> Execution Flow
      </div>
      <MermaidView chart={analysis.flowMermaid} className="min-h-0 flex-1 p-4" />
      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-fg-muted">
          <Gauge size={14} /> Estimated execution cost
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CostBadge label="Storage Engine" value={analysis.cost.storageEngine} />
          <CostBadge label="Formula Engine" value={analysis.cost.formulaEngine} />
          <CostBadge label="Cardinality risk" value={analysis.cost.cardinalityRisk} />
          <CostBadge label="Memory impact" value={analysis.cost.memoryImpact} />
        </div>
      </div>
    </div>
  );

  const Insights = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold">
        <BookOpen size={15} className="text-accent" /> Insights
        <span className="ml-auto text-xs font-normal text-fg-subtle">{analysis.detected.length} keywords</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        {analysis.warnings.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <div className="mb-1 flex items-center gap-1.5 font-semibold"><AlertTriangle size={13} /> Warnings</div>
            <ul className="list-disc space-y-1 pl-4">{analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}

        {analysis.cost.bottlenecks.length > 0 && (
          <div className="rounded-lg border border-border bg-bg-elevated p-3 text-xs">
            <div className="mb-1 font-semibold text-fg">Potential bottlenecks</div>
            <ul className="list-disc space-y-1 pl-4 text-fg-muted">{analysis.cost.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>
        )}

        <div className="space-y-2">
          {analysis.detected.length === 0 && <p className="text-xs text-fg-subtle">No known DAX keywords detected yet.</p>}
          {analysis.detected.map((k) => <KeywordCard key={k.name} k={k} />)}
        </div>

        <div className="rounded-lg border border-border bg-bg-elevated p-3 text-xs">
          <div className="mb-1.5 font-semibold text-fg">Trusted sources</div>
          <p className="mb-2 text-fg-subtle">Every explanation is grounded in these references, in priority order:</p>
          <div className="flex flex-wrap gap-2">
            {TRUSTED_SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 rounded bg-bg px-2 py-1 text-accent hover:underline">
                <ExternalLink size={10} /> {s.label}
              </a>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-fg-subtle">
            Connect an AI provider (Claude / GPT / Gemini) in the backend to add natural-language
            Q&amp;A — it is required to cite these sources first.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Mobile tab switcher */}
      <div className="flex border-b border-border lg:hidden">
        {(["editor", "flow", "insights"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs capitalize",
              tab === t ? "border-b-2 border-accent text-accent" : "text-fg-subtle"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Desktop: 3-panel; mobile: active tab only */}
      <div className="hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[1fr_1fr_360px] lg:divide-x lg:divide-border">
        {Editor}
        {Flow}
        {Insights}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden lg:hidden">
        {tab === "editor" ? Editor : tab === "flow" ? Flow : Insights}
      </div>
    </div>
  );
}
