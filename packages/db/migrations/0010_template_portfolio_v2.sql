-- CARDELUME 0.4.3 Step 17E: launch-safe template portfolio V2.
-- Separates technical runtime status from production-launch approval and adds
-- original CardeLume procedural families as non-production experiment candidates.

alter table templates add column if not exists launch_status text not null default 'candidate';

alter table templates drop constraint if exists templates_launch_status_check;
alter table templates add constraint templates_launch_status_check
  check(launch_status in ('experiment','candidate','approved','hold','retired'));

create index if not exists templates_launch_status_idx
  on templates(launch_status,status,health,editorial_score desc);

-- Step 17D portfolio review: weak/redundant/culturally-shorthand legacy families
-- remain immutable historical versions but are held out of normal catalogs.
update templates set launch_status='hold',updated_at=now()
where slug in (
  'washi-elegance','soft-seoul','watercolor-bloom','golden-hour','quiet-noir',
  'bold-pop','kawaii-joy','celestial-night','little-wonders'
) and launch_status<>'retired';

-- The seven retained legacy families are launch candidates, not approved.
update templates set launch_status='candidate',updated_at=now()
where slug in (
  'luxury-editorial','midnight-lume','botanical-poise','art-deco-noir',
  'photo-story','quiet-minimal','classic-letterpress'
) and launch_status not in ('approved','retired');

insert into template_families(id,name,slug) values
('20000000-0000-4000-8000-000000000101','Whispered Type','whispered-type'),
('20000000-0000-4000-8000-000000000102','Museum Note','museum-note'),
('20000000-0000-4000-8000-000000000103','Monogram Orbit','monogram-orbit'),
('20000000-0000-4000-8000-000000000104','Ribbon Line','ribbon-line'),
('20000000-0000-4000-8000-000000000105','Memory Window','memory-window'),
('20000000-0000-4000-8000-000000000106','Type Celebration','type-celebration'),
('20000000-0000-4000-8000-000000000107','Quiet Seal','quiet-seal'),
('20000000-0000-4000-8000-000000000108','Pressed Shadow','pressed-shadow'),
('20000000-0000-4000-8000-000000000109','Ink Pause','ink-pause'),
('20000000-0000-4000-8000-000000000110','Petal Geometry','petal-geometry'),
('20000000-0000-4000-8000-000000000111','Night Ledger','night-ledger'),
('20000000-0000-4000-8000-000000000112','Soft Fold','soft-fold')
on conflict do nothing;

insert into templates(id,family_id,slug,name,material,status,launch_status,health,photo_mode,editorial_score,maturity) values
('10000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000101','whispered-type','Whispered Type','Type · Hairline','active','experiment','healthy','none',94,'new'),
('10000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000102','museum-note','Museum Note','Editorial · Rule grid','active','experiment','healthy','optional',95,'new'),
('10000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000103','monogram-orbit','Monogram Orbit','Parametric · Personal mark','active','experiment','healthy','none',96,'new'),
('10000000-0000-4000-8000-000000000104','20000000-0000-4000-8000-000000000104','ribbon-line','Ribbon Line','Continuous line · Motion','active','experiment','healthy','none',94,'new'),
('10000000-0000-4000-8000-000000000105','20000000-0000-4000-8000-000000000105','memory-window','Memory Window','Photo fragment · Caption','active','experiment','healthy','optional',96,'new'),
('10000000-0000-4000-8000-000000000106','20000000-0000-4000-8000-000000000106','type-celebration','Type Celebration','Kinetic type · Rule','active','experiment','healthy','none',93,'new'),
('10000000-0000-4000-8000-000000000107','20000000-0000-4000-8000-000000000107','quiet-seal','Quiet Seal','Personal seal · Negative space','active','experiment','healthy','none',97,'new'),
('10000000-0000-4000-8000-000000000108','20000000-0000-4000-8000-000000000108','pressed-shadow','Pressed Shadow','Layered relief · Paper depth','active','experiment','healthy','none',94,'new'),
('10000000-0000-4000-8000-000000000109','20000000-0000-4000-8000-000000000109','ink-pause','Ink Pause','Abstract ink · Pause','active','experiment','healthy','none',95,'new'),
('10000000-0000-4000-8000-000000000110','20000000-0000-4000-8000-000000000110','petal-geometry','Petal Geometry','Parametric ellipse · Botanical abstraction','active','experiment','healthy','none',93,'new'),
('10000000-0000-4000-8000-000000000111','20000000-0000-4000-8000-000000000111','night-ledger','Night Ledger','Nocturne · Coordinate light','active','experiment','healthy','none',97,'new'),
('10000000-0000-4000-8000-000000000112','20000000-0000-4000-8000-000000000112','soft-fold','Soft Fold','Fold geometry · Quiet plane','active','experiment','healthy','optional',94,'new')
on conflict do nothing;

