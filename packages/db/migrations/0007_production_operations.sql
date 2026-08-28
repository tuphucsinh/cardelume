-- CARDELUME 0.4.3 step 9: production operations health + server-side abuse guards.
-- Apply after 0006_durable_generation.sql.

create table if not exists request_rate_buckets (
  bucket_key text not null,
  subject_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(bucket_key, subject_key, window_start),
  constraint request_rate_buckets_count_check check(request_count >= 0)
);

create index if not exists request_rate_buckets_cleanup_idx
  on request_rate_buckets(window_start);

-- These tables are operational/server-only. Browser roles get no policy.
alter table worker_heartbeats enable row level security;
alter table request_rate_buckets enable row level security;
