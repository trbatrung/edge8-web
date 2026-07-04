# CRM redesign — People, Leads, Deals (Roberge model)

Status: **awaiting operator approval.** No code changes, no applied
migration. Supersedes the drafts briefly placed in the company-os repo
(schema migration stays there; this is the UI plan for the live admin).

## Where this lands

The CRM UI already exists in this repo:

- People → `/admin/contacts` (Contact 360 at `/admin/contacts/[id]`)
- Leads → `/admin/revenue/leads` (today: a persona-filtered DataTable)
- Deals → `/admin/revenue/deals` (today: KanbanBoard with per-column
  weighted totals + DetailDrawer)

Data layer reads `company_os` via `lib/admin/query.ts` / `lib/supabase`.
Existing building blocks to reuse: `DataTable`, `KanbanBoard`,
`DetailDrawer`, `Badge`, `PageHead`, brand switcher, server-action pattern
(`revenue/deals/actions.ts`).

## Design (HubSpot lifecycle model — no leads object)

One person record forever. `lifecycle_stage` (none → subscriber → lead →
mql → sql → opportunity → customer → evangelist) and `lead_status` (new,
attempting, connected, meeting_booked, open_deal, unqualified, nurture)
are properties on `people`. The Leads page is a saved view over people,
system-ordered. Every stage/status change appends to
`lifecycle_transitions` (the Postgres equivalent of HubSpot property
history) so funnel conversion and recycle history stay queryable. GPCT
qualification lives in `person_qualifications`, one row per person,
travels with the handoff.

Page principles:

- **People** — identity + full history, no work queue. Read by everyone.
- **Leads** — SDR workstation. Queue ordered by SLA then recency (rep does
  not choose), personal scoreboard (one number: accepted handoffs vs
  weekly goal), GPCT panel, enumerated dispositions. No scoring model at
  launch; collect 3 months of disposition data first.
- **Deals** — closer workstation. Board + live forecast header (one
  number: commit this month). First column is the handoff contract
  (accept/reject with reason). No deal without a dated next step.

## Schema (company-os repo, `supabase/007_sales_process.sql`, draft)

| Change | Why |
|---|---|
| `people` + lifecycle_stage, lead_status, lead_sla_due_at, lead_attempt_count, disqualified_reason | lifecycle as contact properties |
| backfill: persona 'client' → lifecycle 'customer', 'prospect' → 'lead' | today's leads page filters on persona; lifecycle supersedes it as the revenue lens (persona untouched for other offices) |
| new `lifecycle_transitions` | append-only log; funnel math + recycle history |
| new `person_qualifications` | GPCT that travels with the handoff |
| `deals` + next_step, next_step_date, handoff_*, lost_reason | anti-zombie + explicit SDR→closer contract + enumerated exits |
| unique index `meetings(source, external_id)` | race-proof external syncs |

## Phases

### Phase 1 — schema
Apply 007 (additive + persona backfill) via Supabase MCP after approval;
RLS policies for the two new tables per the deploy.sql role model;
regenerate types. Also reconcile company-os README ("not yet applied")
with the live schema.
**Gate:** migration clean; duplicate (source, external_id) meeting insert
fails; `select count(*) from people where lifecycle_stage='customer'`
matches persona='client' count.

### Phase 2 — Leads page → SDR queue
Rebuild `/admin/revenue/leads`: queue over `people where lifecycle_stage
in ('lead','mql','sql')` ordered by `lead_sla_due_at` nulls-last then
recency; scoreboard strip (meetings booked vs goal, connects today, queue
remaining, SLA at risk); expanded card with GPCT panel; server actions for
log-call, disqualify (forced reason), book-meeting-and-hand-off (creates
deal `handoff_status='pending'`); Promote to lead action on Contact 360.
New inbound inquiries promote their person automatically with an SLA
timestamp.
**Gate:** new inquiry appears at top with countdown; disqualify forces a
reason, appends a transition, person lands in Nurture; book-meeting
creates the pending deal with GPCT attached; double-click promote appends
no duplicate transition.

### Phase 3 — Deals board upgrade
Forecast header (open / weighted / commit) above the existing board; "New
from SDR" handoff column with Accept / Reject (reason picklist); next_step
+ next_step_date on card and drawer, red flag when missing on open deals;
days-in-stage on cards; Won/Lost require enumerated outcome; winning sets
person lifecycle_stage='customer' (+ transition).
**Gate:** accept stamps handoff_decided_at and moves the card; reject
requires a reason; a dealwithout next_step_date is visibly flagged and
counted in the header; header numbers reconcile with hand-run SQL.

### Phase 4 — Contact 360 timeline
Add the missing tabs: interactions (136), meetings (357, backfilled from
ThoughtFlow), and lifecycle transitions, merged newest-first.
**Gate:** a known client (e.g. Pho 24 contact) shows meetings and
interactions interleaved; a recycled lead's prior cycle is visible.

### Phase 5 — funnel report
`/admin/revenue/funnel`: conversion per arrow (inquiry → worked →
connected → qualified → accepted → won) per rep and per source, straight
from lifecycle_transitions + enumerated deal exits.
**Gate:** report matches hand-run SQL on a seeded fixture.

## Sequencing rationale

Schema first (everything reads it); Leads before Deals (the handoff object
must exist before the closer can accept it); timeline next (pays off the
meetings backfill everywhere); report last (pure read).

## Out of scope

Lead scoring model; ThoughtFlow content migration (operator: not worth
moving); Lark pipeline re-pointing (separate decision: re-point vs sync
bridge); parsing action items from the 86 meeting summaries.
