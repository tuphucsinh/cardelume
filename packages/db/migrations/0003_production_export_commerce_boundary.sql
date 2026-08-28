-- CARDELUME 0.4.3 step 2: production export + minimal shared commerce boundary.
-- Apply after 0002_secure_paid_recovery.sql.
--
-- This is intentionally small:
-- - recovery can resolve locale from orders without joining the Card domain;
-- - order_items gives current single-card orders and the already-planned
--   dormant 5-card bundle one common commerce boundary;
-- - download entitlements link to order_items and gain a retry idempotency key.
-- Existing cards/card_versions/orders.card_id remain for backward compatibility.

alter table orders
  add column if not exists product_key text not null default 'cardelume',
  add column if not exists locale text null;

update orders o
set locale = c.locale
from cards c
where o.locale is null and c.id = o.card_id;

update orders set locale='en' where locale is null;
alter table orders alter column locale set default 'en';
alter table orders alter column locale set not null;

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_key text not null default 'cardelume',
  resource_id uuid not null,
  resource_version_id uuid null,
  created_at timestamptz not null default now(),
  constraint order_items_resource_unique unique(order_id,product_key,resource_id)
);

insert into order_items(order_id,product_key,resource_id,resource_version_id)
select o.id,coalesce(o.product_key,'cardelume'),o.card_id,c.selected_version_id
from orders o
join cards c on c.id=o.card_id
on conflict(order_id,product_key,resource_id) do update set
  resource_version_id=coalesce(order_items.resource_version_id,excluded.resource_version_id);

alter table download_entitlements
  add column if not exists order_item_id uuid null references order_items(id),
  add column if not exists idempotency_key text null;

update download_entitlements de
set order_item_id=oi.id
from order_items oi
where de.order_item_id is null
  and oi.order_id=de.order_id
  and oi.product_key='cardelume';

-- Every entitlement belongs to a paid commerce item. Existing baseline rows can
-- all be backfilled through orders.card_id above.
alter table download_entitlements alter column order_item_id set not null;

create unique index if not exists download_entitlements_idempotency_uidx
  on download_entitlements(idempotency_key)
  where idempotency_key is not null;
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists order_items_resource_idx on order_items(product_key,resource_id);
create index if not exists download_entitlements_order_item_idx on download_entitlements(order_item_id);

alter table order_items enable row level security;
drop policy if exists "order_items_own_select" on order_items;
create policy "order_items_own_select" on order_items
for select using (
  exists(select 1 from orders o where o.id=order_items.order_id and o.user_id=auth.uid())
);
