import { companyOs } from "./supabase";

// Lifecycle helpers for the HubSpot-style sales model: lifecycle_stage +
// lead_status live on people, and every change appends a row to
// company_os.lifecycle_transitions so funnel math and recycle history stay
// queryable. Server-only (companyOs uses the service key).

export type LifecycleStage =
  | "none"
  | "subscriber"
  | "lead"
  | "mql"
  | "sql"
  | "opportunity"
  | "customer"
  | "evangelist";

export type LeadStatus =
  | "new"
  | "attempting"
  | "connected"
  | "meeting_booked"
  | "open_deal"
  | "unqualified"
  | "nurture";

export const ACTIVE_LEAD_STAGES: LifecycleStage[] = ["lead", "mql", "sql"];
export const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  "new",
  "attempting",
  "connected",
  "meeting_booked",
];

type TransitionInput = {
  personId: string;
  fromStage?: string | null;
  toStage?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  reason?: string | null;
  note?: string | null;
  changedBy?: string | null;
};

export async function recordTransition(t: TransitionInput): Promise<void> {
  const { error } = await companyOs.from("lifecycle_transitions").insert({
    person_id: t.personId,
    from_stage: t.fromStage ?? null,
    to_stage: t.toStage ?? null,
    from_status: t.fromStatus ?? null,
    to_status: t.toStatus ?? null,
    reason: t.reason ?? null,
    note: t.note ?? null,
    changed_by: t.changedBy ?? null,
  });
  if (error) console.error("lifecycle_transitions insert failed:", error.message);
}

export type PromoteResult =
  | { ok: true; promoted: boolean }
  | { ok: false; error: string };

// Promote a person into the SDR queue. Idempotent: a person already being
// worked (or already an opportunity/customer) is left alone, so double
// submits and repeat inquiries never demote anyone or duplicate transitions.
export async function promotePersonToLead(
  personId: string,
  opts: { slaHours?: number; reason?: string; changedBy?: string | null } = {},
): Promise<PromoteResult> {
  const { data: person, error } = await companyOs
    .from("people")
    .select("id, lifecycle_stage, lead_status")
    .eq("id", personId)
    .maybeSingle();
  if (error || !person) return { ok: false, error: error?.message ?? "Person not found." };

  const stage = (person.lifecycle_stage ?? "none") as LifecycleStage;
  const status = person.lead_status as LeadStatus | null;

  if (["opportunity", "customer", "evangelist"].includes(stage)) {
    return { ok: true, promoted: false };
  }
  const alreadyActive =
    ACTIVE_LEAD_STAGES.includes(stage) &&
    (status === null || ACTIVE_LEAD_STATUSES.includes(status));
  if (alreadyActive) return { ok: true, promoted: false };

  const slaHours = opts.slaHours ?? 4;
  const slaDueAt = new Date(Date.now() + slaHours * 3600_000).toISOString();

  const { error: updErr } = await companyOs
    .from("people")
    .update({
      lifecycle_stage: "lead",
      lead_status: "new",
      lead_sla_due_at: slaDueAt,
      disqualified_reason: null,
    })
    .eq("id", personId);
  if (updErr) return { ok: false, error: updErr.message };

  await recordTransition({
    personId,
    fromStage: stage,
    toStage: "lead",
    fromStatus: status,
    toStatus: "new",
    reason: opts.reason ?? "promoted",
    changedBy: opts.changedBy ?? null,
  });
  return { ok: true, promoted: true };
}
