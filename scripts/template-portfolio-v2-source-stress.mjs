#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { rendererTemplateIds, templateArtSvg } from '../packages/renderer/src/template-art.ts';
import { templateLayoutProfile } from '../packages/renderer/src/template-layout.ts';
import { bootstrapTemplates, portfolioV2ExperimentTemplates, portfolioV2AllTemplates, rankTemplates, buildCreativeCandidatePack } from '../packages/templates/src/index.ts';

const root=path.resolve(import.meta.dirname,'..');
let checks=0; const assert=(v,m)=>{checks++;if(!v)throw new Error(`FAIL:${m}`)};
const v2Ids=['whispered-type','museum-note','monogram-orbit','ribbon-line','memory-window','type-celebration','quiet-seal','pressed-shadow','ink-pause','petal-geometry','night-ledger','soft-fold'];
const held=['washi-elegance','soft-seoul','watercolor-bloom','golden-hour','quiet-noir','bold-pop','kawaii-joy','celestial-night','little-wonders'];
assert(rendererTemplateIds.length===28,'renderer_has_28_ids');
assert(new Set(rendererTemplateIds).size===28,'renderer_ids_unique');
assert(portfolioV2ExperimentTemplates.length===12,'v2_seed_count');
assert(portfolioV2AllTemplates.length===28,'full_portfolio_count');
for(const id of v2Ids){
  assert(rendererTemplateIds.includes(id),`renderer_v2:${id}`);
  const t=portfolioV2ExperimentTemplates.find(x=>x.rendererTemplateKey===id);
  assert(Boolean(t),`managed_v2:${id}`);
  assert(t?.status==='active'&&t?.launchStatus==='experiment'&&t?.health==='healthy',`launch_isolation:${id}`);
  assert(t?.supportedFormats.length===5&&t?.scriptSupport.length===3,`declared_coverage:${id}`);
  const l=templateLayoutProfile(id);
  assert(l.xPct>=.08&&l.xPct<=.92&&l.kickerYPct>.08&&l.signatureYPct<.97,`layout_bounds:${id}`);
  assert(l.headlineYPct>l.kickerYPct&&l.bodyYPct>l.headlineYPct,`layout_vertical_order:${id}`);
  assert(l.headlineWidthPct>=60&&l.headlineWidthPct<=90&&l.bodyWidthPct>=60&&l.bodyWidthPct<=92,`layout_widths:${id}`);
  const svg=templateArtSvg({templateId:id,width:1500,height:2100,scale:1,accent:'#a38155',foreground:'#172038',background:'#f7f1e6'});
  assert(!/<script|foreignObject|https?:\/\/|href\s*=|xlink:href/i.test(svg),`no_external_active_content:${id}`);
}
assert(templateLayoutProfile('memory-window').photoWindow?.widthPct===.68,'memory_window_has_photo_zone');
assert(templateLayoutProfile('night-ledger').darkSurface===true,'night_ledger_dark_surface');
for(const id of held){
  const t=bootstrapTemplates.find(x=>x.rendererTemplateKey===id);
  assert(t?.launchStatus==='hold',`legacy_hold:${id}`);
}
const input={market:'GLOBAL',locale:'en',format:'portrait-5x7',feeling:'Elegant',occasion:'Anniversary',hasPhoto:false,catalogMode:'experiment'};
const ranked=rankTemplates(portfolioV2AllTemplates,input);
assert(ranked.length>=12,'experiment_has_substantive_candidate_pool');
assert(!ranked.some(x=>held.includes(x.template.rendererTemplateKey)),'held_legacy_not_ranked');
const pack=buildCreativeCandidatePack(portfolioV2AllTemplates,input);
assert(pack.fit.length<=6&&pack.wildcards.length<=2&&pack.all.length<=8,'step13_6_plus_2_preserved');
const productionRank=rankTemplates(portfolioV2AllTemplates,{...input,catalogMode:'production'});
assert(productionRank.length===0,'production_fails_closed_before_approval');
const migration=fs.readFileSync(path.join(root,'packages/db/migrations/0010_template_portfolio_v2.sql'),'utf8');
assert(migration.includes("launch_status in ('experiment','candidate','approved','hold','retired')"),'migration_launch_status_constraint');
assert((migration.match(/'30000000-0000-4000-8000-0000000001(?:0[1-9]|1[0-2])'/g)||[]).length===12,'migration_has_12_immutable_versions');
assert(migration.includes("launch_status='hold'")&&migration.includes("launch_status='candidate'"),'migration_legacy_portfolio_state');
const dbSource=fs.readFileSync(path.join(root,'packages/db/src/templates.ts'),'utf8');
assert(dbSource.includes("launch_status=case when launch_status='approved' then 'candidate' else launch_status end"),'pixel_version_activation_demotes_prior_launch_approval');
const adminCreate=fs.readFileSync(path.join(root,'apps/web/app/api/admin/templates/route.ts'),'utf8');
const adminVersion=fs.readFileSync(path.join(root,'apps/web/app/api/admin/templates/[templateId]/versions/route.ts'),'utf8');
assert(adminCreate.includes('portfolioV2AllTemplates')&&adminVersion.includes('portfolioV2AllTemplates'),'admin_recognizes_v2_renderer_registry');
assert(adminCreate.includes('["none","optional","required"]'),'admin_supports_optional_photo_mode');
console.log(`PASS template portfolio V2 source stress: ${checks} checks`);
