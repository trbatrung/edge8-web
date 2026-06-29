# Plan: Migrate caio-coach data into the `company_os` schema

- **Date:** 2026-06-28
- **Status:** Draft — for review (open decisions in §9)
- **Owner:** Dave
- **Source:** Supabase project **`pjecfbywrawpuutswvrb`** ("caio-coach"), `public` schema (DaveHajdu org)
- **Target:** Supabase project **`wwchefrgkkxmhlkntufm`** ("Edge8 Company Database"), **`company_os`** schema
- **Attribution:** brand **CAIO Coach** `653a8562-835f-4c1b-a51a-1ab989d563ac` → legal entity **AI Officer Institute** `b3e57d85-620b-4f71-a938-484245b2dac4`

> Cross-project, cross-connector: caio-coach is reachable via the `mcp__supabase__*`
> connector; company_os via `mcp__8e967612-…__*`. No single SQL can span both — migration
> reads from source and writes to target in batches.

---

## 1. Goal

Copy caio-coach's CRM/commerce data into the canonical `company_os` schema, tagged to the
CAIO Coach brand, **without disturbing** existing `company_os` data (which already holds
Edge8 + AI Officer records). Idempotent (safe to re-run) and reversible.

## 2. Source inventory → target

| Source (caio-coach `public`) | Rows | → Target (`company_os`) |
|---|---|---|
| `people` | 31 | `people` (dedup by email) + `person_brands` link |
| `affiliates` | 10 | `affiliates` |
| `products` | 20 | `products` |
| `inquiries` | 39 | `inquiries` |
| `orders` | 11 | `orders` |
| `event_registrations` | 5 | `event_registrations` |
| `affiliate_commissions` | 1 | `affiliate_commissions` |
| `aio_pad_bookings` | 5 | `bookings` (`kind='stay'`) |
| `affiliate_clicks` | 154 | `touchpoints` *(optional — analytics, §9.3)* |
| `private_session_blocks` | 3 | `bookings` or skip *(§9.4)* |
| `surveys` / `survey_fields` / `survey_responses` / `survey_answers` | 2 / 6 / 6 / 18 | **no `company_os` home** — skip or flatten *(§9.2)* |
| `memberships`, `activity_log`, `private_session_bookings`, `affiliate_payouts`, `aio_pad_car_bookings` | 0 | nothing to migrate |

All target tables for products/orders/affiliates/event_registrations/bookings/touchpoints
are currently **empty**, which enables the UUID-preserving strategy below.

## 3. Strategy

1. **Preserve source UUIDs** for every table *except* `people`. Because the target tables
   are empty, inserting with the original `id` causes no PK collisions and keeps all
   foreign keys (`order_id`, `product_id`, `affiliate_id`, `person_id`) valid with no
   remapping — *except* where a person is de-duplicated (next point).
2. **De-duplicate `people` by email** (`company_os.people.email` is unique/citext). For each
   source person: insert preserving its `id` `ON CONFLICT (email) DO NOTHING`. The
   *effective* person id = `company_os.people.id` for that email (the new one if inserted,
   or the pre-existing one if the email already lived in `company_os`).
3. **Build a person map** `old_person_id → effective_id` (only differs for emails that
   already existed in `company_os`). After loading dependent tables with their *source*
   `person_id`, run one `UPDATE … FROM map WHERE old_id <> new_id` per table to fix the
   de-duplicated minority.
