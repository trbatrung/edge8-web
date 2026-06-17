-- Vietnam Adventure info form: families + members + private passport bucket.
-- Run this in the Supabase SQL editor (or via CLI) before deploying the form.

-- Family-level submission (one row per family).
create table if not exists public.trip_families (
  id            uuid primary key default gen_random_uuid(),
  family_name   text not null,
  contact_name  text not null,
  contact_email text not null,
  contact_phone text,
  source        text default 'edge8.ai/vietnam-adventure-info-form',
  created_at    timestamptz not null default now()
);

-- One row per traveler. tshirt_size is constrained to the adult range.
create table if not exists public.trip_members (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.trip_families(id) on delete cascade,
  full_name     text not null,
  tshirt_size   text not null check (tshirt_size in ('XS','S','M','L','XL','2XL','3XL')),
  passport_path text,                        -- nullable: path in the private 'passports' bucket
  created_at    timestamptz not null default now()
);

create index if not exists trip_members_family_id_idx on public.trip_members(family_id);

-- Enable RLS with NO policies => deny all access to anon/authenticated clients.
-- The Next.js server route uses the service-role key, which bypasses RLS.
alter table public.trip_families enable row level security;
alter table public.trip_members enable row level security;

-- Private storage bucket for passport images. No storage policies are created,
-- so only the service-role key can read/write. Admins view via signed URLs only.
insert into storage.buckets (id, name, public)
values ('passports', 'passports', false)
on conflict (id) do nothing;
