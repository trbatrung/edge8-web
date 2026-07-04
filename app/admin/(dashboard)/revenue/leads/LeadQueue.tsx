"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import {
  bookMeetingAndHandOff,
  disqualifyLead,
  logCall,
  markConnected,
  saveQualification,
} from "./actions";

export type QueueRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string | null;
  stage: string;
  status: string;
  slaDueAt: string | null;
  attemptCount: number;
  inquiry: { subject: string | null; message: string | null; createdAt: string } | null;
  qual: {
    goal: string;
    plan: string;
    challenge: string;
    timeline: string;
    budget: string;
    authority: string;
  };
};

const DISQUALIFY_REASONS = [
  ["no_budget", "No budget"],
  ["no_need", "No need"],
  ["bad_timing", "Bad timing"],
  ["no_authority", "No authority"],
  ["unresponsive", "Unresponsive"],
  ["competitor", "Chose competitor"],
  ["not_icp", "Not our ICP"],
  ["other", "Other"],
] as const;

const GPCT_FIELDS = [
  ["goal", "Goal"],
  ["plan", "Plan"],
  ["challenge", "Challenge"],
  ["timeline", "Timeline"],
  ["budget", "Budget"],
  ["authority", "Authority"],
] as const;

function slaBadge(slaDueAt: string | null) {
  if (!slaDueAt) return null;
  const mins = Math.round((new Date(slaDueAt).getTime() - Date.now()) / 60000);
  if (mins < 0) {
    const h = Math.floor(-mins / 60);
    return <Badge tone="err">SLA overdue {h > 0 ? `${h}h` : `${-mins}m`}</Badge>;
  }
  if (mins < 60) return <Badge tone="err">Respond in {mins}m</Badge>;
  return <Badge tone="warn">Respond in {Math.round(mins / 60)}h</Badge>;
}

function statusBadge(status: string) {
  const tone =
    status === "meeting_booked" ? "ok" : status === "connected" ? "info" : "neutral";
  return <Badge tone={tone}>{humanize(status)}</Badge>;
}

export function LeadQueue({ rows }: { rows: QueueRow[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null);
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setBanner(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setBanner(r.error);
      else router.refresh();
    });
  }

  if (rows.length === 0) {
    return <div className="admin-empty">Queue is clear. Promote people from Contacts, or wait for inbound.</div>;
  }

  return (
    <>
      {banner && (
        <div className="admin-alert admin-alert--err" style={{ marginBottom: 12 }}>
          {banner}
        </div>
      )}
      <div className="admin-list">
        {rows.map((r) => {
          const open = openId === r.id;
          return (
            <div key={r.id} className="admin-card" style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : r.id)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 12,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="admin-list-title">
                    {r.name}
                    {r.company ? <span className="admin-cell-muted"> · {r.company}</span> : null}
                  </div>
                  <div className="admin-list-sub">
                    {r.inquiry?.subject || r.inquiry?.message || r.source || r.email}
                  </div>
                </div>
                {slaBadge(r.slaDueAt)}
                {statusBadge(r.status)}
                <span className="admin-cell-muted" style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  {r.attemptCount > 0 ? `attempt ${r.attemptCount}` : "no attempts"}
                </span>
              </button>

              {open && (
                <LeadDetail row={r} pending={pending} run={run} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function LeadDetail({
  row,
  pending,
  run,
}: {
  row: QueueRow;
  pending: boolean;
  run: (a: () => Promise<{ ok: true } | { ok: false; error: string }>) => void;
}) {
  const [qual, setQual] = useState(row.qual);
  const [callNote, setCallNote] = useState("");
  const [reason, setReason] = useState("");
  const [dqNote, setDqNote] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const capturedCount = GPCT_FIELDS.filter(([k]) => qual[k].trim()).length;

  return (
    <div style={{ borderTop: "1px solid var(--admin-border, #e5e7eb)", marginTop: 12, paddingTop: 12 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="admin-cell-muted">
          <Link href={`/admin/contacts/${row.id}`} className="admin-cell-strong">
            Open contact
          </Link>
        </span>
        <span className="admin-cell-muted">{row.email}</span>
        {row.phone && <span className="admin-cell-muted">{row.phone}</span>}
        {row.inquiry && (
          <span className="admin-cell-muted">
            Inbound {formatDate(row.inquiry.createdAt)}
          </span>
        )}
      </div>

      {row.inquiry?.message && (
        <p className="admin-list-sub" style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>
          {row.inquiry.message}
        </p>
      )}

      <div className="admin-label" style={{ marginBottom: 6 }}>
        Qualification (GPCT) · {capturedCount}/6 captured
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {GPCT_FIELDS.map(([key, label]) => (
          <label key={key} className="admin-field" style={{ margin: 0 }}>
            <span className="admin-label">{label}</span>
            <input
              className="admin-input"
              value={qual[key]}
              placeholder={`Not captured`}
              onChange={(e) => setQual((q) => ({ ...q, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          className="admin-btn"
          disabled={pending}
          onClick={() => {
            run(() => saveQualification(row.id, qual));
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
          }}
        >
          {savedFlash ? "Saved" : "Save qualification"}
        </button>
      </div>

      <div className="admin-label" style={{ marginBottom: 6 }}>
        Work it
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <input
          className="admin-input"
          style={{ maxWidth: 320 }}
          placeholder="Call note (optional)"
          value={callNote}
          onChange={(e) => setCallNote(e.target.value)}
        />
        <button
          type="button"
          className="admin-btn"
          disabled={pending}
          onClick={() => {
            run(() => logCall(row.id, callNote));
            setCallNote("");
          }}
        >
          Log call
        </button>
        <button
          type="button"
          className="admin-btn"
          disabled={pending || row.status === "connected"}
          onClick={() => run(() => markConnected(row.id))}
        >
          Connected
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={pending}
          onClick={() => run(() => bookMeetingAndHandOff(row.id))}
        >
          Book meeting and hand off
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select
          className="admin-input"
          style={{ maxWidth: 200 }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Disqualify reason…</option>
          {DISQUALIFY_REASONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          className="admin-input"
          style={{ maxWidth: 240 }}
          placeholder="Note (optional)"
          value={dqNote}
          onChange={(e) => setDqNote(e.target.value)}
        />
        <button
          type="button"
          className="admin-btn"
          disabled={pending || !reason}
          onClick={() => run(() => disqualifyLead(row.id, reason, "nurture", dqNote))}
        >
          Send to nurture
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          disabled={pending || !reason}
          onClick={() => run(() => disqualifyLead(row.id, reason, "unqualified", dqNote))}
        >
          Disqualify
        </button>
      </div>
    </div>
  );
}
