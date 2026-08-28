-- CARDELUME 0.4.3 step 8: durable generation queue/status.
-- Apply after 0005_trusted_photo_assets.sql.
alter table generation_jobs
  add column if not exists idempotency_key text null,
  add column if not exists request_hash text null,
  add column if not exists brief jsonb null,
  add column if not exists stage integer not null default 0,
  add column if not exists result jsonb null,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists started_at timestamptz null,
  add column if not exists completed_at timestamptz null;

create unique index if not exists generation_jobs_user_idempotency_uidx
  on generation_jobs(user_id,idempotency_key) where idempotency_key is not null;
create index if not exists generation_jobs_status_created_idx on generation_jobs(status,created_at);
