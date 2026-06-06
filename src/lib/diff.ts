// Fast line + word diff using a Myers-style LCS. No dependencies — keeps the
// Text/Code Compare module instant even on large inputs.

export type DiffOp = "equal" | "add" | "remove";

export interface LineDiff {
  op: DiffOp;
  left: number | null; // 1-based line number in the left text
  right: number | null; // 1-based line number in the right text
  text: string;
}

function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

export function diffLines(leftText: string, rightText: string): LineDiff[] {
  const a = leftText.split("\n");
  const b = rightText.split("\n");
  const dp = lcsTable(a, b);
  const out: LineDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: "equal", left: i + 1, right: j + 1, text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ op: "remove", left: i + 1, right: null, text: a[i] });
      i++;
    } else {
      out.push({ op: "add", left: null, right: j + 1, text: b[j] });
      j++;
    }
  }
  while (i < a.length) out.push({ op: "remove", left: i + 1, right: null, text: a[i++] });
  while (j < b.length) out.push({ op: "add", left: null, right: j + 1, text: b[j++] });
  return out;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export function diffStats(diff: LineDiff[]): DiffStats {
  return diff.reduce(
    (acc, d) => {
      if (d.op === "add") acc.added++;
      else if (d.op === "remove") acc.removed++;
      else acc.unchanged++;
      return acc;
    },
    { added: 0, removed: 0, unchanged: 0 }
  );
}

export interface WordPart {
  op: DiffOp;
  text: string;
}

/** Word-level diff between two single lines, for inline highlighting. */
export function diffWords(left: string, right: string): { left: WordPart[]; right: WordPart[] } {
  const a = left.split(/(\s+)/);
  const b = right.split(/(\s+)/);
  const dp = lcsTable(a, b);
  const leftParts: WordPart[] = [];
  const rightParts: WordPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      leftParts.push({ op: "equal", text: a[i] });
      rightParts.push({ op: "equal", text: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      leftParts.push({ op: "remove", text: a[i++] });
    } else {
      rightParts.push({ op: "add", text: b[j++] });
    }
  }
  while (i < a.length) leftParts.push({ op: "remove", text: a[i++] });
  while (j < b.length) rightParts.push({ op: "add", text: b[j++] });
  return { left: leftParts, right: rightParts };
}
