"use server";

import { revalidatePath } from "next/cache";
import { companyOs } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { recordTransition } from "@/lib/lifecycle";

type Result = { ok: true } | { ok: false; error: string };

const LOST_REASONS = new Set([
  "price",
  "competitor",
  "no_decision",
  "bad_fit",
  "bad_timing",
  "ghosted",
  "other",
]);
const HANDOFF_REJECT_REASONS = new Set([
  "not_qualified",
  "bad_fit",
  "duplicate",
  "bad_timing",
  "other",
]);

function refresh() {
  revalidatePath("/admin/revenue/deals");
  revalidatePath("/admin/revenue/leads");
}

// When a deal closes, the person's lifecycle follows: won → customer; lost →
// back to nurture unless they're already a customer or have another open deal.
async function syncPersonAfterClose(dealId: string, personId: string | null, won: boolean) {
  if (!personId) return;
  const { data: person } = await companyOs
    .from("people")
    .select("lifecycle_stage, lead_status")
    .eq("id", personId)
    .maybeSingle();
  if (!person) return;

  if (won) {
    if (person.lifecycle_stage === "customer") return;
    await companyOs
      .from("people")
      .update({ lifecycle_stage: "customer", lead_status: null, lead_sla_due_at: null })
      .eq("id", personId);
    await recordTransition({
      personId,
      fromStage: person.lifecycle_stage,
      toStage: "customer",
      fromStatus: person.lead_status,
      toStatus: null,
      reason: "deal_won",
    });
    return;
  }

  if (person.lifecycle_stage === "customer") return;
  const { count } = await companyOs
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("person_id", personId)
    .eq("status", "open")
    .neq("id", dealId);
  if ((count ?? 0) > 0) return;

  await companyOs
    .from("people")
    .update({ lifecycle_stage: "lead", lead_status: "nurture" })
    .eq("id", personId);
  await recordTransition({
    personId,
    fromStage: person.lifecycle_stage,
    toStage: "lead",
    fromStatus: person.lead_status,
    toStatus: "nurture",
    reason: "deal_lost",
  });
}

// Move a deal to a pipeline stage. Landing on a won/lost stage also flips the
// deal's status and stamps closed_at, so the close-rate metrics stay truthful.
// Losing a deal requires an enumerated reason.
export async function moveDealStage(
  dealId: string,
  toStageId: string,
  lostReason?: string,
): Promise<Result> {
  await requireAdmin();

  const { data: stage, error: stageErr } = await companyOs
    .from("pipeline_stages")
    .select("is_won, is_lost")
    .eq("id", toStageId)
    .maybeSingle();
  if (stageErr || !stage) return { ok: false, error: stageErr?.message ?? "Unknown stage." };

  if (stage.is_lost && (!lostReason || !LOST_REASONS.has(lostReason))) {
    return { ok: false, error: "Losing a deal needs a reason." };
  }

  const status = stage.is_won ? "won" : stage.is_lost ? "lost" : "open";
  const closed_at = stage.is_won || stage.is_lost ? new Date().toISOString() : null;

  const updates: Record<string, unknown> = { stage_id: toStageId, status, closed_at };
  if (stage.is_lost) updates.lost_reason = lostReason;

  const { data: deal, error } = await companyOs
    .from("deals")
    .update(updates)
    .eq("id", dealId)
    .select("person_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  if (stage.is_won || stage.is_lost) {
    await syncPersonAfterClose(dealId, deal?.person_id ?? null, stage.is_won);
  }

  refresh();
  return { ok: true };
}

// The closer's side of the SDR handoff contract. Reject sends the person back
// to the SDR queue and closes the deal; the reason feeds SDR coaching.
export async function decideHandoff(
  dealId: string,
  decision: "accepted" | "rejected",
  reason?: string,
  note?: string,
): Promise<Result> {
  await requireAdmin();

  if (decision === "rejected" && (!reason || !HANDOFF_REJECT_REASONS.has(reason))) {
    return { ok: false, error: "Rejecting a handoff needs a reason." };
  }

  const { data: deal, error: dErr } = await companyOs
    .from("deals")
    .select("person_id, handoff_status")
    .eq("id", dealId)
    .maybeSingle();
  if (dErr || !deal) return { ok: false, error: dErr?.message ?? "Deal not found." };
  if (deal.handoff_status !== "pending") return { ok: false, error: "Handoff already decided." };

  const updates: Record<string, unknown> = {
    handoff_status: decision,
    handoff_decided_at: new Date().toISOString(),
    handoff_note: note?.trim() || null,
  };
  if (decision === "rejected") {
    updates.handoff_rejected_reason = reason;
    updates.status = "lost";
    updates.closed_at = new Date().toISOString();
    updates.lost_reason = "bad_fit";
  }

  const { error } = await companyOs.from("deals").update(updates).eq("id", dealId);
  if (error) return { ok: false, error: error.message };

  if (decision === "rejected" && deal.person_id) {
    const { data: person } = await companyOs
      .from("people")
      .select("lifecycle_stage, lead_status")
      .eq("id", deal.person_id)
      .maybeSingle();
    await companyOs
      .from("people")
      .update({ lifecycle_stage: "sql", lead_status: "connected" })
      .eq("id", deal.person_id);
    await recordTransition({
      personId: deal.person_id,
      fromStage: person?.lifecycle_stage ?? null,
      toStage: "sql",
      fromStatus: person?.lead_status ?? null,
      toStatus: "connected",
      reason: "handoff_rejected",
      note: reason,
    });
  }

  refresh();
  return { ok: true };
}

export async function saveNextStep(
  dealId: string,
  nextStep: string,
  nextStepDate: string,
): Promise<Result> {
  await requireAdmin();

  const { error } = await companyOs
    .from("deals")
    .update({
      next_step: nextStep.trim() || null,
      next_step_date: nextStepDate || null,
    })
    .eq("id", dealId);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}
