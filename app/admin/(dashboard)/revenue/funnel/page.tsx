import { companyOs } from "@/lib/supabase";
import { PageHead } from "@/components/admin/PageHead";
import { MetricCard } from "@/components/admin/MetricCard";
import { humanize } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Funnel",
  description: "Conversion at every stage from inquiry to closed won.",
};

// The management system: conversion per arrow, computed entirely from
// enumerated transitions and deal outcomes. When a rate dips, coach the
// specific skill behind that arrow.

type StepCount = { label: string; last30: number; all: number };

async function countTransitions(filter: { reason?: string; toStatus?: string; toStage?: string }, sinceIso?: string) {
  let q = companyOs.from("lifecycle_transitions").select("id", { count: "exact", head: true });
  if (filter.reason) q = q.eq("reason", filter.reason);
  if (filter.toStatus) q = q.eq("to_status", filter.toStatus);
  if (filter.toStage) q = q.eq("to_stage", filter.toStage);
  if (sinceIso) q = q.gte("occurred_at", sinceIso);
  const { count } = await q;
  return count ?? 0;
}

async function countDeals(filter: { handoff?: string; status?: string }, sinceIso?: string) {
  let q = companyOs.from("deals").select("id", { count: "exact", head: true });
  if (filter.handoff) {
    q = q.eq("handoff_status", filter.handoff);
    if (sinceIso) q = q.gte("handoff_decided_at", sinceIso);
  }
  if (filter.status) {
    q = q.eq("status", filter.status);
    if (sinceIso) q = q.gte("closed_at", sinceIso);
  }
  return (await q).count ?? 0;
}

async function countInquiries(sinceIso?: string) {
  let q = companyOs.from("inquiries").select("id", { count: "exact", head: true });
  if (sinceIso) q = q.gte("created_at", sinceIso);
  return (await q).count ?? 0;
}

export default async function FunnelPage() {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    inquiries30, inquiriesAll,
    promoted30, promotedAll,
    worked30, workedAll,
    connected30, connectedAll,
    booked30, bookedAll,
    accepted30, acceptedAll,
    won30, wonAll,
  ] = await Promise.all([
    countInquiries(since), countInquiries(),
    countTransitions({ toStage: "lead", toStatus: "new" }, since), countTransitions({ toStage: "lead", toStatus: "new" }),
    countTransitions({ toStatus: "attempting" }, since), countTransitions({ toStatus: "attempting" }),
    countTransitions({ toStatus: "connected" }, since), countTransitions({ toStatus: "connected" }),
    countTransitions({ reason: "meeting_booked" }, since), countTransitions({ reason: "meeting_booked" }),
    countDeals({ handoff: "accepted" }, since), countDeals({ handoff: "accepted" }),
    countDeals({ status: "won" }, since), countDeals({ status: "won" }),
  ]);

  const steps: StepCount[] = [
    { label: "Inbound inquiries", last30: inquiries30, all: inquiriesAll },
    { label: "Promoted to lead", last30: promoted30, all: promotedAll },
    { label: "Worked (first attempt)", last30: worked30, all: workedAll },
    { label: "Connected", last30: connected30, all: connectedAll },
    { label: "Meeting booked (handed off)", last30: booked30, all: bookedAll },
    { label: "Accepted by closer", last30: accepted30, all: acceptedAll },
    { label: "Won", last30: won30, all: wonAll },
  ];

  const { data: dqRows } = await companyOs
    .from("lifecycle_transitions")
    .select("reason")
    .in("to_status", ["unqualified", "nurture"])
    .not("reason", "is", null)
    .limit(1000);
  const dqCounts = new Map<string, number>();
  for (const r of (dqRows as { reason: string }[] | null) ?? []) {
    dqCounts.set(r.reason, (dqCounts.get(r.reason) ?? 0) + 1);
  }
  const dq = [...dqCounts.entries()].sort((a, b) => b[1] - a[1]);

  const { data: rejRows } = await companyOs
    .from("deals")
    .select("handoff_rejected_reason")
    .eq("handoff_status", "rejected")
    .not("handoff_rejected_reason", "is", null)
    .limit(1000);
  const rejCounts = new Map<string, number>();
  for (const r of (rejRows as { handoff_rejected_reason: string }[] | null) ?? []) {
    rejCounts.set(r.handoff_rejected_reason, (rejCounts.get(r.handoff_rejected_reason) ?? 0) + 1);
  }
  const rej = [...rejCounts.entries()].sort((a, b) => b[1] - a[1]);

  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

  return (
    <>
      <PageHead
        eyebrow="Revenue"
        title="Funnel"
        sub="Conversion per arrow, from enumerated transitions. Coach the arrow that dips."
      />
      <div className="mp-kpi-grid" style={{ marginBottom: 16 }}>
        <MetricCard label="Inquiry → meeting (30d)" value={pct(booked30, inquiries30)} />
        <MetricCard label="Meeting → accepted (30d)" value={pct(accepted30, booked30)} />
        <MetricCard label="Accepted → won (all time)" value={pct(wonAll, acceptedAll)} />
        <MetricCard label="Won (30d)" value={won30} />
      </div>

      <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Last 30 days</th>
                <th>Step conversion</th>
                <th>All time</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={s.label}>
                  <td className="admin-cell-strong">{s.label}</td>
                  <td>{s.last30}</td>
                  <td className="admin-cell-muted">
                    {i === 0 ? "—" : pct(s.last30, steps[i - 1].last30)}
                  </td>
                  <td className="admin-cell-muted">{s.all}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div className="admin-card admin-section-card">
          <div className="admin-label" style={{ marginBottom: 8 }}>
            Disqualify and nurture reasons (all time)
          </div>
          {dq.length === 0 ? (
            <div className="admin-empty">No disqualifications logged yet.</div>
          ) : (
            <div className="admin-list">
              {dq.map(([reason, n]) => (
                <div className="admin-list-row" key={reason}>
                  <div className="admin-list-main">
                    <div className="admin-list-title">{humanize(reason)}</div>
                  </div>
                  <div className="admin-list-aside">{n}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="admin-card admin-section-card">
          <div className="admin-label" style={{ marginBottom: 8 }}>
            Handoff rejections (SDR coaching signal)
          </div>
          {rej.length === 0 ? (
            <div className="admin-empty">No rejected handoffs. Qualification is holding.</div>
          ) : (
            <div className="admin-list">
              {rej.map(([reason, n]) => (
                <div className="admin-list-row" key={reason}>
                  <div className="admin-list-main">
                    <div className="admin-list-title">{humanize(reason)}</div>
                  </div>
                  <div className="admin-list-aside">{n}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
