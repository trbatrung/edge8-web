# Plan: Map all site forms into the `company_os` schema

- **Date:** 2026-06-28
- **Status:** Draft — schema verified; open decisions in §10 before build
- **Owner:** Dave
- **Stack:** Next.js (App Router) · Supabase project `wwchefrgkkxmhlkntufm` ("Edge8 Company Database"), schema **`company_os`** · Resend · Stripe · Vercel

---

## 1. Goal

Repoint the **in-scope** site forms' database writes into the canonical **`company_os`**
schema (person-centric model), replacing the current `public`-schema / legacy
`people`+`inquiries` destinations. External notifications (Resend, Stripe, Telegram, Lark)
are unchanged.

**Out of scope (owner decision, 2026-06-28):** the **Vietnam Adventure** form
(`/api/vietnam-adventure-info-form`, `trip_*` tables, `passports` bucket) is **not touched**
— it stays exactly as it is today. So this plan covers **3 forms**: Contact, Careers, Saigon.

**Cutover: Replace.** Once `company_os` writes are verified, remove the old destinations.

## 2. Verified facts (from live introspection)

- The schema is **`company_os`** (underscore) — the dashboard shows `company-os`, but the
  Postgres schema is `company_os`. 85 tables; normalized, person-centric.
- The site already points at this project: buckets **`passports`** and **`resumes`** exist
  here, and `public.job_applicants` (264) / `public.trip_families` (10) hold the current
  form data. **`company_os`** is the newer canonical model: `candidates` (284),
  `applications` (285), and it already has **5 applications with
  `source_detail = 'edge8.ai/careers'`** — i.e. the career-site convention is established.
- ⚠️ `public` has **no `people` / `inquiries` / `private_session_blocks`** — those live only
  in `company_os`. So the **Contact and Saigon DB writes are very likely failing silently
  today** (their routes log and swallow the error). Moving them to `company_os` fixes this.
- Upsert keys: `people.email` (unique, citext), `candidates.person_id` (unique),
  `applications (candidate_id, job_requisition_id)` (unique).
- Resume model: `candidates.resume_document_id → company_os.documents.storage_path`
  (+ object in the `resumes` bucket). It is **not** a path string on the candidate.
- Job markdown `supabase_job_id` UUIDs exist in **both** `company_os.job_requisitions` and
  `public.job_openings` (same IDs) → use directly as `applications.job_requisition_id`.

## 3. The four forms (source of truth)

| # | Form | Endpoint | Fields |
|---|------|----------|--------|
| 1 | Contact / AI Audit — `app/contact/page.tsx` | `POST /api/contact` | name, email, company, teamSize, message, website (honeypot) |
| 2 | ~~Vietnam Adventure~~ — **OUT OF SCOPE (unchanged)** | `POST /api/vietnam-adventure-info-form` | stays on `public.trip_*` + `passports` bucket; not migrated |
| 3 | Careers — `app/careers/[slug]/apply/ApplyForm.tsx` | `POST /api/careers/apply` | job_id, job_title, job_slug, full_name, email, phone, linkedin, resume (file), honeypot |
| 4 | Saigon Private Reserve — `components/PrivateSessionReserve.tsx` | `POST /api/checkout/saigon-private` | days, team_size, name, email, company, start_date, idea |

## 4. Mapping — Form 1 · Contact / AI Audit

Target: `company_os.people` + `company_os.inquiries`.

| Field | Target |
|---|---|
| `email` | `people.email` (**upsert on email**), `inquiries.metadata.email` |
| `name` | `people.full_name` |
| `company` | `inquiries.metadata.company` (see §10.1 — relational `companies` is the alternative) |
| `teamSize` | `inquiries.metadata.team_size` |
| `message` | `inquiries.message` |
| derived | `people.source='edge8.ai'`; `inquiries.person_id`, `type='contact'`, `subject='AI Audit Request'`, `source='edge8.ai'`, `source_site='edge8.ai'`, `status='new_lead'`, `brand_id`=Edge8 brand (§10.5) |
| `website` | dropped (honeypot) |

## 5. Mapping — Form 3 · Careers (most involved)

Targets: `people` → `candidates` → `documents` (resume) → `applications`.

1. **`people`** — upsert on `email`: `full_name`, `phone`, `source='edge8.ai/careers'`.
2. **`candidates`** — upsert on `person_id`: `linkedin_url`, `pool_status='active'`.
3. **`documents`** — insert: `storage_path` = uploaded path in **`resumes`** bucket,
   `mime_type`, `byte_size`, `title='Resume — <name>'`, `entity_type='candidate'`,
   `entity_id=candidate.id`; then set `candidates.resume_document_id`.
4. **`applications`** — upsert on `(candidate_id, job_requisition_id)`:
   `job_requisition_id = job_id` (frontmatter UUID), `source='career_site'`,
   `source_detail='edge8.ai/careers'`, `status='active'`,
   `current_stage_id` = first `application_stages` row for that requisition
   (`order by position limit 1`), `metadata` = { job_slug, job_title }.

Upload still goes to the existing private `resumes` bucket. Recruiter email/signed-URL
notification unchanged.

## 6. Mapping — Form 4 · Saigon Private Reserve

Targets: `people` + `inquiries` (lead) and `bookings` (+ `orders` for Stripe).

