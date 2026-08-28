-- CARDELUME baseline migration.
-- Run in Supabase SQL editor / controlled migration process.
-- Review in staging before production.

create extension if not exists pgcrypto;

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'draft',
  occasion text not null,
  locale text not null default 'en',
  selected_version_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  direction text not null,
  document jsonb not null,
  preview_object_key text null,
  created_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid not null references cards(id) on delete cascade,
  status text not null default 'queued',
  queue_job_id text null,
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid not null references cards(id),
  status text not null default 'pending',
  amount_minor integer not null,
  currency text not null default 'USD',
  provider_payment_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  processed boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists download_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid not null references orders(id) on delete cascade,
  final_object_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists worker_heartbeats (
  node_id text primary key,
  version text not null,
  active_jobs integer not null default 0,
  last_seen_at timestamptz not null default now()
);

-- User-owned RLS. Worker/admin direct DB roles must be separately controlled.
alter table cards enable row level security;
alter table card_versions enable row level security;
alter table generation_jobs enable row level security;
alter table orders enable row level security;
alter table download_entitlements enable row level security;

drop policy if exists "cards_own_all" on cards;
create policy "cards_own_all" on cards
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "generation_jobs_own_all" on generation_jobs;
create policy "generation_jobs_own_all" on generation_jobs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders_own_select" on orders;
create policy "orders_own_select" on orders
for select using (auth.uid() = user_id);

drop policy if exists "download_entitlements_own_select" on download_entitlements;
create policy "download_entitlements_own_select" on download_entitlements
for select using (auth.uid() = user_id);

-- card_versions ownership derives through cards.
drop policy if exists "card_versions_own_select" on card_versions;
create policy "card_versions_own_select" on card_versions
for select using (
  exists(select 1 from cards c where c.id = card_versions.card_id and c.user_id = auth.uid())
);

create index if not exists cards_user_created_idx on cards(user_id, created_at desc);
create index if not exists jobs_user_created_idx on generation_jobs(user_id, created_at desc);
create index if not exists orders_user_created_idx on orders(user_id, created_at desc);
