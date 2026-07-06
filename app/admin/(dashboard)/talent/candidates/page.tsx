import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Candidates",
  description: "The talent pool and applicant records.",
};

// Talent office: candidates (persona=job_seeker). Name opens the recruiting
// Candidate detail; resume links to the signed-URL route handler.
type P = { full_name: string | null; email: string };
type Co = { name: string | null };
type Candidate = {
  id: string;
  headline: string | null;
  current_title: string | null;
  pool_status: string | null;
  linkedin_url: string | null;
  resume_document_id: string | null;
  person_id: string | null;
  created_at: string;
  people: P | P[] | null;
  companies: Co | Co[] | null;
};

const one = <T,>(e: T | T[] | null): T | null => (Array.isArray(e) ? e[0] ?? null : e);
const PAGE_SIZE = 25;
const SORTABLE = new Set(["created_at", "pool_status", "headline", "current_title"]);

export default async function CandidatesPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const { rows, total, pageSize, error } = await listEntity<Candidate>(
    "candidates",
    "id, headline, current_title, pool_status, linkedin_url, resume_document_id, person_id, created_at, people!person_id(full_name, email), companies(name)",
    { page, pageSize: PAGE_SIZE, search: q, searchColumns: ["headline", "current_title"], sort, dir },
  );

  const columns: Column<Candidate>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => {
        const p = one(r.people);
        return (
          <Link href={`/admin/talent/candidates/${r.id}`} className="admin-cell-strong">
            {p?.full_name || p?.email || "(no name)"}
          </Link>
        );
      },
    },
    { key: "headline", header: "Headline", sortable: true, cell: (r) => r.headline || <span className="admin-cell-muted">—</span> },
    {
      key: "current_title",
      header: "Current",
      sortable: true,
      cell: (r) => {
        const co = one(r.companies)?.name;
        const t = r.current_title;
        return t ? <span>{co ? `${t} @ ${co}` : t}</span> : <span className="admin-cell-muted">—</span>;
      },
    },
    { key: "pool_status", header: "Pool", sortable: true, cell: (r) => (r.pool_status ? <Badge tone={statusTone(r.pool_status)}>{humanize(r.pool_status)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "linkedin", header: "LinkedIn", cell: (r) => (r.linkedin_url ? <a href={r.linkedin_url} target="_blank" rel="noreferrer" className="admin-cell-strong">in ↗</a> : <span className="admin-cell-muted">—</span>) },
    { key: "resume", header: "Resume", cell: (r) => (r.resume_document_id ? <a href={`/admin/talent/resume/${r.resume_document_id}`} target="_blank" rel="noreferrer" className="admin-cell-strong">📎</a> : <span className="admin-cell-muted">—</span>) },
    { key: "created_at", header: "Added", sortable: true, cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHead eyebrow="Talent" title="Candidates" sub={`${total.toLocaleString()} candidates in the pool`} />
      {error && <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>{error}</div>}
      <DataTable columns={columns} rows={rows} total={total} page={page} pageSize={pageSize} sort={sort} dir={dir} basePath="/admin/talent/candidates" searchParams={searchParams} searchPlaceholder="Search headline or title…" emptyText="No candidates match." />
    </>
  );
}
