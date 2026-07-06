# Day Off → Edge8 OS: One-Time Migration Plan

Date: 2026-07-05
Status: Recommendation, adversarially reviewed (2-agent verification pass against the
OpenAPI spec + live schema), then simplified from 9 new tables to 4 at Dave's request.
Decisions locked: **one-time migration, no ongoing sync, cut off Day Off as soon as
the alternative is built.**

## Strategy

Build to parity first, migrate once, cut over, cancel.

1. **Now — schema + dry-run import.** Create the four tables, run a read-only
   import to seed policies from the real Day Off config, develop the portal/policy
   engine against real data. The importer is idempotent (provenance keys), so
   dry-runs can be refreshed during the build.
2. **Build — `/team` Slice 1 + policy engine** using the imported policies.
3. **Cutover day — freeze, final import, reconcile, switch.** Announce a freeze,
   run the final import (history + balance anchors), pass the reconciliation gate,
   point staff at `/team`, archive, cancel Day Off.

Because there is no sync period, balance math anchors at cutover: we never compute
balances across the Day Off/Edge8 boundary (see Balance anchor below). That one
decision eliminates the worst class of double-counting bugs.

## Schema: 4 new tables + columns

**Principle:** first-class only what the app enforces; capture everything else
verbatim in the snapshot so nothing is lost when the Day Off account dies. Every
"cut" below is recoverable later because the snapshot keeps the source data.

### New tables

1. **`dayoff_snapshot`** `(endpoint, params jsonb, dayoff_id text, payload jsonb,
   fetched_at)` — raw capture of every read endpoint, keyed by request params (the
   same endpoint is fetched per-employee/per-interval/per-month). **Deny-list
   secrets before persisting** (`GoogleCalendarRefreshToken`, `TempPassword`, …).
   Purge or archive after cutover verification. This table is what makes the
   simplifications safe.

2. **`leave_policies`** `(id uuid, dayoff_id int unique, name text, rules jsonb,
   source jsonb, created_at, updated_at)` — one row per policy. `rules` is a
   TypeScript-typed structure validated on read/write, one entry per leave
   category, carrying exactly the fields the engine enforces:
   - `annualAmount` + `resetCadence` (`annual` | `monthly` — Day Off
     `MonthlyReset=true` means the allowance is PER MONTH; storing it as annual
     would misstate entitlement 12x)
   - `resetType` / `resetMonth` (`BalanceResetTypeID`/`BalanceResetMonthID`:
     calendar vs joining-date anniversary vs custom month)
   - `accrualMethod` (`AccrualTypeID`), `accrualMonthStart`; `accrualNextDate`
     imported at FINAL migration to phase-align the native scheduler
   - `hasCarry` (master switch), `carryCap` (null = unlimited only when
     `hasCarry`), `carryExpiryDays`
   - `allowNegative` (`AllowsNegativeBalance`), `maxNegative` (null = unlimited
     when flag true)
   - `maxUnusedBalance`, `probationDays` (`BalanceEffectiveAfter` + unit),
     `allowHalfDay`, `requiresApproval` (NOT `ApprovalNotRequired`),
     `reasonRequired`, `countHolidays`/`countWeekends` **plus their
     `…AfterDays` thresholds** (the booleans change meaning past N days)
   - `dayoffCompanyLeaveTypeId` — Day Off has TWO id spaces (`LeaveTypeID` = the
     type, `CompanyLeaveTypeID` = type-within-policy); balances reference both
   - Only `IsSelected=true` type rows are materialized (unselected rows are
     phantom entitlements).
   `source` holds the complete `LeavePolicyDTO` verbatim; rule fields graduate
   from jsonb to columns only if we ever need SQL-level queries over them.

3. **`leave_adjustments`** `(id, team_member_id FK, leave_type text CHECK <same
   enum as time_off>, delta_days numeric, kind
   'opening_balance'|'carryover'|'comp'|'correction', reason, effective_date,
   source, external_key, created_by, created_at)` — the balance ledger. Balances
   stay COMPUTED (entitlement accrued since anchor + adjustments − post-anchor
   approved requests), never stored. **Unique `(source, external_key)`** where
   `external_key = dayoff_employee_id:leave_type:interval_id:kind` — without
   this, a re-run after a mid-import failure silently doubles every
   already-imported balance.

4. **`holidays`** `(id, date, name, country, is_company_closure)` — **cannot come
   from the API** (no holidays endpoint; they exist only inside untyped
   calendar-event payloads). Seed manually: Vietnam + US official calendars +
   company closures. Never recompute day-counts for imported requests — Day
   Off's `NumberOfDays` stays authoritative forever.

### Columns on existing tables

