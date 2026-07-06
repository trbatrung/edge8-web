import { supabase, companyOs } from "@/lib/supabase";
import { envAllowlist } from "@/lib/admin-auth";

// Data layer for Settings → Admins. Emails are stored lowercase (unique on
// lower(email)); every write path must normalize before hitting the table.

export type AdminSource = "db" | "env" | "both";

export type AdminListRow = {
  id: string | null; // null = env-only entry (not editable from the UI)
  email: string;
  displayName: string | null;
  createdAt: string | null;
  createdBy: string | null;
  source: AdminSource;
  hasLogin: boolean;
  lastSignInAt: string | null;
};

export type AuthUserInfo = {
  userId: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

// Auth users keyed by lowercase email, via a first-page listUsers scan — the
// same convention as portal provisioning (talent/team actions). Small org, so
// one page is sufficient; revisit if the auth user count ever grows large.
async function authUsersByEmail(): Promise<Map<string, AuthUserInfo>> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error || !data?.users) {
    if (error) console.error("listUsers failed:", error.message);
    return new Map();
  }
  const map = new Map<string, AuthUserInfo>();
  for (const u of data.users) {
    const email = (u.email ?? "").trim().toLowerCase();
    if (!email || map.has(email)) continue;
    map.set(email, {
      userId: u.id,
      emailConfirmedAt: u.email_confirmed_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
    });
  }
  return map;
}

export async function findAuthUser(email: string): Promise<AuthUserInfo | null> {
  return (await authUsersByEmail()).get(email.trim().toLowerCase()) ?? null;
}

type AdminDbRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  created_by: string | null;
};

// DB rows plus env-only entries, each enriched with login status.
export async function listAdmins(): Promise<{ rows: AdminListRow[]; error: string | null }> {
  const { data, error } = await companyOs
    .from("admins")
    .select("id, email, display_name, created_at, created_by")
    .order("created_at", { ascending: true });
  if (error) return { rows: [], error: error.message };

  const dbRows = (data ?? []) as AdminDbRow[];
  const dbEmails = new Set(dbRows.map((r) => r.email.toLowerCase()));
  const envEmails = envAllowlist();
  const authUsers = await authUsersByEmail();

  const withLogin = (r: Omit<AdminListRow, "hasLogin" | "lastSignInAt">): AdminListRow => {
    const auth = authUsers.get(r.email.toLowerCase());
    return { ...r, hasLogin: Boolean(auth), lastSignInAt: auth?.lastSignInAt ?? null };
  };

  const rows: AdminListRow[] = [
    ...dbRows.map((r) =>
      withLogin({
        id: r.id,
        email: r.email,
        displayName: r.display_name,
        createdAt: r.created_at,
        createdBy: r.created_by,
        source: envEmails.has(r.email.toLowerCase()) ? "both" : "db",
      }),
    ),
    ...[...envEmails]
      .filter((e) => !dbEmails.has(e))
      .map((e) =>
        withLogin({
          id: null,
          email: e,
          displayName: null,
          createdAt: null,
          createdBy: null,
          source: "env",
        }),
      ),
  ];
  return { rows, error: null };
}
