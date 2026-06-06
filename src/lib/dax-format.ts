// Client-side DAX pretty-printer. Mirrors the server formatter so output is
// identical whether formatting happens in the browser (instant) or via the API.

const NEWLINE_KEYWORDS = [
  "EVALUATE", "DEFINE", "MEASURE", "VAR", "RETURN", "ORDER BY", "START AT",
  "CALCULATE", "CALCULATETABLE", "FILTER", "SUMMARIZE", "SUMMARIZECOLUMNS",
  "ADDCOLUMNS", "SELECTCOLUMNS", "GROUPBY", "TOPN", "UNION", "EXCEPT",
  "INTERSECT", "NATURALINNERJOIN", "NATURALLEFTOUTERJOIN",
];

/** Strip escaped-JSON whitespace that comes from copied service payloads. */
export function unescapeJsonDax(input: string): string {
  return input
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/^\s*"|"\s*$/g, ""); // surrounding quotes from a JSON string value
}

function collapseWhitespace(text: string): string {
  let out = "";
  let inString = false;
  let prev = "";
  for (const c of text) {
    if (c === '"') inString = !inString;
    if (!inString && /\s/.test(c) && /\s/.test(prev)) {
      prev = c;
      continue;
    }
    out += c;
    prev = c;
  }
  return out;
}

function unmatchedParens(line: string): number {
  let balance = 0;
  let inString = false;
  for (const c of line) {
    if (c === '"') inString = !inString;
    if (inString) continue;
    if (c === "(") balance++;
    else if (c === ")") balance--;
  }
  return balance;
}

export function formatDax(input: string): string {
  if (!input.trim()) return "";
  let text = unescapeJsonDax(input);
  text = collapseWhitespace(text);

  for (const kw of NEWLINE_KEYWORDS) {
    text = text.replace(new RegExp(`\\s+\\b${kw}\\b`, "gi"), "\n" + kw);
  }

  const lines = text.split("\n");
  let depth = 0;
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const delta = unmatchedParens(line);
    const leading = delta < 0 ? Math.max(0, depth + delta) : depth;
    out.push("    ".repeat(leading) + line);
    depth = Math.max(0, depth + delta);
  }
  return out.join("\n");
}
