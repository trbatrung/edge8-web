import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

// Talent office: applications across all reqs. Candidate -> Contact 360,
// Job req -> the req's hiring board.
type P = { full_name: string | null; email: string };
type Cand = { person_id: string | null; people: P | P[] | null };
type Jr = { title: string | null };
type St = { name: string | null };
type Application = {
  id: string;
  status: string | null;
  rating: number | null;
  applied_at: string | null;
  decided_at: string | null;
  candidate_id: string | null;
  job_requisition_id: string | null;
  created_at: string;
  candidates: Cand | Cand[] | null;
  job_requisitions: Jr | Jr[] | null;
  application_stages: St | St[] | null;
};

const one = <T,>(e: T | T[] | null): T | null => (Array.isArray(e) ? e[0] ?? null : e);
const PAGE_SIZE = 25;
const SORTABLE = new Set(["applied_at", "created_at", "rating"]);

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const { rows, total, pageSize, error } = await listEntity<Application>(
    "applications",
    "id, status, rating, applied_at, decided_at, candidate_id, job_requisition_id, created_at, candidates(person_id, people!person_id(full_name, email)), job_requisitions(title), application_stages(name)",
    { page, pageSize: PAGE_SIZE, search: q, searchColumns: ["source"], sort, dir },
  );

  const columns: Column<Application>[] = [
    {
      key: "candidate",
      header: "Candidate",
      cell: (r) => {
        const cand = one(r.candidates);
        const p = one(cand?.people ?? null);
        const label = p?.full_name || p?.email || "View";
        return cand?.person_id ? (
          <Link href={`/admin/contacts/${cand.person_id}`} className="admin-cell-strong">{label}</Link>
        ) : (
          <span className="admin-cell-strong">{label}</span>
        );
      },
    },
    {
      key: "req",
      header: "Job req",
      cell: (r) =>
        r.job_requisition_id ? (
          <Link href={`/admin/talent/jobs/${r.job_requisition_id}`} className="admin-cell-strong">
            {one(r.job_requisitions)?.title || "View"}
          </Link>
        ) : (
          <span className="admin-cell-muted">—</span>
        ),
    },
    { key: "stage", header: "Stage", cell: (r) => one(r.application_stages)?.name || <span className="admin-cell-muted">—</span> },
    { key: "status", header: "Status", cell: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{humanize(r.status)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "rating", header: "Rating", sortable: true, cell: (r) => (r.rating != null ? `${r.rating}★` : <span className="admin-cell-muted">—</span>) },
    { key: "applied_at", header: "Applied", sortable: true, cell: (r) => (r.applied_at ? formatDate(r.applied_at) : <span className="admin-cell-muted">—</span>) },
    { key: "decided_at", header: "Decided", cell: (r) => (r.decided_at ? formatDate(r.decided_at) : <span className="admin-cell-muted">—</span>) },
  ];

  return (
    <>
      <PageHead eyebrow="Talent" title="Applications" sub={`${total.toLocaleString()} applications`} />
      {error && <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>{error}</div>}
      <DataTable columns={columns} rows={rows} total={total} page={page} pageSize={pageSize} sort={sort} dir={dir} basePath="/admin/talent/applications" searchParams={searchParams} searchPlaceholder="Search source…" emptyText="No applications match." />
    </>
  );
}
