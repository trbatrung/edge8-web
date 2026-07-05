import Link from "next/link";
import { listEntity } from "@/lib/admin/query";
import { getActiveBrandId } from "@/lib/admin/brand";
import { PageHead } from "@/components/admin/PageHead";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Badge } from "@/components/admin/Badge";
import { ArchivedToggle } from "@/components/admin/ArchivedToggle";
import { formatDate, humanize } from "@/lib/admin/format";
import { firstParam, type SearchParamsObj } from "@/lib/admin/url";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contacts",
  description: "Every person in the Company Database, one searchable contact spine.",
};

type Person = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  persona: string | null;
  source: string | null;
  do_not_contact: boolean | null;
  is_team_member: boolean | null;
  archived_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;
const SORTABLE = new Set(["full_name", "email", "created_at"]);

export default async function ContactsPage({ searchParams }: { searchParams: SearchParamsObj }) {
  const brandId = getActiveBrandId();
  const page = Math.max(1, Number(firstParam(searchParams.page) ?? "1") || 1);
  const q = firstParam(searchParams.q) ?? "";
  const sortParam = firstParam(searchParams.sort);
  const sort = sortParam && SORTABLE.has(sortParam) ? sortParam : "created_at";
  const dir = firstParam(searchParams.dir) === "asc" ? "asc" : "desc";
  const showArchived = firstParam(searchParams.archived) === "1";

  const { rows, total, pageSize, error } = await listEntity<Person>(
    "people",
    "id, full_name, email, phone, persona, source, do_not_contact, is_team_member, archived_at, created_at",
    {
      page,
      pageSize: PAGE_SIZE,
      search: q,
      searchColumns: ["full_name", "email", "phone"],
      sort,
      dir,
      excludeArchived: !showArchived,
      filters: brandId ? { source_brand_id: brandId } : undefined,
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
    { key: "phone", header: "Phone", cell: (r) => r.phone || <span className="admin-cell-muted">—</span> },
    {
      key: "persona",
      header: "Persona",
      cell: (r) => (r.persona ? <Badge>{humanize(r.persona)}</Badge> : <span className="admin-cell-muted">—</span>),
    },
    { key: "source", header: "Source", cell: (r) => <span className="admin-cell-muted">{r.source || "—"}</span> },
    {
      key: "flags",
      header: "Flags",
      cell: (r) => (
        <span style={{ display: "inline-flex", gap: 4 }}>
          {r.archived_at && <Badge tone="neutral">Archived</Badge>}
          {r.do_not_contact && <Badge tone="err">Do not contact</Badge>}
          {r.is_team_member && <Badge tone="info">Team</Badge>}
        </span>
      ),
    },
    { key: "created_at", header: "Added", sortable: true, cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <PageHead
        eyebrow="Spine"
        title="Contacts"
        sub={`${total.toLocaleString()} ${total === 1 ? "person" : "people"}${showArchived ? " · showing archived" : ""} in the Company Database`}
        action={
          <ArchivedToggle basePath="/admin/contacts" searchParams={searchParams} showArchived={showArchived} />
        }
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
        basePath="/admin/contacts"
        searchParams={searchParams}
        searchPlaceholder="Search name, email, or phone…"
        emptyText="No contacts match."
      />
    </>
  );
}
