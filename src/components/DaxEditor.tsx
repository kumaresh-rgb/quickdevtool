"use client";

import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import { lookupKeyword } from "@/lib/dax-knowledge";

let registered = false;

const DAX_KEYWORDS = [
  "EVALUATE", "DEFINE", "MEASURE", "VAR", "RETURN", "ORDER", "BY", "START", "AT",
  "TRUE", "FALSE", "NOT", "IN", "AND", "OR", "ASC", "DESC",
];

const DAX_FUNCTIONS = [
  "CALCULATE", "CALCULATETABLE", "FILTER", "ALL", "ALLEXCEPT", "ALLSELECTED",
  "SUMMARIZE", "SUMMARIZECOLUMNS", "ADDCOLUMNS", "SELECTCOLUMNS", "GROUPBY",
  "TOPN", "VALUES", "DISTINCT", "RELATED", "RELATEDTABLE", "SUM", "SUMX",
  "AVERAGE", "AVERAGEX", "COUNT", "COUNTROWS", "COUNTX", "MIN", "MAX", "MINX",
  "MAXX", "DIVIDE", "IF", "SWITCH", "BLANK", "ISBLANK", "CONCATENATEX",
  "USERELATIONSHIP", "EARLIER", "RANKX", "DATESYTD", "TOTALYTD", "SAMEPERIODLASTYEAR",
  "DATEADD", "FORMAT", "ROW", "UNION", "EXCEPT", "INTERSECT", "NATURALINNERJOIN",
];

/** Register a lightweight DAX language + Power BI-style dark theme exactly once. */
function registerDax(monaco: Monaco) {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: "dax" });
  monaco.languages.setMonarchTokensProvider("dax", {
    ignoreCase: true,
    keywords: DAX_KEYWORDS,
    functions: DAX_FUNCTIONS,
    tokenizer: {
      root: [
        [/--.*$/, "comment"],
        [/\/\/.*$/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^']|'')*'/, "type"], // 'Table' references
        [/\[[^\]]*\]/, "variable"], // [Column] / [Measure]
        [/\b\d+(\.\d+)?\b/, "number"],
        [
          /[A-Za-z_][\w]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@functions": "predefined",
              "@default": "identifier",
            },
          },
        ],
        [/[()\[\]{}]/, "delimiter.bracket"],
        [/[,;]/, "delimiter"],
      ],
    },
  });

  monaco.editor.defineTheme("powerbi-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
      { token: "predefined", foreground: "4FC1FF" },
      { token: "string", foreground: "CE9178" },
      { token: "type", foreground: "4EC9B0" },
      { token: "variable", foreground: "DCDCAA" },
      { token: "number", foreground: "B5CEA8" },
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#12141a",
      "editor.lineHighlightBackground": "#1b1e27",
    },
  });

  // Floating annotation: hover a known keyword to see purpose, performance and
  // cited documentation links (dax.guide / SQLBI / Microsoft Learn).
  monaco.languages.registerHoverProvider("dax", {
    provideHover: (model: editor.ITextModel, position: Position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const k = lookupKeyword(word.word);
      if (!k) return null;
      const sources = k.sources.map((s) => `[${s.label}](${s.url})`).join(" · ");
      return {
        contents: [
          { value: `**${k.name}** — _${k.category}_` },
          { value: k.purpose },
          { value: `⚡ **Performance:** ${k.performance}` },
          ...(k.alternative ? [{ value: `🔁 **Alternative:** ${k.alternative}` }] : []),
          { value: "```dax\n" + k.example + "\n```" },
          { value: `📚 ${sources}`, isTrusted: true },
        ],
      };
    },
  });

  monaco.languages.registerCompletionItemProvider("dax", {
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const suggestions = [...DAX_FUNCTIONS, ...DAX_KEYWORDS].map((label) => ({
        label,
        kind: DAX_FUNCTIONS.includes(label)
          ? monaco.languages.CompletionItemKind.Function
          : monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
      }));
      return { suggestions };
    },
  });
}

export function DaxEditor({
  value,
  onChange,
  height = "100%",
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  height?: string | number;
  readOnly?: boolean;
}) {
  const onMount: OnMount = (_editor, monaco) => registerDax(monaco);

  return (
    <Editor
      height={height}
      language="dax"
      theme="powerbi-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      beforeMount={registerDax}
      onMount={onMount}
      options={{
        readOnly,
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        renderWhitespace: "none",
        padding: { top: 12 },
        smoothScrolling: true,
        automaticLayout: true,
      }}
    />
  );
}
