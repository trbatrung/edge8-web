import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";
import { InvitePortalButton } from "@/components/admin/InvitePortalButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team",
  description: "Edge8 team members and departments.",
};

// Talent office: internal team (persona=employee). Name opens the Contact 360.
type P = { full_name: string | null; email: string; auth_user_id: string | null };
type TeamMember = {
  id: string;
  employee_number: string | null;
  employment_type: string | null;
  work_location: string | null;
  status: string | null;
  start_date: string | null;
  created_at: string;
  person_id: string | null;
  people: P | P[] | null;
};

const one = <T,>(e: T | T[] | null): T | null => (Array.isArray(e) ? e[0] ?? null : e);
const PAGE_SIZE = 25;
const SORTABLE = new Set(["start_date", "created_at"]);

export default async function TeamPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const { rows, total, pageSize, error } = await listEntity<TeamMember>(
    "team_members",
    "id, employee_number, employment_type, work_location, status, start_date, created_at, person_id, people!person_id(full_name, email, auth_user_id)",
    { page, pageSize: PAGE_SIZE, search: q, searchColumns: ["employee_number"], sort, dir },
  );

  const columns: Column<TeamMember>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => {
        const p = one(r.people);
        return r.person_id ? (
          <Link href={`/admin/contacts/${r.person_id}`} className="admin-cell-strong">{p?.full_name || p?.email || "View"}</Link>
        ) : (
          <span className="admin-cell-muted">{p?.email || "—"}</span>
        );
      },
    },
    { key: "employee_number", header: "Employee #", cell: (r) => r.employee_number || <span className="admin-cell-muted">—</span> },
    { key: "employment_type", header: "Type", cell: (r) => (r.employment_type ? <Badge>{humanize(r.employment_type)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "work_location", header: "Location", cell: (r) => r.work_location || <span className="admin-cell-muted">—</span> },
    { key: "status", header: "Status", cell: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{humanize(r.status)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "start_date", header: "Started", sortable: true, cell: (r) => (r.start_date ? formatDate(r.start_date) : <span className="admin-cell-muted">—</span>) },
    {
      key: "portal",
      header: "Portal",
      cell: (r) =>
        r.person_id ? (
          <InvitePortalButton teamMemberId={r.id} provisioned={!!one(r.people)?.auth_user_id} />
        ) : (
          <span className="admin-cell-muted">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHead eyebrow="Talent" title="Team" sub={`${total.toLocaleString()} team members`} />
      {error && <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>{error}</div>}
      <DataTable columns={columns} rows={rows} total={total} page={page} pageSize={pageSize} sort={sort} dir={dir} basePath="/admin/talent/team" searchParams={searchParams} searchPlaceholder="Search employee #…" emptyText="No team members match." />
    </>
  );
}
