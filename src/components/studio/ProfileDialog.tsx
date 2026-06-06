"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api, type DaxProfile } from "@/lib/api";

const ENVIRONMENTS = ["Development", "QA", "UAT", "Production"];
const AUTH_MODES = ["ServicePrincipal", "Interactive", "Username"];

export function ProfileDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (p: DaxProfile) => void;
}) {
  const [form, setForm] = useState({
    name: "", environment: "Development", workspaceId: "", datasetId: "",
    tenantId: "", xmlaEndpoint: "powerbi://api.powerbi.com/v1.0/myorg/", authMode: "ServicePrincipal", isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const created = await api.post<DaxProfile>("/api/dax/profiles", form);
      onSaved(created);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">New connection profile</h2>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs">
            <span className="mb-1 block text-fg-subtle">Connection name</span>
            <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="My Prod Dataset" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">Environment</span>
            <select className={field} value={form.environment} onChange={(e) => set("environment", e.target.value)}>
              {ENVIRONMENTS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">Auth mode</span>
            <select className={field} value={form.authMode} onChange={(e) => set("authMode", e.target.value)}>
              {AUTH_MODES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">Workspace ID</span>
            <input className={field} value={form.workspaceId} onChange={(e) => set("workspaceId", e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">Dataset ID</span>
            <input className={field} value={form.datasetId} onChange={(e) => set("datasetId", e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">Tenant ID</span>
            <input className={field} value={form.tenantId} onChange={(e) => set("tenantId", e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-fg-subtle">XMLA endpoint</span>
            <input className={field} value={form.xmlaEndpoint} onChange={(e) => set("xmlaEndpoint", e.target.value)} />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
            Set as default profile
          </label>
        </div>

        <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          Local-first build: queries run against a simulated engine. Wire ADOMD.NET / XMLA
          in the backend to execute against real Power BI.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={!form.name || saving} className="btn btn-accent px-4 py-2 text-sm disabled:opacity-50">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
