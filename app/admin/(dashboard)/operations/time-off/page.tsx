import { companyOs } from "@/lib/supabase";
import { PageHead } from "@/components/admin/PageHead";
import { MetricCard } from "@/components/admin/MetricCard";
import { TimeOffBoard, type MemberOption, type RequestRow } from "./TimeOffBoard";

export const dynamic = "force-dynamic";

// Operations → Time Off. Admin-first: the acting admin manages requests for the
// whole team. Employee self-service (each person requests their own) arrives once
// people are linked to auth accounts (people.auth_user_id). Same table, wider access.

type Embedded<T> = T | T[] | null;
const one = <T,>(e: Embedded<T>): T | null => (Array.isArray(e) ? e[0] ?? null : e);

type Person = { full_name: string | null; email: string };
type MemberEmbed = { id: string; people: Embedded<Person> };

type TeamRow = { id: string; people: Embedded<Person> };
type TimeOffRow = {
  id: string;
  leave_type: string;
  status: string;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  reason: string | null;
  team_members: Embedded<MemberEmbed>;
};

function personName(p: Person | null): string {
  return p?.full_name || p?.email || "Unknown";
}

export default async function TimeOffPage() {
  const [teamRes, offRes] = await Promise.all([
    companyOs
      .from("team_members")
      .select("id, people!person_id(full_name, email)")
      .eq("status", "active"),
    companyOs
      .from("time_off")
      .select(
        "id, leave_type, status, start_date, end_date, is_half_day, reason, team_members!team_member_id(id, people!person_id(full_name, email))",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const members: MemberOption[] = ((teamRes.data ?? []) as TeamRow[])
    .map((t) => ({ id: t.id, name: personName(one(t.people)) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows: RequestRow[] = ((offRes.data ?? []) as TimeOffRow[]).map((r) => ({
    id: r.id,
    memberName: personName(one(one(r.team_members)?.people ?? null)),
    leaveType: r.leave_type,
    status: r.status,
    startDate: r.start_date,
    endDate: r.end_date,
    isHalfDay: r.is_half_day,
    reason: r.reason,
  }));

  const pending = rows.filter((r) => r.status === "requested").length;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.status === "approved" && r.endDate >= today).length;

  const error = teamRes.error?.message ?? offRes.error?.message ?? null;

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Time Off"
        sub="Request, approve, and track team leave."
      />

      {error && <div className="admin-alert admin-alert--err">{error}</div>}

      <div className="mp-kpi-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Pending requests" value={pending} />
        <MetricCard label="Upcoming approved" value={upcoming} />
        <MetricCard label="Active team" value={members.length} />
      </div>

      <TimeOffBoard members={members} rows={rows} />
    </>
  );
}
