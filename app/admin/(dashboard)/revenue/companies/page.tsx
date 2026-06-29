import { listEntity } from "@/lib/admin/query";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

// Revenue office: companies (accounts). Spine-level, brand-agnostic.
type Company = {
  id: string;
  name: string | null;
  domain: string | null;
  industry: string | null;
  size_band: string | null;
  country: string | null;
  priority: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;
const SORTABLE = new Set(["name", "created_at"]);

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";

  const { rows, total, pageSize, error } = await listEntity<Company>(
    "companies",
    "id, name, domain, industry, size_band, country, website, priority, created_at",
    { page, pageSize: PAGE_SIZE, search: q, searchColumns: ["name", "domain"], sort, dir },
  );

  const columns: Column<Company>[] = [
    { key: "name", header: "Name", sortable: true, cell: (r) => <span className="admin-cell-strong">{r.name || "(no name)"}</span> },
    { key: "domain", header: "Domain", cell: (r) => <span className="admin-cell-muted">{r.domain || "—"}</span> },
    { key: "industry", header: "Industry", cell: (r) => r.industry || <span className="admin-cell-muted">—</span> },
    { key: "size_band", header: "Size", cell: (r) => r.size_band || <span className="admin-cell-muted">—</span> },
    { key: "country", header: "Country", cell: (r) => r.country || <span className="admin-cell-muted">—</span> },
    { key: "priority", header: "Priority", cell: (r) => (r.priority ? <Badge>{humanize(r.priority)}</Badge> : <span className="admin-cell-muted">—</span>) },
    { key: "created_at", header: "Added", sortable: true, cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHead eyebrow="Revenue" title="Companies" sub={`${total.toLocaleString()} ${total === 1 ? "company" : "companies"}`} />
      {error && <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>{error}</div>}
      <DataTable columns={columns} rows={rows} total={total} page={page} pageSize={pageSize} sort={sort} dir={dir} basePath="/admin/revenue/companies" searchParams={searchParams} searchPlaceholder="Search name or domain…" emptyText="No companies match." />
    </>
  );
}