insert into template_versions(id,template_id,version,renderer_template_key,visual_direction,supported_formats,script_support,headline_capacity,body_capacity,validation_status,validation_notes) values
('30000000-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000101',1,'whispered-type','whispered','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000102',1,'museum-note','museum','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','long','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000103',1,'monogram-orbit','orbit','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000104','10000000-0000-4000-8000-000000000104',1,'ribbon-line','ribbon','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000105',1,'memory-window','memory','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','short','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000106','10000000-0000-4000-8000-000000000106',1,'type-celebration','typecelebration','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000107','10000000-0000-4000-8000-000000000107',1,'quiet-seal','seal','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','long','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000108','10000000-0000-4000-8000-000000000108',1,'pressed-shadow','pressed','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000109','10000000-0000-4000-8000-000000000109',1,'ink-pause','ink','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000110','10000000-0000-4000-8000-000000000110',1,'petal-geometry','petal','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000111','10000000-0000-4000-8000-000000000111',1,'night-ledger','ledger','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','medium','passed','Step 17E source/layout validation only; production approval remains separate.'),
('30000000-0000-4000-8000-000000000112','10000000-0000-4000-8000-000000000112',1,'soft-fold','softfold','["portrait-5x7","folded-5x7","square-5x5","landscape-7x5","postcard-6x4"]','["latin","cjk","hangul"]','medium','long','passed','Step 17E source/layout validation only; production approval remains separate.')
on conflict do nothing;

update templates t set current_version_id=v.id,updated_at=now()
from template_versions v
where v.template_id=t.id and v.version=1 and t.id::text like '10000000-0000-4000-8000-0000000001%' and t.current_version_id is null;

-- Conservative broad priors. Model/Golden evidence may tune these later; they are soft only.
insert into template_targeting(template_id,dimension,target_key,affinity) values
('10000000-0000-4000-8000-000000000101','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000101','feeling','Elegant',0.9800),('10000000-0000-4000-8000-000000000101','feeling','Romantic',0.8600),('10000000-0000-4000-8000-000000000101','occasion','Anniversary',0.9200),('10000000-0000-4000-8000-000000000101','occasion','Thank You',0.9200),
('10000000-0000-4000-8000-000000000102','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000102','feeling','Elegant',0.9800),('10000000-0000-4000-8000-000000000102','occasion','Thank You',0.9600),('10000000-0000-4000-8000-000000000102','occasion','Anniversary',0.8600),
('10000000-0000-4000-8000-000000000103','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000103','feeling','Elegant',0.9200),('10000000-0000-4000-8000-000000000103','occasion','Birthday',0.9400),('10000000-0000-4000-8000-000000000103','occasion','Congratulations',0.9400),
('10000000-0000-4000-8000-000000000104','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000104','feeling','Warm',0.9400),('10000000-0000-4000-8000-000000000104','feeling','Romantic',0.9600),('10000000-0000-4000-8000-000000000104','occasion','Thank You',0.9400),
('10000000-0000-4000-8000-000000000105','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000105','feeling','Warm',0.9800),('10000000-0000-4000-8000-000000000105','occasion','Birthday',0.9600),('10000000-0000-4000-8000-000000000105','occasion','Anniversary',0.9600),
('10000000-0000-4000-8000-000000000106','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000106','feeling','Fun',0.9600),('10000000-0000-4000-8000-000000000106','occasion','Birthday',0.9900),('10000000-0000-4000-8000-000000000106','occasion','Congratulations',0.9900),
('10000000-0000-4000-8000-000000000107','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000107','feeling','Elegant',0.9900),('10000000-0000-4000-8000-000000000107','occasion','Thank You',0.9400),('10000000-0000-4000-8000-000000000107','occasion','Anniversary',0.9400),
('10000000-0000-4000-8000-000000000108','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000108','feeling','Elegant',0.9400),('10000000-0000-4000-8000-000000000108','occasion','Congratulations',0.9600),
('10000000-0000-4000-8000-000000000109','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000109','feeling','Warm',0.9600),('10000000-0000-4000-8000-000000000109','feeling','Romantic',0.9600),('10000000-0000-4000-8000-000000000109','occasion','Thank You',0.9800),
('10000000-0000-4000-8000-000000000110','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000110','feeling','Warm',0.9400),('10000000-0000-4000-8000-000000000110','occasion','Birthday',0.9200),('10000000-0000-4000-8000-000000000110','occasion','Thank You',0.9600),
('10000000-0000-4000-8000-000000000111','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000111','feeling','Elegant',0.9800),('10000000-0000-4000-8000-000000000111','feeling','Romantic',0.9400),('10000000-0000-4000-8000-000000000111','occasion','Anniversary',0.9800),
('10000000-0000-4000-8000-000000000112','market','GLOBAL',0.9000),('10000000-0000-4000-8000-000000000112','feeling','Elegant',0.9600),('10000000-0000-4000-8000-000000000112','feeling','Warm',0.9000),('10000000-0000-4000-8000-000000000112','occasion','Thank You',0.9800),('10000000-0000-4000-8000-000000000112','occasion','Congratulations',0.9400)
on conflict(template_id,dimension,target_key) do update set affinity=excluded.affinity;
