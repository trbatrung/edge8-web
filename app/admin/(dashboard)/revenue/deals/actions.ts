"use server";

import { revalidatePath } from "next/cache";
import { companyOs } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

type Result = { ok: true } | { ok: false; error: string };

// Move a deal to a pipeline stage. Landing on a won/lost stage also flips the
// deal's status and stamps closed_at, so the close-rate metrics stay truthful.
export async function moveDealStage(dealId: string, toStageId: string): Promise<Result> {
  await requireAdmin();

  const { data: stage, error: stageErr } = await companyOs
    .from("pipeline_stages")
    .select("is_won, is_lost")
    .eq("id", toStageId)
    .maybeSingle();
  if (stageErr || !stage) return { ok: false, error: stageErr?.message ?? "Unknown stage." };

  const status = stage.is_won ? "won" : stage.is_lost ? "lost" : "open";
  const closed_at = stage.is_won || stage.is_lost ? new Date().toISOString() : null;

  const { error } = await companyOs
    .from("deals")
    .update({ stage_id: toStageId, status, closed_at })
    .eq("id", dealId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/revenue/deals");
  return { ok: true };
}
