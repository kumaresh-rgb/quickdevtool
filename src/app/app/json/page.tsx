"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCopy } from "@/lib/useCopy";
import { formatDax, unescapeJsonDax } from "@/lib/dax-format";

type Mode = "text" | "tree";

interface JsonNodeProps {
  k?: string;
  value: unknown;
  depth: number;
}

function JsonNode({ k, value, depth }: JsonNodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const isObj = value !== null && typeof value === "object";
  const pad = { paddingLeft: depth * 14 };

  if (!isObj) {
    const color =
      typeof value === "number" ? "var(--warning)"
      : typeof value === "boolean" ? "var(--accent-hover)"
      : value === null ? "var(--fg-subtle)"
      : "var(--success)";
    return (
      <div style={pad} className="font-mono text-xs leading-6">
        {k !== undefined && <span className="text-accent">&quot;{k}&quot;</span>}
        {k !== undefined && <span className="text-fg-subtle">: </span>}
        <span style={{ color }}>{JSON.stringify(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const bracket = Array.isArray(value) ? ["[", "]"] : ["{", "}"];

  return (
    <div className="font-mono text-xs leading-6">
      <div style={pad} className="cursor-pointer select-none hover:bg-bg-elevated" onClick={() => setOpen(!open)}>
        <span className="text-fg-subtle">{open ? "▾" : "▸"} </span>
        {k !== undefined && <span className="text-accent">&quot;{k}&quot;</span>}
        {k !== undefined && <span className="text-fg-subtle">: </span>}
        <span className="text-fg-muted">{bracket[0]}</span>
        {!open && <span className="text-fg-subtle">…{entries.length} {bracket[1]}</span>}
      </div>
      {open && (
        <>
          {entries.map(([ek, ev]) => (
            <JsonNode key={ek} k={Array.isArray(value) ? undefined : ek} value={ev} depth={depth + 1} />
          ))}
          <div style={pad} className="text-fg-muted">{bracket[1]}</div>
        </>
      )}
    </div>
  );
}

export default function JsonToolkit() {
  const [input, setInput] = useState('{\n  "name": "Quick Dev Notes",\n  "fast": true,\n  "tools": ["notes", "dax", "json"]\n}');
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("text");
  const [copied, copy] = useCopy();

  const validity = useMemo(() => {
    if (!input.trim()) return { valid: null as boolean | null, error: "" };
    try {
      JSON.parse(input);
      return { valid: true, error: "" };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }, [input]);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(output || input);
    } catch {
      return null;
    }
  }, [output, input]);

  function run(transform: (v: unknown) => string) {
    try {
      const obj = JSON.parse(input);
      setOutput(transform(obj));
      setMode("text");
    } catch (e) {
      setOutput(`// Invalid JSON: ${(e as Error).message}`);
    }
  }

  const beautify = () => run((o) => JSON.stringify(o, null, 2));
  const minify = () => run((o) => JSON.stringify(o));
  const escape = () => setOutput(JSON.stringify(input));
  const unescape = () => {
    const trimmed = input.trim();
    try {
      // If it's a JSON string literal, unwrap it to get actual content
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        const inner = JSON.parse(trimmed);
        setOutput(typeof inner === "string" ? inner : JSON.stringify(inner, null, 2));
      } else {
        setOutput(unescapeJsonDax(trimmed));
      }
    } catch {
      setOutput(unescapeJsonDax(trimmed));
    }
  };

  /** Smart DAX: unescape a copied payload, strip control chars, and pretty-print as DAX. */
  function smartDax() {
    const clean = unescapeJsonDax(input);
    setOutput(formatDax(clean));
    setMode("text");
  }

  function download() {
    const blob = new Blob([output || input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tools = [
    { label: "Beautify", fn: beautify },
    { label: "Minify", fn: minify },
    { label: "Escape", fn: escape },
    { label: "Unescape", fn: unescape },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="JSON Toolkit"
        subtitle="Beautify · Minify · Validate · Tree · Smart DAX"
        actions={
          <>
            {validity.valid === true && (
              <span className="flex items-center gap-1 text-xs text-success">
                <CheckCircle2 size={14} /> Valid
              </span>
            )}
            {validity.valid === false && (
              <span className="flex items-center gap-1 text-xs text-danger" title={validity.error}>
                <AlertCircle size={14} /> Invalid
              </span>
            )}
            <button onClick={smartDax} className="btn btn-accent px-3 py-1.5 text-xs">
              <Sparkles size={14} /> Smart DAX
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2">
        {tools.map((t) => (
          <button key={t.label} onClick={t.fn} className="btn btn-ghost px-3 py-1.5 text-xs">
            {t.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          onClick={() => setMode("text")}
          className={`btn px-3 py-1.5 text-xs ${mode === "text" ? "btn-accent" : "btn-ghost"}`}
        >
          Text
        </button>
        <button
          onClick={() => setMode("tree")}
          className={`btn px-3 py-1.5 text-xs ${mode === "tree" ? "btn-accent" : "btn-ghost"}`}
        >
          Tree
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => copy(output || input)} className="btn btn-ghost px-3 py-1.5 text-xs">
            {copied ? <Check size={14} /> : <Copy size={14} />} Copy
          </button>
          <button onClick={download} className="btn btn-ghost px-3 py-1.5 text-xs">
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 divide-y divide-border overflow-hidden md:grid-cols-2 md:divide-x md:divide-y-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste JSON or an escaped DAX payload…"
          className="h-full resize-none bg-bg p-4 font-mono text-xs leading-6 text-fg outline-none"
        />
        <div className="h-full overflow-auto bg-bg-elevated p-4">
          {mode === "tree" ? (
            parsed !== null ? (
              <JsonNode value={parsed} depth={0} />
            ) : (
              <p className="text-xs text-fg-subtle">Tree view needs valid JSON.</p>
            )
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-fg">
              {output || "// Output appears here. Pick a transform above."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
