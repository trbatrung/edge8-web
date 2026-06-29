import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { getActiveBrandId } from "@/lib/admin/brand";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge } from "@/components/admin/Badge";
import { formatDate } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

// The Revenue office's people lens: the shared people spine filtered to the
// revenue personas (prospect = lead, client = customer). Rows link to the one
// canonical Contact 360 at /admin/contacts/[id], shared across every office.
const REVENUE_PERSONAS = ["prospect", "client"];

type Person = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  persona: string | null;
  source: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;
const SORTABLE = new Set(["full_name", "email", "created_at"]);

export default async function LeadsPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const brandId = getActiveBrandId();
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const filters: Record<string, string | (string | number)[]> = { persona: REVENUE_PERSONAS };
  if (brandId) filters.source_brand_id = brandId;

  const { rows, total, pageSize, error } = await listEntity<Person>(
    "people",
    "id, full_name, email, phone, persona, source, created_at",
    {
      page,
      pageSize: PAGE_SIZE,
      search: q,
      searchColumns: ["full_name", "email", "phone"],
      sort,
      dir,
      filters,
    },
  );

  const columns: Column<Person>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      cell: (r) => (
        <Link href={`/admin/contacts/${r.id}`} className="admin-cell-strong">
          {r.full_name || "(no name)"}
        </Link>
      ),
    },
    { key: "email", header: "Email", sortable: true, cell: (r) => <span className="admin-cell-muted">{r.email}</span> },
    {
      key: "persona",
      header: "Type",
      cell: (r) =>
        r.persona === "client" ? <Badge tone="ok">Customer</Badge> : <Badge tone="info">Lead</Badge>,
    },
    { key: "phone", header: "Phone", cell: (r) => r.phone || <span className="admin-cell-muted">—</span> },
    { key: "source", header: "Source", cell: (r) => <span className="admin-cell-muted">{r.source || "—"}</span> },
    { key: "created_at", header: "Added", sortable: true, cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHead
        eyebrow="Revenue"
        title="Leads & Customers"
        sub={`${total.toLocaleString()} ${total === 1 ? "person" : "people"} · prospects and clients`}
      />
      {error && (
        <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        sort={sort}
        dir={dir}
        basePath="/admin/revenue/leads"
        searchParams={searchParams}
        searchPlaceholder="Search name, email, or phone…"
        emptyText="No leads or customers match."
      />
    </>
  );
}
