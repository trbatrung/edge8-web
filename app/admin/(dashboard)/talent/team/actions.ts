"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabase, companyOs } from "@/lib/supabase";
import { requireAdmin, isAdminEmail } from "@/lib/admin-auth";

type Result = { ok: true; message: string } | { ok: false; error: string };

function siteOrigin(): string {
  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  return host ? `https://${host}` : "https://www.edge8.ai";
}

// Find an existing auth user by email (case-insensitive). Small org, so scanning
// the first page is sufficient; revisit if the auth user count ever grows large.
async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data?.users) return null;
  const match = data.users.find((u) => (u.email ?? "").trim().toLowerCase() === email);
  return match ? { id: match.id } : null;
}

// Invite a team member to the /team portal: mint (or reuse) their Supabase auth
// user and link it on people.auth_user_id. Gated by requireAdmin(). Sends a real
// magic-link invite email via Supabase, so this is deliberately explicit.
export async function inviteToPortal(teamMemberId: string): Promise<Result> {
  await requireAdmin();
  if (!teamMemberId) return { ok: false, error: "Missing team member." };

  const { data: tm, error: tmErr } = await companyOs
    .from("team_members")
    .select("id, person_id")
    .eq("id", teamMemberId)
    .maybeSingle();
  if (tmErr || !tm) return { ok: false, error: tmErr?.message ?? "Team member not found." };

  const { data: person, error: pErr } = await companyOs
    .from("people")
    .select("id, email, auth_user_id")
    .eq("id", tm.person_id)
    .maybeSingle();
  if (pErr || !person) return { ok: false, error: pErr?.message ?? "Linked person not found." };

  const email = (person.email as string).trim().toLowerCase();

  // Admins use /admin and get no /team identity, so never provision one.
  if (isAdminEmail(email)) {
    return { ok: false, error: "This person is an admin. Admins use /admin, not the portal." };
  }

  // Idempotent: already linked to an auth user.
  if (person.auth_user_id) {
    return { ok: true, message: "Already has portal access." };
  }

  // Reuse an existing auth user with this exact email (e.g. created elsewhere);
  // otherwise mint one and email the invite. Either way the email matches by
  // construction, so we never link a mismatched identity.
  const existing = await findAuthUserByEmail(email);
  let authUserId: string;
  if (existing) {
    authUserId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteOrigin()}/api/auth/callback?next=/team`,
    });
    if (error || !data?.user) return { ok: false, error: error?.message ?? "Invite failed to send." };
    authUserId = data.user.id;
  }

  const { error: upErr } = await companyOs
    .from("people")
    .update({ auth_user_id: authUserId, is_team_member: true })
    .eq("id", person.id);
  if (upErr) {
    // Linking failed after (possibly) minting a user; surface it rather than
    // leaving an orphaned auth user silently.
    return { ok: false, error: `Auth user ready but linking failed: ${upErr.message}` };
  }

  revalidatePath("/admin/talent/team");
  return { ok: true, message: existing ? "Linked existing account and enabled portal access." : "Invite sent." };
}
