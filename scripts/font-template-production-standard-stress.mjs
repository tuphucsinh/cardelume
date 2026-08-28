import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
let checks=0; const assert=(v,m)=>{checks++; if(!v) throw new Error(m)};
const fonts=read('licenses/fonts/FONT_CANDIDATE_CATALOG.json');
const fontStd=read('quality/standards/FONT_PRODUCTION_STANDARD_V1.json');
const tplStd=read('quality/standards/TEMPLATE_PRODUCTION_STANDARD_V1.json');
const readiness=read('quality/template-audit/CURRENT_16_TEMPLATE_READINESS.json');
const concepts=read('experiments/template-concepts/TEMPLATE_CONCEPTS_V2.json');
const typo=read('experiments/typography/TYPOGRAPHY_CANDIDATES_V1.json');
const launch=read('quality/template-audit/LAUNCH_PORTFOLIO_CANDIDATES_V1.json');

assert(fonts.schemaVersion>=2,'font_catalog_schema');
const ids=new Set(); const families=new Set();
for(const f of fonts.candidates){
 assert(!ids.has(f.id),`duplicate_font_id:${f.id}`); ids.add(f.id); families.add(f.family);
 assert(f.license==='OFL-1.1',`non_ofl_candidate:${f.id}`);
 assert(f.commercialUseAllowed===true,`commercial_use_not_allowed:${f.id}`);
 assert(/^https:\/\//.test(f.evidenceUrl||''),`missing_authoritative_evidence:${f.id}`);
 if((f.scripts||[]).includes('vietnamese')) assert(f.vietnamese===true,`vi_coverage_not_verified:${f.id}`);
}
for(const id of ['be-vietnam-pro','lora','spectral','source-serif-4','literata','crimson-pro']) assert(ids.has(id),`missing_new_font:${id}`);
assert(fontStd.hardGates.length>=9,'font_standard_too_weak');
assert(tplStd.hardGates.length>=13,'template_standard_too_weak');
assert(tplStd.designPrinciples.some(x=>x.includes('cultural')),'missing_cultural_stereotype_guard');

const currentIds=['luxury-editorial','midnight-lume','botanical-poise','washi-elegance','soft-seoul','art-deco-noir','photo-story','quiet-minimal','watercolor-bloom','golden-hour','quiet-noir','bold-pop','kawaii-joy','classic-letterpress','celestial-night','little-wonders'];
assert(readiness.templates.length===16,'template_readiness_count');
const rid=new Set(readiness.templates.map(x=>x.id)); for(const id of currentIds) assert(rid.has(id),`missing_template_readiness:${id}`);
for(const id of ['watercolor-bloom','golden-hour','bold-pop','kawaii-joy','little-wonders']){
 const r=readiness.templates.find(x=>x.id===id); assert(/REPLACE|REWORK/.test(r.decision),`generic_template_not_held:${id}`)
}
for(const id of ['washi-elegance','soft-seoul']){
 const r=readiness.templates.find(x=>x.id===id); assert(/REFRAME|RENAME/.test(r.decision),`cultural_label_not_guarded:${id}`)
}
for(const c of concepts.concepts){
 assert((c.candidateFonts||[]).every(f=>families.has(f)),`concept_font_not_cataloged:${c.id}`);
 assert(!String(c.assetStrategy||'').match(/stock|external|competitor/i),`unsafe_asset_strategy:${c.id}`);
}
assert(typo.experiments.some(x=>x.id==='vi-ui-specialist'),'missing_vi_specialist_experiment');
assert(typo.experiments.some(x=>x.id==='editorial-serif-depth'),'missing_editorial_serif_experiment');
assert(launch.originalExperimentCandidates.length===12,'launch_original_candidate_count');
assert(launch.legacyHoldOrReplace.length===9,'legacy_hold_replace_count');
for(const id of launch.originalExperimentCandidates) assert(concepts.concepts.some(x=>x.id===id),`launch_candidate_missing_concept:${id}`);
console.log(`font/template production standard stress: PASS (${checks} checks)`);
