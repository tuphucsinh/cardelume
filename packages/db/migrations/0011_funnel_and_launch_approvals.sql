-- CARDELUME 0.4.3 Step 17F: privacy-minimized funnel analytics + explicit launch approvals.
-- Apply after 0010_template_portfolio_v2.sql.
--
-- Goals:
-- - customer funnel events never store greeting copy, recipient names, photos, IPs or raw anonymous UUIDs;
-- - authoritative payment/final-render stages can be recorded server-side from an order;
-- - technical template activation is separate from explicit owner launch approval;
-- - launch approval evidence is immutable/auditable and version-bound.

create table if not exists funnel_events (
  id uuid primary key default gen_random_uuid(),
  subject_hash text not null,
  event_type text not null,
  order_id uuid null references orders(id) on delete set null,
  template_id uuid null references templates(id) on delete set null,
  template_version_id uuid null references template_versions(id) on delete set null,
  market text not null default 'GLOBAL',
  locale text not null default 'en',
  currency text not null default 'OTHER',
  pricing_variant text not null default 'unknown',
  purchase_kind text not null default 'single',
  direction text null,
  photo_used boolean null,
  source text not null default 'web',
  dedupe_key text null,
  created_at timestamptz not null default now(),
  constraint funnel_event_type_check check(event_type in (
    'studio_started','generation_requested','results_viewed','direction_selected',
    'finish_opened','checkout_opened','checkout_started','payment_completed',
    'final_render_completed','download_jpg','download_pdf','share_started','refund_requested'
  )),
  constraint funnel_source_check check(source in ('web','payment_webhook','worker','recovery')),
  constraint funnel_subject_hash_check check(subject_hash ~ '^[a-f0-9]{64}$')
);

create unique index if not exists funnel_events_dedupe_uidx
  on funnel_events(dedupe_key) where dedupe_key is not null;
create index if not exists funnel_events_created_idx on funnel_events(created_at desc);
create index if not exists funnel_events_type_created_idx on funnel_events(event_type,created_at desc);
create index if not exists funnel_events_market_created_idx on funnel_events(market,created_at desc);

alter table funnel_events enable row level security;
-- No anonymous/client RLS policy. Writes occur through validated server routes / worker role only.

create table if not exists template_launch_approvals (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete restrict,
  template_version_id uuid not null references template_versions(id) on delete restrict,
  decision text not null,
  actor text not null,
  benchmark_evidence text null,
  ip_evidence text null,
  human_review_evidence text null,
  note text null,
  created_at timestamptz not null default now(),
  constraint template_launch_approval_decision_check check(decision in ('approved','candidate','hold','rework','rejected')),
  constraint template_launch_approval_actor_check check(length(actor) between 1 and 160),
  constraint template_launch_approval_note_check check(note is null or length(note)<=2000),
  constraint template_launch_approved_evidence_check check(
    decision <> 'approved' or (
      benchmark_evidence is not null and length(trim(benchmark_evidence))>0 and
      ip_evidence is not null and length(trim(ip_evidence))>0 and
      human_review_evidence is not null and length(trim(human_review_evidence))>0
    )
  )
);

create index if not exists template_launch_approvals_template_idx
  on template_launch_approvals(template_id,created_at desc);
create index if not exists template_launch_approvals_version_idx
  on template_launch_approvals(template_version_id,created_at desc);

alter table template_launch_approvals enable row level security;
-- Internal admin/service-role only; no public policy.

-- Evidence rows are append-only. A later decision creates a new row; historical evidence cannot be rewritten.
create or replace function cardelume_reject_launch_approval_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'template_launch_approvals_are_immutable';
end;
$$;

drop trigger if exists template_launch_approvals_immutable on template_launch_approvals;
create trigger template_launch_approvals_immutable
before update or delete on template_launch_approvals
for each row execute function cardelume_reject_launch_approval_mutation();

-- Defensive trigger: every pixel-affecting current-version change invalidates prior launch approval.
create or replace function cardelume_demote_template_launch_on_version_change()
returns trigger language plpgsql as $$
begin
  if new.current_version_id is distinct from old.current_version_id and old.launch_status='approved' then
    new.launch_status := 'candidate';
  end if;
  return new;
end;
$$;

drop trigger if exists templates_demote_launch_on_version_change on templates;
create trigger templates_demote_launch_on_version_change
before update of current_version_id on templates
for each row execute function cardelume_demote_template_launch_on_version_change();
