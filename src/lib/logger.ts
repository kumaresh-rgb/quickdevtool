// Structured front-end logger. Emits one timestamped line per event with a
// consistent shape (timestamp · level · category · message · context), mirroring
// the backend Serilog style so logs are easy to correlate.

type Level = "DBG" | "INF" | "WRN" | "ERR";

const LEVEL_COLOR: Record<Level, string> = {
  DBG: "#6b7280",
  INF: "#6366f1",
  WRN: "#fbbf24",
  ERR: "#f87171",
};

function ts(): string {
  // 2026-06-06 10:32:12.451 — local time, matches the backend template.
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function emit(level: Level, category: string, message: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return; // client-only
  const ctx = context && Object.keys(context).length ? context : "";
  console.log(
    `%c${ts()} %c[${level}] %c${category}%c ${message}`,
    "color:#9aa1ad",
    `color:${LEVEL_COLOR[level]};font-weight:600`,
    "color:#34d399",
    "color:inherit",
    ctx
  );
}

export const log = {
  debug: (cat: string, msg: string, ctx?: Record<string, unknown>) => emit("DBG", cat, msg, ctx),
  info: (cat: string, msg: string, ctx?: Record<string, unknown>) => emit("INF", cat, msg, ctx),
  warn: (cat: string, msg: string, ctx?: Record<string, unknown>) => emit("WRN", cat, msg, ctx),
  error: (cat: string, msg: string, ctx?: Record<string, unknown>) => emit("ERR", cat, msg, ctx),

  /** Log a user action: page + action + optional details. */
  action: (page: string, action: string, ctx?: Record<string, unknown>) =>
    emit("INF", "UserAction", `${page} → ${action}`, ctx),

  /** Log an API call outcome with method, path, status and duration. */
  api: (method: string, path: string, status: number, durationMs: number) =>
    emit(status >= 400 ? "ERR" : "INF", "API", `${method} ${path} → ${status}`, {
      durationMs: Math.round(durationMs),
    }),
};
