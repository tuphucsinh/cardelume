-- CARDELUME 0.4.3 step 6: verified Dodo checkout/payment boundary.
-- Apply after 0003_production_export_commerce_boundary.sql.
--
-- Security/correctness goals:
-- - one pending order + persisted CardDocument snapshot per client idempotency key;
-- - provider checkout/payment IDs are unique and server-bound;
-- - only a verified webhook may transition an order to PAID;
-- - webhook processing is resumable: PAID is durable before fulfillment, while
--   payment_events.processed remains false until recovery/final jobs are queued.

alter table orders
  add column if not exists checkout_idempotency_key text null,
  add column if not exists checkout_request_hash text null,
  add column if not exists payment_provider text not null default 'dodo',
  add column if not exists provider_checkout_id text null,
  add column if not exists provider_checkout_url text null,
  add column if not exists provider_checkout_creation_token text null,
  add column if not exists provider_checkout_creating_at timestamptz null,
  add column if not exists pricing_market text null,
  add column if not exists pricing_display text null,
  add column if not exists paid_at timestamptz null;

create unique index if not exists orders_checkout_idempotency_uidx
  on orders(user_id,checkout_idempotency_key)
  where checkout_idempotency_key is not null;
create unique index if not exists orders_provider_checkout_uidx
  on orders(provider_checkout_id)
  where provider_checkout_id is not null;
create unique index if not exists orders_provider_payment_uidx
  on orders(provider_payment_id)
  where provider_payment_id is not null;

alter table payment_events
  add column if not exists order_id uuid null references orders(id),
  add column if not exists outcome text null,
  add column if not exists processed_at timestamptz null;

create index if not exists payment_events_order_idx on payment_events(order_id);
