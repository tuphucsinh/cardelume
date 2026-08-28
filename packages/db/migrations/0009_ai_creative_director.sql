-- CARDELUME 0.4.3 step 13: content-free recent style memory and AI usage ledger.

create table if not exists style_fingerprints (
  id uuid primary key,
  user_id uuid not null,
  template_id uuid not null references templates(id),
  template_version_id uuid not null,
  family_id uuid not null references template_families(id),
  visual_direction text not null,
  accent_mode text check(accent_mode is null or accent_mode in ('original','photo','navy','sage','rose')),
  source text not null check(source in ('selected','checkout','paid')),
  source_key text unique,
  created_at timestamptz not null default now(),
  foreign key(template_id,template_version_id) references template_versions(template_id,id)
);
create index if not exists style_fingerprints_user_recent_idx on style_fingerprints(user_id,created_at desc);

create table if not exists generation_ai_usage (
  id uuid primary key,
  generation_job_id uuid not null,
  phase text not null check(phase in ('creative_director','expanded_director','critic_repair')),
  provider text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer not null check(latency_ms >= 0),
  estimated_cost_micros integer,
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);
create index if not exists generation_ai_usage_job_idx on generation_ai_usage(generation_job_id,created_at);

alter table style_fingerprints enable row level security;
alter table generation_ai_usage enable row level security;
