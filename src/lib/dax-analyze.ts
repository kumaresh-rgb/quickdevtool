import { DAX_KNOWLEDGE, lookupKeyword, type DaxKeyword } from "@/lib/dax-knowledge";

export interface DaxCost {
  storageEngine: "Low" | "Medium" | "High";
  formulaEngine: "Low" | "Medium" | "High";
  cardinalityRisk: "Low" | "Medium" | "High";
  memoryImpact: "Low" | "Medium" | "High";
  bottlenecks: string[];
}

export interface DaxAnalysis {
  detected: DaxKeyword[];
  flowMermaid: string;
  cost: DaxCost;
  warnings: string[];
}

const ITERATORS = ["SUMX", "AVERAGEX", "COUNTX", "MINX", "MAXX", "FILTER", "ADDCOLUMNS", "RANKX", "CONCATENATEX"];
const STRUCTURAL = ["DEFINE", "VAR", "CALCULATE", "CALCULATETABLE", "FILTER", "SUMMARIZECOLUMNS",
  "SUMMARIZE", "ADDCOLUMNS", "SELECTCOLUMNS", "TOPN", "GROUPBY", "EVALUATE"];

function tokens(text: string): string[] {
  return (text.toUpperCase().match(/\b[A-Z][A-Z0-9]*\b/g) ?? []);
}

function count(text: string, word: string): number {
  return (text.toUpperCase().match(new RegExp(`\\b${word}\\b`, "g")) ?? []).length;
}

function level(n: number, med: number, high: number): "Low" | "Medium" | "High" {
  if (n >= high) return "High";
  if (n >= med) return "Medium";
  return "Low";
}

/** Build a top-down Mermaid flow from the structural keywords in order of appearance. */
function buildFlow(text: string): string {
  const upper = text.toUpperCase();
  const hits: { kw: string; idx: number }[] = [];
  for (const kw of STRUCTURAL) {
    const idx = upper.indexOf(kw);
    if (idx >= 0) hits.push({ kw, idx });
  }
  hits.sort((a, b) => a.idx - b.idx);

  // VAR can appear many times — collapse to a single node.
  const seen = new Set<string>();
  const steps = hits.filter((h) => (seen.has(h.kw) ? false : seen.add(h.kw))).map((h) => h.kw);
  if (steps.length === 0) return "flowchart TD\n  A[Paste a DAX query to see its flow]";

  const lines = ["flowchart TD"];
  steps.forEach((s, i) => {
    const id = String.fromCharCode(65 + i);
    lines.push(`  ${id}["${s}"]`);
    if (i > 0) lines.push(`  ${String.fromCharCode(65 + i - 1)} --> ${id}`);
  });
  return lines.join("\n");
}

export function analyzeDax(text: string): DaxAnalysis {
  if (!text.trim()) {
    return {
      detected: [],
      flowMermaid: "flowchart TD\n  A[Paste a DAX query to see its flow]",
      cost: { storageEngine: "Low", formulaEngine: "Low", cardinalityRisk: "Low", memoryImpact: "Low", bottlenecks: [] },
      warnings: [],
    };
  }

  // Detected keywords (unique, first-seen order).
  const seen = new Set<string>();
  const detected: DaxKeyword[] = [];
  for (const tok of tokens(text)) {
    if (seen.has(tok)) continue;
    const k = lookupKeyword(tok);
    if (k) {
      seen.add(tok);
      detected.push(k);
    }
  }

  // Cost heuristics.
  const iterCount = ITERATORS.reduce((n, w) => n + count(text, w), 0);
  const calcCount = count(text, "CALCULATE") + count(text, "CALCULATETABLE");
  const filterCount = count(text, "FILTER");
  const nestingDepth = Math.max(0, (text.match(/\(/g) ?? []).length - (text.match(/\)/g) ?? []).length === 0 ? 0 : 0);
  const parenDepth = maxParenDepth(text);

  const bottlenecks: string[] = [];
  if (filterCount > 0) bottlenecks.push(`FILTER used ${filterCount}×: prefer boolean filter arguments to CALCULATE where possible.`);
  if (calcCount >= 2) bottlenecks.push(`${calcCount} CALCULATE/CALCULATETABLE: watch for repeated context transitions.`);
  if (count(text, "SUMMARIZE") > 0) bottlenecks.push("SUMMARIZE with aggregations can be slow — use ADDCOLUMNS over SUMMARIZE, or SUMMARIZECOLUMNS.");
  if (iterCount >= 3) bottlenecks.push(`${iterCount} iterator calls: large-table iteration loads the Formula Engine.`);

  const warnings: string[] = [];
  if (!/\b(EVALUATE|DEFINE)\b/i.test(text)) warnings.push("Query does not start with EVALUATE or DEFINE — it may be a measure expression rather than a runnable query.");
  if (count(text, "SUMMARIZE") > 0) warnings.push("Consider SUMMARIZECOLUMNS instead of SUMMARIZE for queries.");

  void nestingDepth;

  return {
    detected,
    flowMermaid: buildFlow(text),
    cost: {
      storageEngine: level(filterCount + count(text, "SUMMARIZECOLUMNS"), 1, 3),
      formulaEngine: level(iterCount + calcCount, 2, 4),
      cardinalityRisk: level(parenDepth, 4, 7),
      memoryImpact: level(iterCount + filterCount, 2, 4),
      bottlenecks,
    },
    warnings,
  };
}

function maxParenDepth(text: string): number {
  let depth = 0;
  let max = 0;
  for (const c of text) {
    if (c === "(") max = Math.max(max, ++depth);
    else if (c === ")") depth = Math.max(0, depth - 1);
  }
  return max;
}

export const KNOWN_KEYWORDS = Object.keys(DAX_KNOWLEDGE);