| Field | Target |
|---|---|
| `email` | `people.email` (upsert), `name` → `people.full_name`, `source='edge8.ai'` |
| lead | `inquiries`: `person_id`, `type='retreat'`, `source='edge8:saigon-private:<tier>'`, `source_site='edge8.ai'`, `status='new_lead'`, `message`=composed summary, `metadata`={ company, days, team_size, start_date, end_date, idea, expected_total, cohort:'saigon-private', tier } |
| booking | `bookings`: `person_id`, `kind='retreat'`, `start_date`, `end_date`, `party_size=team_size`, `amount_cents=expectedTotal*100`, `currency='usd'`, `status='pending'`, `metadata`={ idea, inquiry_id } |
| Stripe | `orders`: `person_id`, `payment_method='stripe'`, `stripe_session_id`, `amount_cents`, `currency`, `status='pending'`; link `bookings.order_id → orders.id` |

**Open issue (§10.2):** date-overlap conflict detection + admin date blocks currently use
`private_session_blocks` (read/written by `/admin/blocks`). There is **no equivalent in
`company_os`**. Options: (a) keep `private_session_blocks` in `public` for blocking only,
(b) add a `company_os` blocks table, or (c) derive overlaps from `bookings`.

## 7. Form 2 · Vietnam Adventure — OUT OF SCOPE

Per owner decision (2026-06-28), this form, its route
(`app/api/vietnam-adventure-info-form/route.ts`), its `public.trip_*` tables and the
`passports` bucket are **not touched**. It keeps working exactly as today. No mapping, no
code change.

## 8. Code changes (Replace strategy)

- **`lib/supabase.ts`** — set default schema to `company_os` (`{ db: { schema: 'company_os' } }`)
  or use `.schema('company_os')` per call. Keep the same project connection.
- **`lib/signups.ts`** — rewrite to the person→inquiry model above (`people` upsert on email,
  `inquiries` with `metadata`); add the `bookings`/`orders` writes for Saigon
  (or a new `lib/bookings.ts`).
- **`lib/private-session-blocks.ts`** + `/admin/blocks` — resolve per §10.2.
- **`app/api/contact/route.ts`** — use the shared `company_os` client; write per §4
  (drop the inline `createClient`).
- **`app/api/careers/apply/route.ts`** — write per §5 (people → candidates → documents →
  applications); resume to `resumes` bucket.
- **`app/api/vietnam-adventure-info-form/route.ts`** — **no change** (out of scope, §7).
- Remove import/var orphans created by the above.

## 9. Prerequisites

1. **Expose `company_os` to PostgREST** — confirm it's in the project's *Exposed schemas*
   (`db-schemas`); `supabase-js` can't reach a non-exposed schema even with the secret key.
   (The 5 existing `edge8.ai/careers` applications suggest something already writes here —
   verify whether it's the site or an external sync.)
2. **`.env.local`** — create at repo root (currently missing) with all keys, empty values +
   comments, per the env rule; mirror Vercel.
3. Confirm allowed values for `inquiries.type` and `bookings.kind` (no breaking check
   constraint). Brand/entity attribution is **resolved** (see §10.5).

## 10. Open decisions (need answers before build)

1. **Company field** — store lead `company` in `inquiries.metadata.company` (simple), or
   resolve/create `company_os.companies` + `person_companies` (relational, heavier)?
2. **Saigon date-blocking** — keep `private_session_blocks` in `public`, add a `company_os`
   blocks table, or derive from `bookings`? (`/admin/blocks` depends on this.)
3. ~~Vietnam trip~~ — **resolved: out of scope** (form untouched, §7).
4. **Saigon `orders`** — create an `orders` row at Stripe-session time, or only on paid
   webhook? (No Stripe webhook is wired today.)
5. ~~`brand_id`~~ — **resolved.** Tag all edge8.ai form rows with brand **Edge8** =
   `02f31cd4-b402-4db7-9988-c331f7d47785` (on `people.source_brand_id`, `inquiries.brand_id`,
   `bookings.brand_id`, `orders.brand_id`, `documents.brand_id`). On `orders`,
   `legal_entity_id` = **Talent Edge LLC** = `996771d6-1ca5-442a-be67-30f05084c33d`.
   (Brands now total 5 — Fab Four Academy removed 2026-06-28.)
6. **Verify** the suspected silently-failing Contact/Saigon writes (logs/advisors) so we
   know what "today" actually persists before cutover.

## 11. Build steps (once §10 settled)

1. Confirm schema exposure + `brand_id` + enum values (§9, §10.5).
2. `lib/supabase.ts` → default `company_os` schema.
3. Rewrite `lib/signups.ts` (people+inquiries) and add bookings/orders for Saigon.
4. Update the 4 routes (§8); resolve `private_session_blocks` per §10.2.
5. `.env.local` + Vercel env parity.
6. QA each form end-to-end (§12); then remove old `public`/legacy writes (Replace).

## 12. QA / acceptance

- Each form persists to the right `company_os` tables with correct columns/`metadata`.
- Careers: people→candidate→document→application chain links correctly; resume in `resumes`
  bucket; `application.current_stage_id` set; no duplicate application on resubmit (upsert).
- Saigon: lead + booking (+ order) created; date-conflict logic still blocks overlaps.
- Files land in private buckets; signed URLs in emails work.
- All notifications (Resend / Stripe / Telegram / Lark) still fire; honeypot still rejects.
- No writes to the old `public`/legacy tables after cutover.

## 13. ⚠️ Security note (surfaced from advisor)

6 `public` tables have **RLS disabled** (`pho24`, `aiofficer`, `edge8_chat_history`,
`edge8`, `silk`, `silk_chat_history`) — fully exposed to the anon key. Out of scope for this
task, but flagged. Do not blindly enable RLS (it blocks all access without policies); decide
policies first. Remediation is `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` per table.
