import Link from "next/link";
import { notFound } from "next/navigation";
import { companyOs } from "@/lib/supabase";
import { PageHead } from "@/components/admin/PageHead";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Candidate",
  description: "One candidate's profile and application history.",
};

const one = <T,>(e: T | T[] | null): T | null => (Array.isArray(e) ? e[0] ?? null : e);

type P = { id: string; full_name: string | null; email: string; phone: string | null; linkedin_url: string | null };
type Co = { name: string | null };
type CandidateRow = {
  id: string;
  headline: string | null;
  current_title: string | null;
  pool_status: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  availability: string | null;
  notes: string | null;
  resume_document_id: string | null;
  person_id: string | null;
  people: P | P[] | null;
  companies: Co | Co[] | null;
};
type Jr = { title: string | null };
type St = { name: string | null };
type AppRow = {
  id: string;
  status: string | null;
  rating: number | null;
  applied_at: string | null;
  job_requisition_id: string | null;
  job_requisitions: Jr | Jr[] | null;
  application_stages: St | St[] | null;
};

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const candRes = await companyOs
    .from("candidates")
    .select(
      "id, headline, current_title, pool_status, linkedin_url, portfolio_url, availability, notes, resume_document_id, person_id, people!person_id(id, full_name, email, phone, linkedin_url), companies(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (candRes.error || !candRes.data) notFound();
  const cand = candRes.data as CandidateRow;
  const person = one(cand.people);

  const appsRes = await companyOs
    .from("applications")
    .select("id, status, rating, applied_at, job_requisition_id, job_requisitions(title), application_stages(name)")
    .eq("candidate_id", id)
    .order("created_at", { ascending: false });
  const apps = (appsRes.data ?? []) as AppRow[];

  const co = one(cand.companies)?.name ?? null;
  const linkedin = cand.linkedin_url || person?.linkedin_url || null;

  return (
    <>
      <PageHead
        eyebrow={<Link href="/admin/talent/candidates">← Candidates</Link>}
        title={person?.full_name || person?.email || "Candidate"}
        sub={cand.headline || undefined}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        {cand.pool_status && <Badge tone={statusTone(cand.pool_status)}>{humanize(cand.pool_status)}</Badge>}
        {cand.resume_document_id && (
          <a className="admin-btn admin-btn--primary" href={`/admin/talent/resume/${cand.resume_document_id}`} target="_blank" rel="noreferrer">
            View resume
          </a>
        )}
        {cand.person_id && (
          <Link className="admin-btn" href={`/admin/contacts/${cand.person_id}`}>Open Contact 360 →</Link>
        )}
      </div>

      <dl className="admin-kv">
        <dt>Email</dt>
        <dd>{person?.email || "—"}</dd>
        <dt>Phone</dt>
        <dd>{person?.phone || "—"}</dd>
        <dt>Current</dt>
        <dd>{cand.current_title ? (co ? `${cand.current_title} @ ${co}` : cand.current_title) : "—"}</dd>
        <dt>LinkedIn</dt>
        <dd>{linkedin ? <a href={linkedin} target="_blank" rel="noreferrer" className="admin-cell-strong">Profile ↗</a> : "—"}</dd>
        <dt>Portfolio</dt>
        <dd>{cand.portfolio_url ? <a href={cand.portfolio_url} target="_blank" rel="noreferrer" className="admin-cell-strong">Link ↗</a> : "—"}</dd>
        <dt>Availability</dt>
        <dd>{cand.availability || "—"}</dd>
      </dl>

      <div style={{ fontWeight: 700, fontSize: 15, margin: "24px 0 10px" }}>
        Applications · {apps.length}
      </div>
      {apps.length === 0 ? (
        <div className="admin-card" style={{ padding: "14px 16px" }}>
          <span className="admin-cell-muted">No applications yet.</span>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0 }}>
          {apps.map((a) => (
            <div
              key={a.id}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--admin-line)" }}
            >
              <Link href={`/admin/talent/jobs/${a.job_requisition_id}`} className="admin-cell-strong" style={{ flex: 1 }}>
                {one(a.job_requisitions)?.title || "Job req"}
              </Link>
              <span className="admin-cell-muted" style={{ fontSize: 13 }}>{one(a.application_stages)?.name || "—"}</span>
              {a.rating != null && <span className="admin-cell-muted" style={{ fontSize: 13 }}>{a.rating}★</span>}
              {a.status && <Badge tone={statusTone(a.status)}>{humanize(a.status)}</Badge>}
              <span className="admin-cell-muted" style={{ fontSize: 12.5, width: 90, textAlign: "right" }}>
                {a.applied_at ? formatDate(a.applied_at) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {cand.notes && (
        <div style={{ marginTop: 22 }}>
          <div className="admin-label" style={{ marginBottom: 4 }}>Recruiter notes</div>
          <div className="admin-card" style={{ padding: "14px 16px", whiteSpace: "pre-wrap", fontSize: 14 }}>{cand.notes}</div>
        </div>
      )}
    </>
  );
}
