// Heuristic language detection for Smart Paste. Returns a lowlight/Monaco-ish
// language id, or null when the text doesn't look like code.

export type DetectedLang = "csharp" | "sql" | "dax" | "json" | "xml" | "mermaid" | null;

export function detectLanguage(text: string): DetectedLang {
  const t = text.trim();
  if (!t) return null;

  // JSON: parses cleanly and starts like an object/array.
  if (/^[[{]/.test(t)) {
    try {
      JSON.parse(t);
      return "json";
    } catch {
      /* fall through */
    }
  }

  // Mermaid: known diagram headers.
  if (/^(graph |flowchart |sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey|mindmap|gitGraph)/m.test(t))
    return "mermaid";

  // XML / HTML.
  if (/^<\?xml/.test(t) || /^<[a-zA-Z][\s\S]*>[\s\S]*<\/[a-zA-Z]/.test(t)) return "xml";

  // DAX: EVALUATE/DEFINE or measure-style with table[column] + DAX functions.
  if (/\b(EVALUATE|DEFINE)\b/i.test(t) ||
      (/\b(CALCULATE|SUMMARIZECOLUMNS|FILTER|ADDCOLUMNS|VAR)\b/i.test(t) && /\[[^\]]+\]/.test(t)))
    return "dax";

  // SQL.
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|JOIN|WHERE|GROUP BY)\b/i.test(t) &&
      /\b(FROM|INTO|TABLE|SET|VALUES)\b/i.test(t))
    return "sql";

  // C#.
  if (/\b(namespace|using\s+System|public\s+(class|record|interface)|async\s+Task|var\s+\w+\s*=)\b/.test(t))
    return "csharp";

  return null;
}
