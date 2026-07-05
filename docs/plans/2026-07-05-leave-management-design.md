# Leave Management System — Design

Date: 2026-07-05
Status: Decisions locked, ready to spec Phase 0
Reference app: Day Off Tracker (day-off.app), which the team uses today and likes

## Locked decisions (2026-07-05)

1. **Internal only.** Edge8 team, no client multi-tenancy. Tables are single-org, no org
   scoping. If a client product is ever wanted, that is a separate future effort.
2. **Half-days: in from v1.** `working_days` is a decimal. First/last day of a request can
   be a half day.
3. **Sick leave: configurable per policy.** A policy line has an `affects_balance` flag, so
   one policy can treat sick as uncapped-but-recorded (Vietnam social-insurance model) and
   another can draw it down like vacation.
4. **Manager mapping: built in Phase 0.** We add the UI to assign each team member their
   manager and department as part of the roles phase; no existing org chart to import.

## Goal

A self-serve leave (time off) system inside Edge8 OS. Employees request days off and
see balances. Managers approve and see their team on a calendar. Admins configure
policy, and policy can differ by department.

## Navigation placement (decided 2026-07-05)

The admin follows one rule: Settings holds structural primitives, the offices hold the
views that use them.

- **Org Chart -> Talent.** A people-and-reporting-lines view, next to Team.
- **Department maintenance -> Settings.** Structural config, next to Legal entities and
  Pipelines. Many features reference departments (leave policy, team assignment).
- **Leave (time off) placement: still open.** Leading options: (1) Talent, since leave
  runs entirely on people/managers/departments; (2) its own top-level "Time Off" group,
  since every employee uses the request side daily. Not Operations, which shares no data
  with leave.

## The one decision that shapes everything: who logs in

Today the whole `/admin` area is a single trust tier. Access is granted by
`ADMIN_ALLOWLIST` and everyone who gets in sees everything. A leave system breaks
that assumption, because a normal employee must log in and see only their own
balance and requests, never the whole company.

So the core addition is **roles**, not a second app. Recommended approach:

- Keep one auth system (Supabase, already wired). Every team member gets a login.
- Introduce three roles: `employee`, `manager`, `admin`.
  - `admin` = today's allowlist. Full config and override.
  - `manager` = sees and decides for their direct reports only.
  - `employee` = sees only themselves.
- Role is derived, not hand-maintained where possible:
  - You are a `manager` if any `team_members.manager_id` points at you.
  - You are an `admin` if your email is in the allowlist (or an explicit flag).
  - Everyone else is an `employee`.
- The leave pages live under a new office in the sidebar (e.g. **Time Off**), and each
  page renders the right view for the caller's role. Server-side gates enforce it, the
  same way `requireAdmin()` does today. A new `requireTeamMember()` returns the caller's
  `team_member` row and role.

This reuses the Contact 360 spine: a `team_member` already links to a `person`, which
links to everything else. Leave records hang off `team_member_id`.

Everything below assumes this model.

## Data model (company_os schema)

New tables:

**`departments`**
- `id`, `name`, `created_at`
- `team_members` gains `department_id` and `manager_id` (self-reference)

**`leave_types`** — the kinds of leave, company-wide
- `id`, `name` (Vacation, Sick, Unpaid, Bereavement...), `color`, `is_paid`,
  `requires_approval`
- Whether a type draws down a balance is decided per policy, not here (see
  `affects_balance` on the policy line), so "Sick" can be a fixed allowance in one policy
  and uncapped-recorded in another.

**`leave_policies`** — a named bundle of rules, assignable per department
- `id`, `name` (e.g. "Vietnam full-time", "US contractor"), `description`, `created_at`

**`leave_policy_lines`** — one row per leave type inside a policy (this is the engine)
- `policy_id`, `leave_type_id`
- `annual_days` (entitlement per year)
- `affects_balance` (does this type draw down against `annual_days`, or is it just recorded
  with no cap, e.g. Vietnam sick leave under social insurance)
- `accrual_method`: `upfront` (all granted on cycle start) or `monthly` (1/12 each month)
- `cycle_anchor`: `calendar` (Jan 1) or `hire_date` (anniversary)
- `carryover_cap` (max days rolled into next year, 0 = none)
- `carryover_expiry_months` (carried days expire after N months, null = never)
- `allow_negative` (can the balance go below zero)
- `probation_months` (no usage until N months of tenure; accrual can still bank)

**`leave_policy_assignments`**
- `department_id` -> `policy_id`. A department has one active policy.
- Optional per-person override: `team_member_id` -> `policy_id`.

**`leave_requests`**
- `id`, `team_member_id`, `leave_type_id`
- `start_date`, `end_date`, `half_day_start` (bool), `half_day_end` (bool)
- `working_days` (computed at submit: excludes weekends and holidays)
- `reason`, `status` (`pending`, `approved`, `denied`, `cancelled`)
- `approver_id`, `decided_at`, `decided_by`, `decision_note`, `created_at`

