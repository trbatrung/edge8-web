// The ONLY sanctioned path for /team code to read company_os. Every /team page
// and server action must go through here (or an equally-scoped helper) rather
// than importing the service-role `companyOs` client directly — a lint rule
// enforces that ban. The service-role key bypasses RLS, so a single unscoped
// query would leak the whole company; funnelling reads through one helper that
// injects the actor's scope filter makes that structurally impossible.

import { companyOs } from "@/lib/supabase";
import type { TeamActor } from "@/lib/team-auth";

// Tables /team may read, and the column + scope each is filtered on. A table not
// listed here cannot be read from /team. Expand this deliberately, one table per
// slice, always with an explicit scope key. `team_member` filters by
// actor.teamMemberScope; `person` by actor.personScope.
type ScopeKind = "team_member" | "person";
const SCOPE_ALLOWLIST: Record<string, { column: string; scope: ScopeKind }> = {
  time_off: { column: "team_member_id", scope: "team_member" },
};

function scopeIds(actor: TeamActor, scope: ScopeKind): string[] {
  return scope === "team_member" ? actor.teamMemberScope : actor.personScope;
}

// Scoped read: returns a query builder already filtered to the actor's scope.
// Chain further .eq/.order/.limit as needed; the scope filter cannot be removed.
export function teamRead(actor: TeamActor, table: keyof typeof SCOPE_ALLOWLIST, select: string) {
  const cfg = SCOPE_ALLOWLIST[table];
  if (!cfg) throw new Error(`teamRead: '${table}' is not in the /team scope allowlist`);
  return companyOs.from(table).select(select).in(cfg.column, scopeIds(actor, cfg.scope));
}

// The actor's OWN employment summary (self-scoped by construction: filtered on
// actor.teamMemberId, which comes from the JWT-derived actor, never client input).
// Department/position/manager are reference labels, safe for the employee to see.
type PersonLite = { full_name: string | null; preferred_name: string | null; email: string; phone: string | null };
type ManagerName = { full_name: string | null; preferred_name: string | null };
export type OwnProfile = {
  id: string;
  employee_number: string | null;
  employment_type: string | null;
  work_location: string | null;
  status: string | null;
  start_date: string | null;
  person: PersonLite | null;
  departmentName: string | null;
  positionTitle: string | null;
  managerName: string | null;
};

// PostgREST returns to-one embeds as an object, but can surface arrays; normalize.
const one = <T,>(e: T | T[] | null | undefined): T | null =>
  Array.isArray(e) ? e[0] ?? null : e ?? null;

function nameOf(p: ManagerName | null): string | null {
  return p ? p.preferred_name || p.full_name : null;
}

export async function getOwnProfile(actor: TeamActor): Promise<OwnProfile | null> {
  const { data } = await companyOs
    .from("team_members")
    .select(
      "id, employee_number, employment_type, work_location, status, start_date, " +
        "people:people!person_id(full_name, preferred_name, email, phone), " +
        "departments:departments!department_id(name), " +
        "positions:positions!position_id(title), " +
        "manager:team_members!manager_id(people:people!person_id(full_name, preferred_name))",
    )
    .eq("id", actor.teamMemberId)
    .maybeSingle();
  if (!data) return null;
  const r = data as unknown as Record<string, unknown>;
  const dept = one(r.departments as { name: string | null } | { name: string | null }[] | null);
  const pos = one(r.positions as { title: string | null } | { title: string | null }[] | null);
  const mgr = one(r.manager as { people: ManagerName | ManagerName[] | null } | { people: ManagerName | ManagerName[] | null }[] | null);
  return {
    id: r.id as string,
    employee_number: (r.employee_number as string | null) ?? null,
    employment_type: (r.employment_type as string | null) ?? null,
    work_location: (r.work_location as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    start_date: (r.start_date as string | null) ?? null,
    person: one(r.people as PersonLite | PersonLite[] | null),
    departmentName: dept?.name ?? null,
    positionTitle: pos?.title ?? null,
    managerName: nameOf(one(mgr?.people ?? null)),
  };
}

// Ownership assertion for id-taking mutations: confirms a target row belongs to
// the actor's scope BEFORE the caller mutates it. Closes IDOR — an action must
// never trust a client-supplied id as the authorization subject. Returns the
// row's scope id when in scope, or null when the row is missing or out of scope.
export async function assertInScope(
  actor: TeamActor,
  table: keyof typeof SCOPE_ALLOWLIST,
  id: string,
): Promise<string | null> {
  const cfg = SCOPE_ALLOWLIST[table];
  if (!cfg) throw new Error(`assertInScope: '${table}' is not in the /team scope allowlist`);
  const { data } = await companyOs.from(table).select(`${cfg.column}`).eq("id", id).maybeSingle();
  if (!data) return null;
  const owner = (data as unknown as Record<string, string>)[cfg.column];
  return scopeIds(actor, cfg.scope).includes(owner) ? owner : null;
}
