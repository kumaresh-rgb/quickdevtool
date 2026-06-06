// Curated DAX knowledge base. Every entry carries cited sources so DAX Insight
// can show *where* an explanation comes from (dax.guide, SQLBI, Microsoft Learn).
// This is the trusted, offline layer; an AI provider can augment it but must cite
// these same sources first.

export interface DaxSource {
  label: string;
  url: string;
}

export interface DaxKeyword {
  name: string;
  kind: "function" | "keyword";
  category: string;
  purpose: string;
  performance: string;
  alternative?: string;
  example: string;
  sources: DaxSource[];
}

const src = {
  guide: (fn: string): DaxSource => ({ label: "dax.guide", url: `https://dax.guide/${fn.toLowerCase()}/` }),
  sqlbi: (path: string): DaxSource => ({ label: "SQLBI", url: `https://www.sqlbi.com/${path}` }),
  learn: (fn: string): DaxSource => ({
    label: "Microsoft Learn",
    url: `https://learn.microsoft.com/en-us/dax/${fn.toLowerCase()}-function-dax`,
  }),
};

export const DAX_KNOWLEDGE: Record<string, DaxKeyword> = {
  EVALUATE: {
    name: "EVALUATE", kind: "keyword", category: "Query",
    purpose: "Starts a DAX query statement and returns a table expression as the result set.",
    performance: "The shape of the table expression after EVALUATE drives the whole query plan — keep it as narrow as possible.",
    example: "EVALUATE\nSUMMARIZECOLUMNS('Product'[Category], \"Sales\", [Total Sales])",
    sources: [{ label: "dax.guide", url: "https://dax.guide/st/evaluate/" }, src.learn("queries")],
  },
  DEFINE: {
    name: "DEFINE", kind: "keyword", category: "Query",
    purpose: "Declares query-scoped entities (MEASURE, VAR, TABLE, COLUMN) reused by following EVALUATE blocks.",
    performance: "Query-scoped MEASURE definitions are great for testing without modifying the model.",
    example: "DEFINE\n  VAR Threshold = 1000\nEVALUATE\nFILTER('Product', [Total Sales] > Threshold)",
    sources: [{ label: "dax.guide", url: "https://dax.guide/st/define/" }, src.learn("queries")],
  },
  VAR: {
    name: "VAR", kind: "keyword", category: "Variables",
    purpose: "Stores the result of an expression in a named variable, evaluated once where it is defined (lazy).",
    performance: "Variables prevent re-computing the same sub-expression and improve readability and plan reuse.",
    alternative: "Repeating the expression inline (slower, harder to read).",
    example: "VAR Sales = [Total Sales]\nRETURN IF(Sales > 0, Sales, BLANK())",
    sources: [{ label: "dax.guide", url: "https://dax.guide/var/" }, src.sqlbi("articles/variables-in-dax/") ],
  },
  RETURN: {
    name: "RETURN", kind: "keyword", category: "Variables",
    purpose: "Specifies the expression returned after one or more VAR declarations.",
    performance: "No cost itself; pairs with VAR.",
    example: "VAR x = 1 RETURN x + 1",
    sources: [{ label: "dax.guide", url: "https://dax.guide/var/" }],
  },
  CALCULATE: {
    name: "CALCULATE", kind: "function", category: "Filter context",
    purpose: "Evaluates an expression in a modified filter context. The single most important DAX function.",
    performance: "Each filter argument adds work; beware context transition inside row contexts (it can be expensive over large tables).",
    alternative: "CALCULATETABLE when returning a table instead of a scalar.",
    example: "CALCULATE([Total Sales], 'Product'[Category] = \"Bikes\")",
    sources: [src.guide("CALCULATE"), src.sqlbi("articles/understanding-calculate-in-dax/"), src.learn("calculate")],
  },
  CALCULATETABLE: {
    name: "CALCULATETABLE", kind: "function", category: "Filter context",
    purpose: "Like CALCULATE but returns a table; evaluates a table expression in a modified filter context.",
    performance: "Prefer over FILTER-wrapping when you can express the condition as a filter argument.",
    example: "CALCULATETABLE('Sales', 'Date'[Year] = 2024)",
    sources: [src.guide("CALCULATETABLE"), src.learn("calculatetable")],
  },
  FILTER: {
    name: "FILTER", kind: "function", category: "Table",
    purpose: "Returns a table that is a subset of another table, keeping rows that satisfy a predicate.",
    performance: "An iterator — it scans row by row. Avoid FILTER over large tables when a simple filter argument to CALCULATE would do.",
    alternative: "Direct boolean filter arguments inside CALCULATE (often faster).",
    example: "FILTER('Product', 'Product'[Price] > 100)",
    sources: [src.guide("FILTER"), src.sqlbi("articles/filter-arguments-in-calculate/"), src.learn("filter")],
  },
  SUMMARIZECOLUMNS: {
    name: "SUMMARIZECOLUMNS", kind: "function", category: "Table",
    purpose: "Groups by the given columns and adds aggregated expression columns; the preferred grouping function for queries.",
    performance: "Highly optimised; it removes rows with no data automatically. Prefer over SUMMARIZE for queries.",
    alternative: "SUMMARIZE (older, easier to misuse) / GROUPBY.",
    example: "SUMMARIZECOLUMNS('Date'[Year], \"Sales\", [Total Sales])",
    sources: [src.guide("SUMMARIZECOLUMNS"), src.sqlbi("articles/introducing-summarizecolumns/"), src.learn("summarizecolumns")],
  },
  SUMMARIZE: {
    name: "SUMMARIZE", kind: "function", category: "Table",
    purpose: "Groups a table by columns and optionally adds summary columns.",
    performance: "Avoid adding aggregation columns inside SUMMARIZE (causes extra context transitions) — use ADDCOLUMNS over SUMMARIZE instead.",
    alternative: "SUMMARIZECOLUMNS for queries; ADDCOLUMNS + SUMMARIZE for measures.",
    example: "SUMMARIZE('Sales', 'Product'[Category])",
    sources: [src.guide("SUMMARIZE"), src.sqlbi("articles/all-the-secrets-of-summarize/")],
  },
  ADDCOLUMNS: {
    name: "ADDCOLUMNS", kind: "function", category: "Table",
    purpose: "Returns a table with new computed columns added to each row of an input table.",
    performance: "An iterator; expressions run per row. Combine with SUMMARIZE for the efficient grouping pattern.",
    example: "ADDCOLUMNS(VALUES('Product'[Category]), \"Sales\", [Total Sales])",
    sources: [src.guide("ADDCOLUMNS"), src.learn("addcolumns")],
  },
  SELECTCOLUMNS: {
    name: "SELECTCOLUMNS", kind: "function", category: "Table",
    purpose: "Returns a table with only the chosen/renamed columns — like SQL SELECT.",
    performance: "Lighter than ADDCOLUMNS when you only project existing columns.",
    example: "SELECTCOLUMNS('Sales', \"Qty\", 'Sales'[Quantity])",
    sources: [src.guide("SELECTCOLUMNS"), src.learn("selectcolumns")],
  },
  TOPN: {
    name: "TOPN", kind: "function", category: "Table",
    purpose: "Returns the top N rows of a table ordered by an expression.",
    performance: "Sorting cost grows with cardinality; materialise a narrow table first.",
    example: "TOPN(10, 'Product', [Total Sales], DESC)",
    sources: [src.guide("TOPN"), src.learn("topn")],
  },
  SUMX: {
    name: "SUMX", kind: "function", category: "Iterator",
    purpose: "Iterates a table and sums an expression evaluated per row (row context).",
    performance: "Iterator with context transition if it calls measures. Push work to the Storage Engine where possible.",
    alternative: "SUM over a column when no per-row expression is needed.",
    example: "SUMX('Sales', 'Sales'[Qty] * 'Sales'[Price])",
    sources: [src.guide("SUMX"), src.sqlbi("articles/sum-and-sumx-in-dax/"), src.learn("sumx")],
  },
  RANKX: {
    name: "RANKX", kind: "function", category: "Iterator",
    purpose: "Returns the rank of a value over a table by evaluating an expression per row.",
    performance: "Double iteration — can be heavy. Pre-compute the ranking table when reused.",
    example: "RANKX(ALL('Product'), [Total Sales])",
    sources: [src.guide("RANKX"), src.sqlbi("articles/the-power-of-rankx/")],
  },
  DIVIDE: {
    name: "DIVIDE", kind: "function", category: "Math",
    purpose: "Safe division that returns BLANK (or an alternate) on divide-by-zero.",
    performance: "Cheaper and safer than IF(denominator=0,…).",
    alternative: "Manual IF guard (more verbose, error-prone).",
    example: "DIVIDE([Sales], [Target], 0)",
    sources: [src.guide("DIVIDE"), src.sqlbi("articles/divide-performance-in-dax/")],
  },
  ALL: {
    name: "ALL", kind: "function", category: "Filter context",
    purpose: "Removes filters from a table or columns, returning all rows ignoring filter context.",
    performance: "Cheap, but changes semantics — pair carefully with CALCULATE.",
    alternative: "REMOVEFILTERS (clearer intent), ALLEXCEPT.",
    example: "CALCULATE([Total Sales], ALL('Product'))",
    sources: [src.guide("ALL"), src.learn("all")],
  },
  VALUES: {
    name: "VALUES", kind: "function", category: "Table",
    purpose: "Returns the distinct values of a column in the current filter context (may include a blank row).",
    performance: "Inexpensive; common building block.",
    alternative: "DISTINCT (excludes the blank row).",
    example: "VALUES('Product'[Category])",
    sources: [src.guide("VALUES"), src.learn("values")],
  },
  IF: {
    name: "IF", kind: "function", category: "Logical",
    purpose: "Returns one of two values based on a condition.",
    performance: "Both branches may be evaluated unless variables short-circuit them; use SWITCH for many cases.",
    alternative: "SWITCH(TRUE(), …) for readability.",
    example: "IF([Sales] > 0, \"Yes\", \"No\")",
    sources: [src.guide("IF"), src.learn("if")],
  },
  SWITCH: {
    name: "SWITCH", kind: "function", category: "Logical",
    purpose: "Evaluates an expression against a list of values and returns the matching result.",
    performance: "Clearer than nested IFs; pattern SWITCH(TRUE(), …) for ranges.",
    example: "SWITCH(TRUE(), [Sales] > 1000, \"High\", \"Low\")",
    sources: [src.guide("SWITCH"), src.sqlbi("articles/from-sql-to-dax-switch/")],
  },
  COUNTROWS: {
    name: "COUNTROWS", kind: "function", category: "Aggregation",
    purpose: "Counts the number of rows in a table expression.",
    performance: "Very cheap over Storage Engine; preferred over COUNT of a column for row counts.",
    example: "COUNTROWS('Sales')",
    sources: [src.guide("COUNTROWS"), src.learn("countrows")],
  },
};

export function lookupKeyword(token: string): DaxKeyword | undefined {
  return DAX_KNOWLEDGE[token.toUpperCase()];
}

/** Source priority order, as required by the product spec. */
export const TRUSTED_SOURCES: DaxSource[] = [
  { label: "dax.guide", url: "https://dax.guide/" },
  { label: "SQLBI", url: "https://www.sqlbi.com/" },
  { label: "Microsoft Learn — DAX", url: "https://learn.microsoft.com/en-us/dax/" },
  { label: "Microsoft Fabric docs", url: "https://learn.microsoft.com/en-us/fabric/" },
];