**`leave_adjustments`** — the audit trail, never delete a balance, adjust it
- `id`, `team_member_id`, `leave_type_id`, `delta_days`, `reason`, `created_by`, `created_at`
- Used for: starting balances at onboarding, comp days, corrections, year-end carryover

**Balances are computed, not stored.** For a person + leave type + cycle:
```
entitled  = accrued to date under the policy line
+ carryover (from last cycle, minus expired)
+ sum(adjustments)
- sum(approved requests' working_days)
= available
pending   = sum(pending requests' working_days)   // shown separately
```
Storing balances invites drift. Computing them from requests + adjustments + policy is
always correct and gives a free audit history. A nightly snapshot table can be added
later only if we need fast reporting over many years.

**`holidays`**
- `id`, `country`, `date`, `name`, `is_company_closure`
- Feeds `working_days` so a request spanning Tet or the retreat does not burn balance.

## Employee view

Route: `/admin/timeoff` (renders the employee dashboard for a non-manager)
1. **My policy** — read-only card: which policy applies, entitlement per type, accrual
   style, carryover rule, probation status.
2. **Request time off** — pick type, date range, optional half-day on first/last day,
   reason. On submit we compute working days against weekends + their country's holidays,
   check the balance (block or warn if negative and policy disallows), create a `pending`
   request, and notify the manager.
3. **My balances** — per leave type: available, pending, taken this cycle, carryover and
   its expiry.
4. **My requests** — list with status, cancel a pending or future approved request.

## Manager view

Route: `/admin/timeoff/team` (visible if role is manager or admin)
1. **Team calendar** — month view, each person's approved leave as a bar, pending shown
   faint. Filter by department if you manage more than one. This is the "who is out when"
   answer that prevents two people booking the same week.
2. **Approvals queue** — pending requests from direct reports. Approve or deny with an
   optional note. Deciding updates the request and notifies the employee. Approving a
   request that would push a balance negative shows a warning first.
3. **Team member detail** — per report: balances, full request history, upcoming leave.
   Links to their Contact 360.

## Admin view

Route: `/admin/settings/timeoff` (admins only)
1. **Leave types** — create and edit types, colors, paid/unpaid, approval required.
2. **Policies** — create policies and their lines (the engine above). Preview: "a
   full-time hire starting today accrues X by Dec 31."
3. **Assign policies** — map departments (and person overrides) to policies. Proration
   for mid-year hires is automatic from `cycle_anchor` + tenure.
4. **Holidays** — manage per-country holiday calendars and company closure days.
5. **People setup** — set each team member's department, manager, and starting balance
   (as an adjustment) when onboarding the tool mid-year.
6. **Balance adjustments** — manual credit or debit with a required reason. Logged.
7. **Year-end run** — apply carryover caps, expire overflow, grant the new cycle.
   Preview before commit.
8. **Overrides** — approve, deny, or cancel any request regardless of manager.
9. **Reports** — leave taken per person per period, outstanding liability (unused paid
   days), CSV export for payroll.

## Notifications

Reuse the existing Lark integration (already fires on form submissions):
- Request submitted -> ping the manager.
- Approved or denied -> ping the employee.
- Optional daily digest: who is out today.
If Lark is unavailable, fall back to email (Resend is already in the stack).

## Explicitly out of scope for v1

- Multi-step approval chains (only the direct manager approves).
- Hourly leave. Half-day is in; sub-day-hourly is not.
- Leave encashment / payout on exit.
- Delegation beyond a single fallback approver when a manager is away.
- TOIL / overtime banking.

Half-days are in from v1 (decided above), so `working_days` is a decimal throughout.

## Build phases

**Phase 0 — Roles and access.** Add `manager_id`, `department_id`, `departments`.
`requireTeamMember()` and role derivation. New "Time Off" sidebar office, gated per role.
No leave logic yet, just the plumbing that lets a non-admin log in safely.

**Phase 1 — Request and approve (the core loop).** `leave_types`, `leave_requests`,
`holidays`, `working_days` computation. Employee request form, manager approvals queue,
notifications. One hardcoded simple policy (fixed annual days, upfront) so the loop works
before the engine exists.

**Phase 2 — Policy engine.** `leave_policies`, `leave_policy_lines`, assignments,
`leave_adjustments`, computed balances with accrual/carryover/probation. Admin policy UI.
Per-department policies become real here.

**Phase 3 — Calendar and reporting.** Team calendar view, member detail history,
CSV exports, liability report, year-end run.

Each phase ships something usable. Phase 1 alone replaces the daily "can I take Friday"
Slack message.

## Next step

All four blocking decisions are locked (top of doc). The next deliverable is a detailed
**Phase 0 build spec**: exact migration for `departments`, `team_members.manager_id` and
`department_id`, the `requireTeamMember()` gate and role derivation, the new "Time Off"
sidebar office, and the admin UI to assign managers and departments. Nothing in Phase 0
touches leave logic, so it is safe to build and ship on its own.
