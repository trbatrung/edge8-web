import { companyOs } from "@/lib/supabase";

// Generic paginated/searchable/sortable reader over a company_os table.
// Always paginates at the DB (count: exact + range) so large tables (462 people,
// 285 applications) never ship in full to the client.

export type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  searchColumns?: string[];
  sort?: string;
  dir?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | (string | number)[]>;
  // For archivable tables (people, companies, deals): hide soft-deleted rows.
  excludeArchived?: boolean;
};

export type ListResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
};

export async function listEntity<T>(
  table: string,
  select: string,
  params: ListParams = {},
): Promise<ListResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;

  let q = companyOs
    .from(table)
    .select(select, { count: "exact" })
    .range(from, from + pageSize - 1);

  if (params.sort) q = q.order(params.sort, { ascending: params.dir !== "desc" });

  if (params.excludeArchived) q = q.is("archived_at", null);

  for (const [col, val] of Object.entries(params.filters ?? {})) {
    q = Array.isArray(val) ? q.in(col, val) : q.eq(col, val);
  }

  if (params.search && params.searchColumns?.length) {
    const term = params.search.replace(/[%,()]/g, " ").trim();
    if (term) {
      const or = params.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(",");
      q = q.or(or);
    }
  }

  const { data, count, error } = await q;
  return {
    rows: (data ?? []) as T[],
    total: count ?? 0,
    page,
    pageSize,
    error: error ? error.message : null,
  };
}
