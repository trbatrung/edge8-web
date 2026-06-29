"use server";

import { revalidatePath } from "next/cache";
import { companyOs } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

type Result = { ok: true } | { ok: false; error: string };

// Move an application to a hiring stage on its job req's board. Landing on a
// terminal stage stamps decided_at; the recruiter still sets final status.
export async function moveApplicationStage(
  applicationId: string,
  toStageId: string,
  jobReqId: string,
): Promise<Result> {
  await requireAdmin();

  const { data: stage, error: stageErr } = await companyOs
    .from("application_stages")
    .select("is_terminal")
    .eq("id", toStageId)
    .maybeSingle();
  if (stageErr || !stage) return { ok: false, error: stageErr?.message ?? "Unknown stage." };

  const patch: Record<string, unknown> = { current_stage_id: toStageId };
  if (stage.is_terminal) patch.decided_at = new Date().toISOString();

  const { error } = await companyOs.from("applications").update(patch).eq("id", applicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/talent/jobs/${jobReqId}`);
  return { ok: true };
}
