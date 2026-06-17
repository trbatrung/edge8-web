-- Allow multiple passport photos per traveler.
-- Supersedes trip_members.passport_path (kept, unused, to avoid a destructive drop).

create table if not exists public.trip_passports (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.trip_members(id) on delete cascade,
  path       text not null,                 -- object path in the private 'passports' bucket
  created_at timestamptz not null default now()
);

create index if not exists trip_passports_member_id_idx on public.trip_passports(member_id);

-- Enable RLS with NO policies => deny all to anon/authenticated clients.
-- The Next.js server route uses the service-role key, which bypasses RLS.
alter table public.trip_passports enable row level security;
