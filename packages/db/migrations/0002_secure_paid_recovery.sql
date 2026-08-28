-- CARDELUME 0.4.3 step 1: secure paid recovery.
-- Apply after 0001_core.sql.
--
-- Security model:
-- - Durable recovery token is 256-bit random; only SHA-256(token) is stored.
-- - Browser claim mints a separate HttpOnly cookie session; no raw durable
--   recovery secret is stored in localStorage.
-- - Recovery/session/return-claim tables are server-only. RLS is enabled and
--   intentionally has no anon/authenticated-user policy.
-- - Final objects stay private. Recovery download routes mint short-lived R2
--   signed URLs only after entitlement + paid-order verification.

alter table download_entitlements
  add column if not exists card_id uuid null references cards(id),
  add column if not exists asset_kind text not null default 'final',
  add column if not exists download_name text null,
  add column if not exists content_type text null;

create index if not exists download_entitlements_order_idx
  on download_entitlements(order_id);
create index if not exists download_entitlements_card_idx
  on download_entitlements(card_id);

create table if not exists purchase_recoveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint purchase_recoveries_order_unique unique(order_id),
  constraint purchase_recoveries_token_hash_unique unique(token_hash)
);

create table if not exists recovery_sessions (
  id uuid primary key default gen_random_uuid(),
  recovery_id uuid not null references purchase_recoveries(id) on delete cascade,
  session_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_used_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint recovery_sessions_hash_unique unique(session_hash)
);

create table if not exists checkout_return_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  claim_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint checkout_return_claims_order_unique unique(order_id),
  constraint checkout_return_claims_hash_unique unique(claim_hash)
);

create index if not exists purchase_recoveries_user_idx
  on purchase_recoveries(user_id);
create index if not exists recovery_sessions_recovery_idx
  on recovery_sessions(recovery_id);

alter table purchase_recoveries enable row level security;
alter table recovery_sessions enable row level security;
alter table checkout_return_claims enable row level security;

-- Intentionally no public/user RLS policies for the recovery-secret tables.
-- Server/direct DB roles handle them after bearer/session proof verification.
