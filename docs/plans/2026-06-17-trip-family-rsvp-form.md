# Plan: Trip Family RSVP — T‑shirt Sizes + Optional Passport Upload

- **Date:** 2026-06-17
- **Status:** Awaiting final inputs (see "Open inputs") before implementation
- **Owner:** Dave
- **Stack:** Next.js 14 App Router · Supabase · Resend · Vercel

---

## 1. Goal

A form that lets each family on the trip submit:

1. Their **family name** and a **contact** (name + email, phone optional).
2. **One or more family members**, each with a **t‑shirt size**.
3. **Optionally**, a **passport photo per member** (securely stored).

Submissions are stored in Supabase, photos go to a **private** storage bucket, and
each submission triggers an **email to accounting@edge8.ai** and a **Lark** message.

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Access model | **Public link + honeypot** (write‑only submission; bucket stays private) |
| Privacy messaging | Must show **why** we collect passports and that we **delete within 30 days of the trip** |
| Edit later | **No** — families resubmit fresh if they need to change/add |
| T‑shirt sizes | **Adult range:** XS, S, M, L, XL, 2XL, 3XL |
| Member rows | **Dynamic** — "+ Add family member" / remove |
| Passport per member | **Optional** |
| Notifications | **Email accounting@edge8.ai (Resend)** + **Lark message** |

### Required privacy copy (near the upload)

> **Why we ask for passports:** Vietnamese regulation treats the boat as a hotel,
> and a passport (your official ID) is required to check in. We need each
> traveler's passport to complete check‑in.
>
> **How we protect it:** Photos are stored securely with restricted access, and we
> **delete every passport image within 30 days of the trip ending.**

## 3. Reuse (existing patterns)

- `app/api/careers/apply/route.ts` — the reference flow: sensitive file → **private**
  Supabase bucket, parent + child row inserts, **signed URL** for admins, **Resend**
  notification, **honeypot** anti‑spam, `runtime = 'nodejs'`, file size/type guards.
- `app/api/contact/route.ts` — Resend + Supabase + honeypot + `ADMIN_EMAILS` pattern.

## 4. Data model

Two tables + one private bucket (mirrors `job_applicants` / `job_applications`).

```sql
create table trip_families (
  id            uuid primary key default gen_random_uuid(),
  family_name   text not null,
  contact_name  text not null,
  contact_email text not null,
  contact_phone text,
  source        text default 'edge8.ai/trip',
  created_at    timestamptz default now()
);

create table trip_members (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references trip_families(id) on delete cascade,
  full_name     text not null,
  tshirt_size   text not null,            -- XS,S,M,L,XL,2XL,3XL
  passport_path text,                     -- nullable; path in private bucket
  created_at    timestamptz default now()
);
```

- Private Storage bucket **`passports`**; object paths: `family_id/member_id-<uuid>.<ext>`.
- **RLS:** deny all anon/authenticated access on both tables and the bucket. Only the
  service‑role server route (`SUPABASE_SECRET_KEY`) reads/writes. No public listing.

## 5. Frontend — `/trip/rsvp` (client component)

- Family name + contact name/email (phone optional).
- **Repeatable member rows** via `useState`; "+ Add family member" and remove controls.
  Each row: full name + size dropdown (XS–3XL) + optional passport file input.
- Privacy notice (copy above) beside the upload.
- Honeypot field (`website`). Loading / success / error states. Resubmit‑fresh model.

## 6. API — `POST /api/trip/rsvp` (`runtime = 'nodejs'`)

1. Honeypot check → validate required fields + email format.
2. For each member with a photo: validate type (jpg/png/webp/pdf) and size (≤10 MB),
   upload to `passports` bucket.
3. Insert `trip_families` row → insert `trip_members` rows.
4. **Notify:**
   - Email **accounting@edge8.ai** via Resend — summary table + per‑passport
     short‑lived signed links.
   - POST summary to **Lark** via `LARK_WEBHOOK_URL` (the Vercel runtime cannot use
     Claude's Lark MCP tools — it needs an incoming webhook).
5. Return `{ ok: true }`.

## 7. 30‑day deletion (compliance promise)

`created_at` alone is insufficient — we must actively purge. Approach:

- Add `/api/trip/cleanup` triggered by a **Vercel cron** (or a `/schedule` routine).
- It deletes passport objects + nulls `passport_path` once past **trip‑end + 30 days**.
- Requires the **trip end date** baked in (env var or constant).

## 8. Security

- Service‑role key server‑side only; never exposed to the client.
- Private bucket, no public URLs; admins get short‑TTL signed URLs only.
- File type + size validation; honeypot; required‑field + email validation.
- Passport images auto‑deleted within 30 days of trip end.

## 9. Environment variables

| Var | Status | Use |
|---|---|---|
| `SUPABASE_URL` | existing | DB + storage |
| `SUPABASE_SECRET_KEY` | existing | service‑role server access |
| `RESEND_API_KEY` | existing | notification email |
| `LARK_WEBHOOK_URL` | **new** | Lark notification |
| `TRIP_NOTIFY_EMAIL` | optional | defaults to `accounting@edge8.ai` |
| `TRIP_END_DATE` | **new** | drives 30‑day deletion |

## 10. Open inputs (needed before build)

1. **Trip end date** — to schedule the 30‑day deletion.
2. **Lark webhook URL** (or how the route should reach the target Lark chat).
3. Hardcode `accounting@edge8.ai` vs. use `TRIP_NOTIFY_EMAIL` env var?
4. Confirm page path `/trip/rsvp` (vs. `/trip`).
5. Deletion mechanism: **Vercel cron** in‑repo vs. **`/schedule` routine**.

## 11. Build steps (once inputs confirmed)

1. Supabase: create `passports` bucket (private), `trip_families` + `trip_members`
   tables, RLS deny‑all policies.
2. `app/api/trip/rsvp/route.ts` — validation, upload, inserts, Resend + Lark notify.
3. `app/trip/rsvp/page.tsx` (+ `layout.tsx`) — dynamic form, privacy copy, states.
4. `app/api/trip/cleanup/route.ts` + cron (or `/schedule` routine) for 30‑day purge.
5. Add `LARK_WEBHOOK_URL` / `TRIP_END_DATE` to env docs and Vercel.
6. QA: submission with/without photos, validation errors, honeypot, signed‑URL
   access, notification delivery.
