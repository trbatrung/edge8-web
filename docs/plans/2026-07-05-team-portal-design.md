# Team Portal (/team) — Design and Build Plan

Date: 2026-07-05
Status: Design locked, in review before Slice 0
Supersedes: the "one app with roles under /admin" recommendation in
`2026-07-05-leave-management-design.md`. The leave loop already built under
`/admin/operations/time-off` stays; its employee-facing half moves to `/team`.

## What this is

A separate, lighter self-service portal at `/team` where employees and managers
log in. `/admin` stays the admin-only Company OS console. One Supabase auth
system, routed by role: admins land in `/admin`, everyone else in `/team`.

## Locked decisions

- **Separate `/team` portal** (not role-scoped `/admin`).
- **Magic-link login** (email code, no passwords).
- **Broad HR portal** as the target, delivered in slices.
- **Pay is admin-only** (never surfaced in `/team` for v1).
- **Security posture: server-side service-role + enforced app-layer scoping**
  (see below). We do NOT move `/team` to a browser JWT + RLS client.

## Navigation

Employee ("Me"):
```
Home            snapshot: who is off, my next leave, open tasks, quick actions
Time Off        request, my balance, my policy, my history
My Profile      employment details, contact info, emergency contact, skills
Directory       org chart + people search, reporting lines, contacts
Onboarding      new-hire checklist (auto-hides once complete)
1-1s            my sessions with my manager: agenda, notes, action items
Goals           my goals and progress
Reviews         my performance reviews (finalized only)
Documents       my documents + company policies
```
Manager adds "My Team": Approvals, Team calendar, My reports (roster to detail),
1-1s per report, Goals for reports, Reviews for reports.

Pay does not appear. Compensation stays in `/admin`.

## Identity and roles

The identity spine (all verified against the live DB):
```
auth.users.id  <-  people.auth_user_id   (real FK, 0 of 538 populated today)
people.id      <-  team_members.person_id
team_members.id                          (the key most HR tables reference)
team_members.manager_id -> team_members.id   (the org tree; 1 manager / 30 reports)
```

`lib/team-auth.ts` computes the actor once per request, the mirror of
`requireAdmin()`:
1. `createSessionClient().auth.getUser()` (revalidates the JWT, not `getSession`).
2. Admin check: email in `ADMIN_ALLOWLIST`.
3. Resolve identity by **`people.auth_user_id = user.id`, never by email** (email
   is reusable/changeable; only the auth id is cryptographic).
4. Require an **active** `team_members` row, else deny.
5. Manager iff any `team_members.manager_id = self` (active reports only).
6. Return `{ authUserId, teamMemberId, personId, role, teamMemberScope[], personScope[] }`.

`requireTeamMember()` redirects to `/team/login` when there is no actor. Every
`/team` page and server action calls it first.

**Admins stay admin-only (decided).** An `ADMIN_ALLOWLIST` user has no `/team`
identity; `requireTeamMember()` redirects them to `/admin`. Provisioning never
links an allowlist email into `/team`. So `/team` roles are just `employee` and
`manager`.

## Security posture (the important part)

**Corrected from the first draft.** Ground truth from the live DB:
- RLS is ON for every `company_os` table with **zero policies** and **no grants**
  to `anon`/`authenticated`; those roles have **no USAGE** on the schema.
- So the browser/publishable key can reach **nothing** in `company_os` today.
  `/admin` reads work only through the service-role key, which bypasses RLS.
- `people.auth_user_id` has a real FK, so a bad/forged auth id cannot be linked.

Given that, moving `/team` to a browser JWT + RLS client would require granting
`authenticated` schema USAGE + per-table grants + exposing `company_os` via the
Data API, on a database shared by caiocoach / ai-officer / davehajdu. That turns
"browser key can reach nothing" into "browser key can reach `company_os`, and
safety now depends on a correct policy existing on every current and future
table." That is a **larger** blast radius, not smaller. RLS as a backstop under
the service-role path is pointless because the service key bypasses it.

**Decision: keep the browser key locked out. All `/team` data access is
server-side through the service-role client, behind `requireTeamMember()`, and
funnelled through one mandatory scoped helper.** Make an unscoped read
structurally impossible from `/team`, rather than opening the database to
browsers.

### Non-negotiable controls (the ship gate)

No `/team` screen ships until all of these exist:

1. **Provisioning first.** Nothing works until `auth_user_id` is populated
   (0/538). Build the admin "Invite to portal" action (behind `requireAdmin()`)
   before any portal screen.
2. **One scoped helper.** Every `/team` read/write goes through
   `teamScoped(actor, table)` which injects the scope filter
   (`team_member_id in scope`, or `person_id in scope`, per a table->key
   allowlist). A table not in the allowlist is refused. Add a lint/review rule
   that **`/team` code never imports the service-role `companyOs` directly**.
