"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { companyOs, supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/admin/audit";
import { findAuthUser } from "@/lib/admin/admins";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function refresh() {
  revalidatePath("/admin/settings/admins");
}

function siteOrigin(): string {
  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  return host ? `https://${host}` : "https://www.edge8.ai";
}

// Send the right email for the account's state: no login yet → Supabase invite
// (creates the auth user, link lets them set a password); existing login →
// password reset. Both land on /admin/reset-password via the auth callback.
async function sendAccessEmail(email: string): Promise<Result> {
  const redirectTo = `${siteOrigin()}/api/auth/callback?next=/admin/reset-password`;
  const existing = await findAuthUser(email);
  if (existing) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { ok: false, error: `Reset email failed: ${error.message}` };
    return { ok: true, message: `Password reset link sent to ${email}.` };
  }
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) return { ok: false, error: `Invite failed: ${error.message}` };
  return { ok: true, message: `Invite sent to ${email}.` };
}

export async function addAdmin(emailRaw: string, displayNameRaw: string): Promise<Result> {
  const admin = await requireAdmin();
  const email = emailRaw.trim().toLowerCase();
  const displayName = displayNameRaw.trim() || null;
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const { data: existing } = await companyOs
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: false, error: `${email} is already an admin.` };

  const { data: row, error } = await companyOs
    .from("admins")
    .insert({ email, display_name: displayName, created_by: admin.email })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    table: "admins",
    recordId: row.id,
    operation: "insert",
    actor: admin.email,
    newData: { email, display_name: displayName },
  });

  const sent = await sendAccessEmail(email);
  refresh();
  if (!sent.ok) {
    // Access is already granted; only the email failed. Surface that precisely.
    return {
      ok: true,
      message: `${email} added, but the email could not be sent (${sent.error}). They can use "Forgot password" on the login page.`,
    };
  }
  return { ok: true, message: `${email} added. ${sent.message}` };
}

export async function updateAdmin(
  id: string,
  fields: { displayName: string; email: string },
): Promise<Result> {
  const admin = await requireAdmin();

  const { data: row, error: rErr } = await companyOs
    .from("admins")
    .select("id, email, display_name")
    .eq("id", id)
    .maybeSingle();
  if (rErr || !row) return { ok: false, error: rErr?.message ?? "Admin not found." };

  const displayName = fields.displayName.trim() || null;
  const email = fields.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const emailChanged = email !== row.email.toLowerCase();
  if (emailChanged) {
    if (row.email.toLowerCase() === admin.email) {
      return { ok: false, error: "You can't change your own email — ask another admin." };
    }
    const { data: dup } = await companyOs
      .from("admins")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .maybeSingle();
    if (dup) return { ok: false, error: `${email} is already an admin.` };

    // Keep the login identity in sync so the gate (session email vs admins row)
    // doesn't split. email_confirm skips the confirmation round-trip.
    const authUser = await findAuthUser(row.email);
    if (authUser) {
      const { error: aErr } = await supabase.auth.admin.updateUserById(authUser.userId, {
        email,
        email_confirm: true,
      });
      if (aErr) return { ok: false, error: `Login email update failed: ${aErr.message}` };
    }
  }

  const { error } = await companyOs
    .from("admins")
    .update({ email, display_name: displayName })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    table: "admins",
    recordId: id,
    operation: "update",
    actor: admin.email,
    oldData: { email: row.email, display_name: row.display_name },
    newData: { email, display_name: displayName },
  });
  refresh();
  return { ok: true, message: "Admin updated." };
}

export async function resendAccessLink(id: string): Promise<Result> {
  await requireAdmin();
  const { data: row, error } = await companyOs
    .from("admins")
    .select("email")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? "Admin not found." };
  const sent = await sendAccessEmail(row.email);
  refresh();
  return sent;
}

// Revokes /admin access immediately (the gate checks this table per request).
// The Supabase login itself is kept — it may be re-granted or, later, hold a
// /team identity. Removal is what the audit trail records.
export async function deleteAdmin(id: string): Promise<Result> {
  const admin = await requireAdmin();

  const { data: row, error: rErr } = await companyOs
    .from("admins")
    .select("id, email, display_name")
    .eq("id", id)
    .maybeSingle();
  if (rErr || !row) return { ok: false, error: rErr?.message ?? "Admin not found." };
  if (row.email.toLowerCase() === admin.email) {
    return { ok: false, error: "You can't remove yourself — ask another admin." };
  }

  const { error } = await companyOs.from("admins").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    table: "admins",
    recordId: id,
    operation: "delete",
    actor: admin.email,
    oldData: { email: row.email, display_name: row.display_name },
  });
  refresh();
  return { ok: true, message: `${row.email} no longer has admin access.` };
}
