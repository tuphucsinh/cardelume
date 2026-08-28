-- CARDELUME 0.4.3 step 7: trusted photo upload + private asset binding.
-- Apply after 0004_verified_dodo_checkout.sql.
-- Browser uploads only to a server-chosen quarantine key. A clean object becomes
-- renderable only after server decode/re-encode and an explicit card-version binding.

create table if not exists photo_assets (
  id uuid primary key,
  user_id uuid not null,
  status text not null default 'uploading',
  original_name text null,
  source_content_type text not null,
  source_size_bytes integer not null,
  quarantine_object_key text not null,
  clean_object_key text not null,
  clean_content_type text null,
  clean_size_bytes integer null,
  width integer null,
  height integer null,
  sha256 text null,
  completion_token_hash text not null,
  failure_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz null,
  deleted_at timestamptz null,
  constraint photo_assets_status_check check(status in ('uploading','processing','ready','failed','deleted')),
  constraint photo_assets_completion_token_unique unique(completion_token_hash),
  constraint photo_assets_quarantine_key_unique unique(quarantine_object_key),
  constraint photo_assets_clean_key_unique unique(clean_object_key)
);

create table if not exists card_asset_bindings (
  resource_version_id uuid not null references card_versions(id) on delete cascade,
  asset_id uuid not null references photo_assets(id),
  role text not null default 'photo',
  created_at timestamptz not null default now(),
  primary key(resource_version_id,asset_id),
  constraint card_asset_bindings_role_check check(role in ('photo'))
);

create index if not exists photo_assets_user_created_idx on photo_assets(user_id,created_at desc);
create index if not exists photo_assets_cleanup_idx on photo_assets(status,created_at);
create index if not exists card_asset_bindings_asset_idx on card_asset_bindings(asset_id);

alter table photo_assets enable row level security;
alter table card_asset_bindings enable row level security;
-- Intentionally no browser RLS policies. Server/direct DB roles mediate every
-- upload/complete/bind/read action after capability + ownership verification.
