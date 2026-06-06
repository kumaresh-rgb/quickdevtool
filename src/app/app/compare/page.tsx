"use client";

import { useMemo, useState } from "react";
import { Columns2, Rows3, ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { diffLines, diffStats, diffWords, type LineDiff, type WordPart } from "@/lib/diff";

const LEFT_SAMPLE = `function total(items) {
  let sum = 0;
  for (const i of items) {
    sum += i.price;
  }
  return sum;
}`;

const RIGHT_SAMPLE = `function total(items) {
  return items
    .reduce((sum, i) => sum + i.price, 0);
}`;

function WordSpans({ parts }: { parts: WordPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.op === "equal" ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            style={{
              background: p.op === "add" ? "var(--diff-add)" : "var(--diff-del)",
              borderRadius: 3,
            }}
          >
            {p.text}
          </span>
        )
      )}
    </>
  );
}

function rowBg(op: LineDiff["op"]) {
  if (op === "add") return "var(--diff-add)";
  if (op === "remove") return "var(--diff-del)";
  return "transparent";
}

export default function ComparePage() {
  const [left, setLeft] = useState(LEFT_SAMPLE);
  const [right, setRight] = useState(RIGHT_SAMPLE);
  const [view, setView] = useState<"split" | "inline">("split");

  const diff = useMemo(() => diffLines(left, right), [left, right]);
  const stats = useMemo(() => diffStats(diff), [diff]);

  // For split view, pair removes with adds so changed lines show word-level diff side by side.
  const rows = useMemo(() => {
    const out: { left?: LineDiff; right?: LineDiff }[] = [];
    for (let i = 0; i < diff.length; i++) {
      const d = diff[i];
      if (d.op === "remove" && diff[i + 1]?.op === "add") {
        out.push({ left: d, right: diff[i + 1] });
        i++;
      } else if (d.op === "remove") out.push({ left: d });
      else if (d.op === "add") out.push({ right: d });
      else out.push({ left: d, right: d });
    }
    return out;
  }, [diff]);

  function swap() {
    setLeft(right);
    setRight(left);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Text & Code Compare"
        subtitle={`+${stats.added} −${stats.removed} · ${stats.unchanged} unchanged`}
        actions={
          <>
            <button onClick={swap} className="btn btn-ghost px-3 py-1.5 text-xs">
              <ArrowLeftRight size={14} /> Swap
            </button>
            <button
              onClick={() => setView("split")}
              className={`btn px-3 py-1.5 text-xs ${view === "split" ? "btn-accent" : "btn-ghost"}`}
            >
              <Columns2 size={14} /> Split
            </button>
            <button
              onClick={() => setView("inline")}
              className={`btn px-3 py-1.5 text-xs ${view === "inline" ? "btn-accent" : "btn-ghost"}`}
            >
              <Rows3 size={14} /> Inline
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 divide-y divide-border border-b border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <textarea
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          spellCheck={false}
          className="h-32 resize-none bg-bg p-3 font-mono text-xs leading-5 outline-none"
          placeholder="Original…"
        />
        <textarea
          value={right}
          onChange={(e) => setRight(e.target.value)}
          spellCheck={false}
          className="h-32 resize-none bg-bg p-3 font-mono text-xs leading-5 outline-none"
          placeholder="Changed…"
        />
      </div>

      <div className="flex-1 overflow-auto bg-bg-elevated font-mono text-xs leading-6">
        {view === "split" ? (
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((r, i) => {
                const changed = r.left && r.right && r.left.op === "remove" && r.right.op === "add";
                const wd = changed ? diffWords(r.left!.text, r.right!.text) : null;
                return (
                  <tr key={i}>
                    <td className="w-10 select-none border-r border-border-soft px-2 text-right text-fg-subtle">
                      {r.left?.left ?? ""}
                    </td>
                    <td className="w-1/2 whitespace-pre-wrap px-3" style={{ background: r.left ? rowBg(r.left.op) : "transparent" }}>
                      {wd ? <WordSpans parts={wd.left} /> : r.left?.text}
                    </td>
                    <td className="w-10 select-none border-x border-border-soft px-2 text-right text-fg-subtle">
                      {r.right?.right ?? ""}
                    </td>
                    <td className="w-1/2 whitespace-pre-wrap px-3" style={{ background: r.right ? rowBg(r.right.op) : "transparent" }}>
                      {wd ? <WordSpans parts={wd.right} /> : r.right?.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {diff.map((d, i) => (
                <tr key={i} style={{ background: rowBg(d.op) }}>
                  <td className="w-10 select-none px-2 text-right text-fg-subtle">{d.left ?? ""}</td>
                  <td className="w-10 select-none border-r border-border-soft px-2 text-right text-fg-subtle">{d.right ?? ""}</td>
                  <td className="w-6 select-none px-2 text-center text-fg-subtle">
                    {d.op === "add" ? "+" : d.op === "remove" ? "−" : ""}
                  </td>
                  <td className="whitespace-pre-wrap px-2">{d.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