4. **Tag every row**: `brand_id` = CAIO Coach; on tables with a `metadata` jsonb
   (`inquiries`, `orders`, `bookings`, `products`) add `metadata.legacy_source='caiocoach'`
   (+ `legacy_id` where the id isn't preserved). `orders.legal_entity_id` = AI Officer Institute.
5. **Idempotent**: all inserts `ON CONFLICT (id) DO NOTHING` (people: `ON CONFLICT (email)`).
   Re-running migrates only what's missing.

## 4. Per-table mapping (key columns)

**people** → `people`: `id`(preserve), `email`, `name`→`full_name`, `phone`,
`source_site`→`source` (default `caiocoach.com`), `source_brand_id`=CAIO Coach,
`ok_to_contact`→`do_not_contact` (negated), `created_at`. `company`/`role` have no column on
`people` → see §9.1 (notes vs `companies`/`person_companies`).

**person_brands** (new link per migrated person): `person_id`=effective, `brand_id`=CAIO
Coach, `relationship_type`/`lifecycle_stage` = `'customer'` if the person has a paid order
else `'lead'`, `source='caiocoach-migration'`.

**affiliates** → `affiliates`: `id`(preserve), `code`, `person_id`(remap), `brand_id`=CAIO
Coach, `rate`, `stripe_coupon_id`, `active`, `notes` (append `referred_by`/`code_discount`/
`code_commission`). `program_type` defaults to `commission`.

**products** → `products`: nearly 1:1 (`id` preserve, `type`, `slug`, `title`, `subtitle`,
`description`, `date_start/end`, `location`, `capacity`, `cohort_slug`, `tier`,
`payment_method_local_vn`, `stripe_product_id`, `stripe_price_id`, `amount_cents`,
`currency`, `active`), set `brand_id`=CAIO Coach, `legal_entity_id`=AI Officer Institute.
Verify `products.type` allows `event`/`private_sprint`/`membership` (§9.5).

**inquiries** → `inquiries`: `id`(preserve), `person_id`(remap), `brand_id`=CAIO Coach,
`type` (values already valid), `subject`, `message`, `source`, `source_site`, `status`
(values already valid), `affiliate_id`(preserve), `metadata` (+ `date_requested`, legacy tag).

**orders** → `orders`: `id`(preserve), `person_id`(remap), `product_id`(preserve),
`brand_id`=CAIO Coach, `legal_entity_id`=AI Officer Institute, `payment_method`/`status`
(valid), `stripe_*`, `amount_cents`, `tax_cents`, `currency`, `refunded_cents`,
`seat_hold_expires_at`, `affiliate_id`(preserve), `metadata` (+ `amount_usd_cents`,
`stripe_fee_cents`, `fx_rate`, `vnd_amount`, legacy tag).

**event_registrations** → `event_registrations`: `id`(preserve), `order_id`(preserve),
`product_id`(preserve), `person_id`(remap), `attendee_name`, `attendee_email`, `status`.

**affiliate_commissions** → `affiliate_commissions`: `id`(preserve), `affiliate_id`(preserve),
`order_id`(preserve), `source_event`, `source_ref`, `gross_cents`, `rate`,
`commission_cents`, `payout_id` (null — payouts empty), `notes` (+ usd/fx columns), `created_at`.

**aio_pad_bookings** → `bookings`: `id`(preserve), `person_id`(remap), `brand_id`=CAIO Coach,
`kind='stay'`, `check_in`→`start_date`, `check_out`→`end_date`, `num_guests`→`party_size`,
`amount_cents`, `currency`, `status` (`paid`→`confirmed`, `pending`→`pending`),
`metadata` (`unit_slug`, `nights`, `stripe_session_id`, legacy tag).

**affiliate_clicks** → `touchpoints` *(optional)*: `id`(preserve), `affiliate_id`(preserve),
`code`, `visitor_id`, `source_site`, `landing_path`, `user_agent`, `ip`,
`created_at`→`occurred_at`, `brand_id`=CAIO Coach.

## 5. Value mappings

Almost everything is compatible. Only fixes:
- `aio_pad_bookings.status`: `paid` → `confirmed` (company_os `bookings.status` lacks `paid`).
- Confirm `products.type` constraint accepts `event`/`private_sprint`/`membership` (§9.5);
  if constrained, map unknowns → `other`.

## 6. Migration mechanism

For ~250 rows, do it MCP-driven and idempotent, in FK order:
`people → person_brands → affiliates → products → inquiries → orders →
event_registrations → affiliate_commissions → bookings(aio_pad) → touchpoints(opt)`.

Per table: read source rows via the caio-coach connector; generate a multi-row
`INSERT … ON CONFLICT DO NOTHING` for `company_os` via the target connector (source can emit
ready-to-run `INSERT` text via `format()`). After all person-referencing tables are loaded,
run the per-table `person_id` remap `UPDATE` for de-duplicated people (§3.3).

(Alternative for larger/repeat runs: a Node script using both projects' pooled connection
strings — needs each project's DB password. Overkill at this volume.)

## 7. Idempotency & rollback

- **Re-run**: every insert is `ON CONFLICT DO NOTHING`; a second run is a no-op.
- **Rollback**: delete by the known source-UUID sets (we preserved ids), child→parent order;
  remove `person_brands where source='caiocoach-migration'`; delete people **only** those
  newly inserted (ids in the source-people set that aren't pre-existing edge8/AIO records —
  email-matched people keep their original company_os id and are left untouched).
- Rows carry `metadata.legacy_source='caiocoach'` (where metadata exists) as a second handle.

## 8. Safety

- All writes are `company_os`-only (service_role); **no changes to caio-coach** (read-only).
- Take a pre-migration row-count snapshot of the affected `company_os` tables.
- Run in a transaction per table where possible; verify counts after each.

## 9. Open decisions

1. **`company`/`role`** on people → store in `people.notes`, or model as
   `companies` + `person_companies`? (recommend `notes` for v1.)
2. **Surveys** (2 surveys / 18 answers) → skip (recommend), or flatten responses into
   `inquiries`/`metadata`, or create a survey schema in `company_os`?
3. **`affiliate_clicks`** (154) → migrate into `touchpoints` (recommend yes — clean fit) or skip?
4. **`private_session_blocks`** (3) → skip (recommend) or map to `bookings`?
5. Confirm `products.type` check-constraint values (and any `bookings.kind='stay'` is allowed — it is).
6. **De-dup policy**: when a caio-coach email already exists in `company_os`, keep the
   existing person and just add the brand link + their caio-coach inquiries/orders? (recommend yes.)

## 10. Build steps (once §9 settled)

1. Snapshot target counts; confirm CAIO Coach brand + AI Officer Institute entity ids.
2. Load `people` (preserve id, on-conflict email) → build person map.
3. Load `affiliates`, `products` (preserve ids, brand/entity tags).
4. Load `inquiries`, `orders` (preserve ids; metadata + legacy tags).
5. Load `event_registrations`, `affiliate_commissions`, `bookings` (aio_pad), `touchpoints` (opt).
6. Run `person_id` remap UPDATEs for de-duplicated people.
7. Add `person_brands` links.
8. Verify (§11). Keep the rollback script ready.

## 11. Verification

- Target row counts increased by exactly the migrated counts per table.
- Spot-check: a caio-coach person with a paid order resolves end-to-end in `company_os`
  (`people → orders → event_registrations`, brand = CAIO Coach).
- No FK violations; no caio-coach rows missing; re-run is a clean no-op.
- caio-coach data tagged brand=CAIO Coach and distinguishable from Edge8/AIO rows.