3. **IDOR closed on every id-taking action.** For any action that takes an id,
   re-derive the actor, SELECT the target row's owner, and assert it is in the
   actor's scope before mutating. For creates, **force `team_member_id =
   actor.teamMemberId`** and ignore any client-supplied id (an employee can only
   file for themselves). The already-built `/admin` time-off actions
   (`decideTimeOff(id)`, `createTimeOff({teamMemberId})`) are safe under
   `requireAdmin` but MUST be re-scoped when reused in `/team`.
4. **Callback hardening.** `app/api/auth/callback/route.ts` currently redirects
   to a raw `?next`. Allowlist it to `^/(admin|team)(/|$)`, reject `..`/scheme/
   host, else fall back to `/team`. The callback serves both tiers, so this is
   not optional.

### Further controls

- **`manager_id` / `department_id` are admin-only writes, forever.** Any action
  touching them is gated by `requireAdmin()`, never `requireTeamMember()`. The
  manager role is derived from `manager_id`, so letting `/team` write it is
  privilege escalation.
- **Leave `reason` visibility (decided).** `reason` is free-text and can hold
  medical/personal detail. The business accepted the exposure: managers see the
  full request including the reason. Worth revisiting if the org grows and the
  manager span narrows.
- **Provisioning identity safety.** Before linking, verify the auth user's email
  equals `people.email` (citext, case-insensitive). Refuse to link an
  `ADMIN_ALLOWLIST` auth user to a non-admin `people` row. Add `UNIQUE
  (people.auth_user_id)` and confirm `UNIQUE (people.email)`.
- **Deprovision is immediate.** When `team_members.status` leaves active, ban/
  disable the auth user and revoke sessions in the same flow, not just the app
  check (tokens otherwise live until expiry). Reassign a departing manager's
  reports before deactivating.
- **Rate-limit** the magic-link request (per email, per IP). Keep the "if an
  account exists, a link is on its way" response neutral (no account
  enumeration), with `shouldCreateUser: false`.
- **Fix stale comments.** `lib/admin-auth.ts`, `lib/supabase.ts`,
  `lib/supabase/browser.ts` say "company_os has no RLS." The truth: RLS is on
  with no policies, the browser key has no `company_os` access, and the boundary
  is `requireAdmin()`/`requireTeamMember()` + the service-role client.

## Magic-link login flow

1. `/team/login` (client) calls `signInWithOtp({ email, options: {
   shouldCreateUser: false, emailRedirectTo: `${origin}/api/auth/callback?next=/team` } })`.
2. Supabase emails the link. Add `https://www.edge8.ai/api/auth/callback` (and
   localhost for dev) to the project Redirect Allow List.
3. The existing callback exchanges the code, sets the session cookies, redirects
   to the (now allowlisted) `next`.
4. Middleware `getUser()` refreshes the session on each request. Sign-out clears
   cookies. No password reset path (a fresh link is recovery).

## Provisioning flow (admin "Invite to portal")

Gated by `requireAdmin()`, from Talent > Team:
1. Load the person (`person_id -> people`: email, auth_user_id).
2. If `auth_user_id` is null and no auth user has that email:
   `admin.inviteUserByEmail(email, { redirectTo: .../api/auth/callback?next=/team })`,
   then `UPDATE people SET auth_user_id = <new id>, is_team_member = true`.
3. If an auth user with that email already exists: link to it (do not mint a
   second), after the email-match and non-admin checks.
4. If `auth_user_id` already set: offer "Resend sign-in link" (idempotent).
5. Uses a server-only admin client (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`,
   `persistSession: false`); never in a client bundle.

## Data model reference (scope key per table)

| Table | Scope | Key to filter on |
|---|---|---|
| time_off | self / manager | `team_member_id` |
| team_members | self / manager | own row via `person_id`; reports via `manager_id` |
| people | self | `id` = actor.personId (own profile) |
| positions, departments | admin ref | read-only labels, no per-user filter |
| onboarding_tasks | self | `team_member_id` |
| one_on_ones | self (dual) | `report_id = self OR manager_id = self` |
| one_on_one_sessions | self | via `one_on_one_id` |
| meeting_participants | self | `person_id` |
| meeting_action_items | self | `assignee_id` (person_id) |
| goals | self / manager | `owner_team_member_id`; team via `department_id` |
| performance_reviews | self | `team_member_id`; finalized status only |
| person_skills | self | `person_id` |
| documents | self | polymorphic `(entity_type, entity_id)` + `uploaded_by`; app-level |
| compensation | admin-only | not exposed in `/team` |

Every operational HR table is empty today (0 rows) except roster/reference data,
so this is a green-field build on an existing schema.

## Build plan (sliced)

**Slice 0 — Foundation and the gate (the unlock).** No feature data yet.
- `lib/team-auth.ts` (`getTeamActor`, `requireTeamMember`, role + scope).
- `teamScoped()` helper + lint rule banning direct `companyOs` import in `/team`.
- Admin "Invite to portal" action + Talent > Team button; provisioning with
  email-match, uniqueness, admin client. Migration: `UNIQUE(people.auth_user_id)`.
- Middleware: add `/team/:path*`, bypass `/team/login`. Callback `next`
  allowlist. `SiteFrame` BARE_ROUTES += `/team`.
- `/team` route group: `(auth)/login` (magic link), `(dashboard)/layout`
  (`requireTeamMember`), `TeamSidebar`, Home.
- Exit check: an invited employee logs in via magic link and sees Home; a
  non-employee who authenticates is denied.

**Slice 1 — Time Off self-service.** `/team/time-off`: request own leave, see own
balance/history, reusing `lib/admin/time-off.ts` scoped to self. Manager:
Approvals + Team calendar for direct reports (server-derived scope; managers see
the full request including reason). Re-home the approve loop with the IDOR fixes.

**Slice 2 — Directory + My Profile.** Read-only org chart/directory; profile read,
then editable contact + emergency fields only.

**Slice 3 — Onboarding + Documents.**

**Slice 4 — 1-1s** (shared vs private notes separated).

**Slice 5 — Goals + Reviews** (reviews finalized-only to the reviewee).

Each slice ships something usable. Slice 0 is pure plumbing but is the only thing
that lets a non-admin log in at all, so it is first.

## Resolved (2026-07-05)

1. **Manager visibility of leave reasons:** managers see the full request
   including the free-text `reason`. Business accepted the PII exposure given the
   team size. Revisit as the org grows.
2. **Admins as employees:** admins stay `/admin`-only, no `/team` identity.
   `requireTeamMember()` redirects an allowlist user to `/admin`, and provisioning
   skips allowlist emails.
