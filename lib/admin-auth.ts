// Server-only admin auth gate. NEVER import from a client component.
//
// A request is "admin" iff it carries a valid Supabase session AND the user's
// email is in ADMIN_ALLOWLIST. company_os has no RLS, so this gate — enforced in
// the admin layout and at the top of EVERY server action — is the security
// boundary. The service-role client (lib/supabase.ts) has no DB-level backstop.

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

function allowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_ALLOWLIST ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

// Returns the signed-in admin, or null if not signed in / not allowlisted.
// Uses getUser() (revalidates the JWT against Supabase) — not getSession() — so
// a forged or expired cookie cannot pass.
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !allowlist().has(email)) return null;
  return { id: user.id, email };
}

// Server-side gate. Call at the top of the admin layout and every server action.
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
