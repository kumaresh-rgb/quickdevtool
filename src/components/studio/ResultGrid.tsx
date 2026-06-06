"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Copy, Check, Filter } from "lucide-react";
import type { ExecuteResult } from "@/lib/api";
import { useCopy } from "@/lib/useCopy";
import { cn } from "@/lib/cn";

const PAGE_SIZES = [100, 500, 1000];

export function ResultGrid({ result }: { result: ExecuteResult }) {
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(0);
  const [widths, setWidths] = useState<Record<number, number>>({});
  const [copied, copy] = useCopy();
  const resizing = useRef<{ col: number; startX: number; startW: number } | null>(null);

  // Filter → sort → paginate.
  const filtered = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => v.trim());
    if (!active.length) return result.rows;
    return result.rows.filter((row) =>
      active.every(([ci, v]) => String(row[Number(ci)] ?? "").toLowerCase().includes(v.toLowerCase()))
    );
  }, [result.rows, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const x = a[sort.col];
      const y = b[sort.col];
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x > y ? 1 : -1) * sort.dir;
    });
    return copy;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(col: number) {
    setSort((s) => (s?.col === col ? { col, dir: s.dir === 1 ? -1 : 1 } : { col, dir: 1 }));
  }

  function startResize(col: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { col, startX: e.clientX, startW: widths[col] ?? 160 };
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientX - resizing.current.startX;
      setWidths((w) => ({ ...w, [resizing.current!.col]: Math.max(60, resizing.current!.startW + delta) }));
    };
    const onUp = () => {
      resizing.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function rowsToDelimited(sep: string) {
    const header = result.columns.join(sep);
    const body = sorted
      .map((r) => r.map((c) => (c === null ? "" : String(c))).join(sep))
      .join("\n");
    return header + "\n" + body;
  }

  function exportCsv() {
    const header = result.columns.map((c) => `"${c}"`).join(",");
    const body = sorted
      .map((r) => r.map((c) => (c === null ? "" : `"${String(c).replace(/"/g, '""')}"`)).join(","))
      .join("\n");
    download(header + "\n" + body, "dax-result.csv", "text/csv");
  }

  function exportExcel() {
    // Excel opens an HTML table with an .xls extension natively.
    const rows = [result.columns, ...sorted.map((r) => r.map((c) => (c === null ? "" : c)))];
    const html =
      "<table>" +
      rows
        .map((r, i) => "<tr>" + r.map((c) => `<t${i ? "d" : "h"}>${c}</t${i ? "d" : "h"}>`).join("") + "</tr>")
        .join("") +
      "</table>";
    download(html, "dax-result.xls", "application/vnd.ms-excel");
  }

  function download(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Grid toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 text-xs">
        <span className="text-fg-subtle">
          {sorted.length.toLocaleString()} rows · {result.durationMs} ms
          {result.simulated && <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 text-warning">simulated</span>}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setShowFilters((s) => !s)} className={cn("btn px-2.5 py-1 text-xs", showFilters ? "btn-accent" : "btn-ghost")}>
            <Filter size={13} /> Filter
          </button>
          <button onClick={() => copy(rowsToDelimited("\t"))} className="btn btn-ghost px-2.5 py-1 text-xs">
            {copied ? <Check size={13} /> : <Copy size={13} />} Copy
          </button>
          <button onClick={exportCsv} className="btn btn-ghost px-2.5 py-1 text-xs"><Download size={13} /> CSV</button>
          <button onClick={exportExcel} className="btn btn-ghost px-2.5 py-1 text-xs"><Download size={13} /> Excel</button>
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="border-collapse text-xs" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0 z-10 bg-bg-elevated">
            <tr>
              <th className="border-b border-border px-3 py-1.5 text-left font-medium text-fg-subtle" style={{ width: 56 }}>#</th>
              {result.columns.map((c, i) => (
                <th
                  key={c}
                  className="relative border-b border-l border-border px-3 py-1.5 text-left font-medium"
                  style={{ width: widths[i] ?? 160 }}
                >
                  <span onClick={() => toggleSort(i)} className="inline-flex cursor-pointer select-none items-center gap-1 hover:text-accent">
                    {c}
                    {sort?.col === i && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </span>
                  <span
                    onMouseDown={(e) => startResize(i, e)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-accent"
                  />
                </th>
              ))}
            </tr>
            {showFilters && (
              <tr>
                <th className="border-b border-border bg-bg px-1 py-1" />
                {result.columns.map((c, i) => (
                  <th key={c} className="border-b border-l border-border bg-bg px-1 py-1">
                    <input
                      value={filters[i] ?? ""}
                      onChange={(e) => { setFilters((f) => ({ ...f, [i]: e.target.value })); setPage(0); }}
                      placeholder="filter…"
                      className="w-full rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-[11px] outline-none focus:border-accent"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {pageRows.map((r, ri) => (
              <tr key={ri} className="hover:bg-bg-elevated">
                <td className="border-b border-border-soft px-3 py-1 text-fg-subtle">{safePage * pageSize + ri + 1}</td>
                {r.map((cell, ci) => (
                  <td
                    key={ci}
                    className="overflow-hidden text-ellipsis whitespace-nowrap border-b border-l border-border-soft px-3 py-1 font-mono"
                    style={{ width: widths[ci] ?? 160, color: typeof cell === "number" ? "var(--warning)" : "var(--fg)" }}
                  >
                    {cell === null ? "∅" : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-1.5 text-xs">
        <span className="text-fg-subtle">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          className="rounded border border-border bg-bg px-2 py-1 outline-none"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          {!PAGE_SIZES.includes(pageSize) && <option value={pageSize}>{pageSize}</option>}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="btn btn-ghost px-2.5 py-1 text-xs disabled:opacity-40">Prev</button>
          <span className="text-fg-subtle">Page {safePage + 1} / {pageCount}</span>
          <button disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="btn btn-ghost px-2.5 py-1 text-xs disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
