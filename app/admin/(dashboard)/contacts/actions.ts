"use server";

import { revalidatePath } from "next/cache";
import { companyOs } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

type Result = { ok: true } | { ok: false; error: string };

export async function updatePerson(
  id: string,
  patch: {
    full_name?: string;
    phone?: string;
    persona?: string;
    linkedin_url?: string;
    notes?: string;
    do_not_contact?: boolean;
  },
): Promise<Result> {
  await requireAdmin();
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    clean[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  const { error } = await companyOs.from("people").update(clean).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin/contacts");
  return { ok: true };
}
