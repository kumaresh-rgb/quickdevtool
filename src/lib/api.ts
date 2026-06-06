// Thin typed fetch wrapper around the .NET backend.
// Base URL comes from NEXT_PUBLIC_API_URL (see .env.local).

import { log } from "@/lib/logger";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5180";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const started = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    log.api(method, path, res.status, performance.now() - started);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    log.error("API", `${method} ${path} failed`, { error: (err as Error).message });
    throw err;
  }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body: unknown) =>
    request<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(p: string, body: unknown) =>
    request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: (p: string) => request<void>(p, { method: "DELETE" }),
};

// ---- Shared API types (mirror the backend DTOs) ----

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  isPinned: boolean;
  isArchived: boolean;
  folder: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  column: string;
  order: number;
  priority: string;
  labels: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DaxProfile {
  id: string;
  name: string;
  environment: string;
  workspaceId: string;
  datasetId: string;
  tenantId: string;
  xmlaEndpoint: string;
  authMode: string;
  isDefault: boolean;
}

export interface DaxFavorite {
  id: string;
  name: string;
  query: string;
  folder: string | null;
  tags: string;
}

export interface ExecuteResult {
  success: boolean;
  columns: string[];
  rows: (string | number | null)[][];
  durationMs: number;
  rowCount: number;
  error: string | null;
  simulated: boolean;
}