- **`time_off`**: `external_source`, `external_id` with `external_id =
  "{LeaveRequestID}:{EmployeeID}"` (composite — Day Off can create one request
  for MANY employees via `EmployeeIDS[]`; a bare id would collide and rows would
  flap between owners), `days numeric` (imported rows store Day Off's
  authoritative `NumberOfDays`), `manager_note` (their `ManagerRejectionReason`
  is distinct from the requester's `Description` → `reason`), `requested_at`
  (their `CreatedAt`). Imported leave types map onto the existing `leave_type`
  enum via an admin-confirmed mapping at import (original names in snapshot).
- **`team_members`**: `leave_policy_id` FK → `leave_policies` (assignment is
  per-person and single-valued; the roster's `LeavePolicyName` resolves by name
  with a hard-fail on duplicate policy names), `dayoff_employee_id int unique`
  (bootstrap match by email/citext; admin confirms; a rehire with two Day Off
  identities is handled manually if it occurs).

### Deliberately cut (and why it's safe)

- **`leave_types` table** → the existing 8-value enum + per-category display
  constants. Custom Day Off type names live in the snapshot.
- **`leave_policy_lines` + `leave_policy_assignments`** → jsonb rules + a
  `team_members` column. 2-4 policies × ~6 types doesn't justify header/lines
  normalization, and per-person assignment is 1:1.
- **`work_schedules`** → deferred. Balance anchoring means we never reproduce
  Day Off's proration for history, and imported `NumberOfDays` is authoritative.
  Going forward everyone counts Mon–Fri until someone genuinely has a different
  schedule; the schedule data waits in the snapshot.
- **`dayoff_employee_map` table** → a single unique column; the rehire edge case
  is a manual fix at this team size.

## Import rules (correctness-critical; all survived the simplification)

1. **Fan-out, don't default.** The API silently truncates: `/employees`
   paginates at 10 (we have 35) and filters by `isActive`; balances/requests are
   per-employee AND per-interval-group (previous/current/next); schedules default
   to the current month. Enumerate everything; assert fetched == reported totals.
   Missing interval enumeration = losing last year's history and next January's
   pre-booked leave.
2. **Balance anchor (kills double-counting).** `opening_balance` = Day Off's
   remaining balance at cutover date T. Imported approved requests are history,
   **excluded from balance math** (already netted into the anchor). Native
   accrual starts strictly at T. Decomposition: `CarryBalance` → `carryover`,
   `Adjustment` → `correction`, `CompOffBalance` → `comp`, remainder →
   `opening_balance`. Branch on `IsAccrualType`, and read the API's literally
   misspelled **`Qouta`** key (reading "Quota" imports null for accrual types).
3. **Comp-off requests are CREDITS.** `IsCompOff=true` ADDS balance (worked a
   weekend, earned a day) → `leave_adjustments` kind `comp`, positive delta,
   never a `time_off` deduction (sign-flip = 2x error per grant).
4. **Statuses fail closed.** Fetch `/leaveRequestStatuses` first; require an
   explicit mapping for every StatusID; abort on any unmapped ID. Coerce
   int/string (`"1"` vs `1` across endpoints).
5. **Dates never touch `Date()`.** Day Off mixes `…T00:00:00Z` and naive
   datetimes across timezones; string-slice the first 10 chars.
6. **Half-day inference**: no read endpoint exposes the flag; infer
   `is_half_day` when `NumberOfDays == 0.5` and same-day from/to.
7. **Approvers resolve via `dayoff_employee_id` with NULL fallback** — never
   fail or skip a request because its approver isn't a team_member (owner
   force-approvals exist). `ForcedByID` used when set; `Approver2*` in snapshot.
8. **Hours types: assert-and-halt.** The balance report shows all-zero hours;
   the importer hard-fails on `IsHours=true` so the case can't slip through as
   corrupted day-math.
9. **Per-employee customization**: custom quotas (`IsCustomBalance`) and
   per-employee type enable/disable land as `leave_adjustments`, not silently
   dropped (the "negotiated 15 days against the policy's 12" case).

## The reconciliation gate (cutover blocker)

Cancelling Day Off destroys the source of truth, so cutover is **blocked** until:
- Per-employee, per-type diff: our computed balance vs `GET /balances/{id}`
  (`Balance`, `CarryBalance`, `CompOffBalance`, `UsedBalance`) = **zero, or every
  delta has a written explanation**.
- Request-count check per employee per interval vs imported rows.
- Final snapshot archived; every `DocumentUrl` attachment (sick notes etc.)
  downloaded to our storage.
- Keep the Day Off account readable one extra billing cycle as the safety net.

## Cutover runbook

1. Announce the freeze (no new Day Off requests after time X).
2. Final import (re-run of the same idempotent importer + balance anchors +
   `accrualNextDate`).
3. Reconciliation gate (above).
4. Flip: staff use `/team`; native accrual live from T; imported rows read-only.
5. Archive snapshot + attachments; cancel Day Off after the grace cycle.

## Sequencing against the existing roadmap

| Step | What | Depends on |
|---|---|---|
| A | Migration: 4 tables + `time_off`/`team_members` columns | nothing |
| B | Importer (admin-triggered server action, GETs only, key in `.env.local`) + dry-run import + roster/email match report | A, API base URL |
| C | Policy engine + `/team` Time Off Slice 1 built against real imported config | B, Slice 0 (shipped) |
| D | Employee provisioning (invites) + portal live | Slice 0 |
| E | Cutover runbook | B, C, D |

## Open items

- **API base URL** — the spec's server entry is relative (`/Dayoff`); need the
  real host from the Day Off dashboard/docs.
- **API key handling** — key goes in `.env.local` as `DAYOFF_API_KEY`; the key
  was pasted into a chat once, so rotate it in Day Off and use the fresh value.
- Leave-type → category mapping and policy-name resolution get an admin
  confirmation step in the importer (matches proposed, human approves).
