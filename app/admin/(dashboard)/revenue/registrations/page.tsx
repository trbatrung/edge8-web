import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Registrations",
  description: "Event and program registrations.",
};

// Revenue office: event registrations. Each links to its person 360 when known.
type P = { full_name: string | null; email: string };
type Pr = { title: string | null };
type Registration = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string | null;
  created_at: string;
  person_id: string | null;
  people: P | P[] | null;
  products: Pr | Pr[] | null;
};

const one = <T,>(e: T | T[] | null): T | null => (Array.isArray(e) ? e[0] ?? null : e);
const PAGE_SIZE = 25;
const SORTABLE = new Set(["created_at"]);

export default async function RegistrationsPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const { rows, total, pageSize, error } = await listEntity<Registration>(
    "event_registrations",
    "id, attendee_name, attendee_email, status, created_at, person_id, people(full_name, email), products(title)",
    { page, pageSize: PAGE_SIZE, search: q, searchColumns: ["attendee_name", "attendee_email"], sort, dir },
  );

  const columns: Column<Registration>[] = [
    {
      key: "attendee",
      header: "Attendee",
      cell: (r) => {
        const p = one(r.people);
        const label = r.attendee_name || p?.full_name || "View";
        return r.person_id ? (
          <Link href={`/admin/contacts/${r.person_id}`} className="admin-cell-strong">
            {label}
          </Link>
        ) : (
          <span className="admin-cell-strong">{r.attendee_name || p?.full_name || "—"}</span>
        );
      },
    },
    { key: "email", header: "Email", cell: (r) => <span className="admin-cell-muted">{r.attendee_email || one(r.people)?.email || "—"}</span> },
    { key: "product", header: "Product", cell: (r) => one(r.products)?.title || <span className="admin-cell-muted">—</span> },
    { key: "status", header: "Status", cell: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{humanize(r.status)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "created_at", header: "Added", sortable: true, cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHead eyebrow="Revenue" title="Registrations" sub={`${total.toLocaleString()} registrations`} />
      {error && <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>{error}</div>}
      <DataTable columns={columns} rows={rows} total={total} page={page} pageSize={pageSize} sort={sort} dir={dir} basePath="/admin/revenue/registrations" searchParams={searchParams} searchPlaceholder="Search attendee…" emptyText="No registrations match." />
    </>
  );
}
