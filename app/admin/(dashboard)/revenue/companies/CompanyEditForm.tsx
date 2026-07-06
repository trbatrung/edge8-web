"use client";

import { useState } from "react";
import { updateCompany, type CompanyPatch } from "./actions";

export type EditableCompany = {
  id: string;
  name: string | null;
  domain: string | null;
  industry: string | null;
  size_band: string | null;
  country: string | null;
  website: string | null;
  priority: string | null;
  notes?: string | null;
};

// Shared basics form. `showNotes` gates the notes field so the compact list
// drawer (which never loads notes) can't accidentally blank it on save.
export function CompanyEditForm({
  company,
  showNotes = false,
  onSaved,
}: {
  company: EditableCompany;
  showNotes?: boolean;
  onSaved?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    name: company.name ?? "",
    domain: company.domain ?? "",
    industry: company.industry ?? "",
    size_band: company.size_band ?? "",
    country: company.country ?? "",
    website: company.website ?? "",
    priority: company.priority ?? "",
    notes: company.notes ?? "",
  });

  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const patch: CompanyPatch = {
      name: form.name,
      domain: form.domain,
      industry: form.industry,
      size_band: form.size_band,
      country: form.country,
      website: form.website,
      priority: form.priority,
    };
    if (showNotes) patch.notes = form.notes;
    const r = await updateCompany(company.id, patch);
    setSaving(false);
    setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error });
    if (r.ok) onSaved?.();
  }

  return (
    <form className="admin-form" onSubmit={save}>
      {msg && (
        <div className={`admin-alert ${msg.ok ? "admin-alert--ok" : "admin-alert--err"}`}>{msg.text}</div>
      )}
      <div className="admin-field">
        <label className="admin-label">Name</label>
        <input className="admin-input" value={form.name} onChange={(e) => field("name", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="admin-field">
          <label className="admin-label">Domain</label>
          <input className="admin-input" value={form.domain} onChange={(e) => field("domain", e.target.value)} placeholder="acme.com" />
        </div>
        <div className="admin-field">
          <label className="admin-label">Website</label>
          <input className="admin-input" value={form.website} onChange={(e) => field("website", e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="admin-field">
          <label className="admin-label">Industry</label>
          <input className="admin-input" value={form.industry} onChange={(e) => field("industry", e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-label">Size</label>
          <input className="admin-input" value={form.size_band} onChange={(e) => field("size_band", e.target.value)} placeholder="e.g. 11-50" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="admin-field">
          <label className="admin-label">Country</label>
          <input className="admin-input" value={form.country} onChange={(e) => field("country", e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-label">Priority</label>
          <input className="admin-input" value={form.priority} onChange={(e) => field("priority", e.target.value)} placeholder="low / medium / high" />
        </div>
      </div>
      {showNotes && (
        <div className="admin-field">
          <label className="admin-label">Notes</label>
          <textarea className="admin-textarea" value={form.notes} onChange={(e) => field("notes", e.target.value)} />
        </div>
      )}
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
