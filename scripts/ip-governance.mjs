#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(path.join(root,p));
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const rel=p=>p.split(path.sep).join('/');

const fontPath='licenses/fonts/FONT_LICENSE_MANIFEST.json';
const assetPath='licenses/assets/ASSET_PROVENANCE_MANIFEST.json';
const templatePath='licenses/templates/TEMPLATE_PROVENANCE_MANIFEST.json';
const VALID=new Set(['APPROVED','APPROVED_WITH_ATTRIBUTION','REJECTED','UNKNOWN']);
const APPROVED=new Set(['APPROVED','APPROVED_WITH_ATTRIBUTION']);

function walk(dir, out=[]){
  const abs=path.join(root,dir); if(!fs.existsSync(abs))return out;
  for(const e of fs.readdirSync(abs,{withFileTypes:true})){
    const child=path.join(dir,e.name);
    if(e.isDirectory())walk(child,out); else out.push(rel(child));
  }
  return out;
}
function discover(){
  const webPkg=json('apps/web/package.json');
  const npmFonts=Object.keys(webPkg.dependencies||{}).filter(x=>x.startsWith('@fontsource/')).sort();
  const docker=read('docker/worker.Dockerfile');
  const debianFonts=[...docker.matchAll(/\b(fonts-[a-z0-9-]+)\b/g)].map(m=>m[1]);
  const uniqueDebian=[...new Set(debianFonts)].sort();
  const staticAssets=walk('apps/web/public').filter(p=>/\.(png|jpe?g|webp|svg|gif|avif|ico)$/i.test(p)).sort();
  const tpl=read('packages/templates/src/index.ts');
  const templateSeeds=[...tpl.matchAll(/seed\((\d+),"([^"]+)"/g)].map(m=>({seed:Number(m[1]),name:m[2]}));
  return{npmFonts,debianFonts:uniqueDebian,staticAssets,templateSeeds};
}
function audit(){
  const errors=[],warnings=[],unresolved=[];
  for(const p of [fontPath,assetPath,templatePath])if(!exists(p))errors.push(`missing_manifest:${p}`);
  if(errors.length)return{status:'FAIL',releaseEligible:false,errors,warnings,unresolved,discovered:discover()};
  const fonts=json(fontPath),assets=json(assetPath),templates=json(templatePath),d=discover();
  const fontSources=new Map((fonts.items||[]).map(x=>[x.source,x]));
  const assetByPath=new Map((assets.items||[]).map(x=>[x.path,x]));
  const templateBySeed=new Map((templates.items||[]).map(x=>[Number(x.templateSeed),x]));
  for(const f of [...d.npmFonts,...d.debianFonts])if(!fontSources.has(f))errors.push(`unregistered_font_source:${f}`);
  for(const p of d.staticAssets)if(!assetByPath.has(p))errors.push(`unregistered_static_asset:${p}`);
  for(const t of d.templateSeeds)if(!templateBySeed.has(t.seed))errors.push(`unregistered_template_seed:${t.seed}:${t.name}`);
  for(const item of fonts.items||[]){
    if(!VALID.has(item.status))errors.push(`invalid_font_status:${item.assetId}`);
    if(!item.assetId||!item.source||!item.sourceType)errors.push(`invalid_font_record:${item.assetId||'unknown'}`);
    if(!APPROVED.has(item.status))unresolved.push({kind:'font',id:item.assetId,status:item.status,reason:item.note||'not approved'});
    else {
      for(const key of ['exactVersion','contentSha256','licenseName','licenseEvidencePath','reviewer','reviewedAt'])if(!item[key])errors.push(`approved_font_missing_${key}:${item.assetId}`);
      for(const key of ['commercialUseAllowed','derivativeAllowed','embeddingOrRedistributionAllowed','attributionRequired'])if(typeof item[key]!=='boolean')errors.push(`approved_font_missing_${key}:${item.assetId}`);
      if(item.licenseEvidencePath&&!exists(item.licenseEvidencePath))errors.push(`font_evidence_missing:${item.assetId}:${item.licenseEvidencePath}`);
    }
  }
  for(const item of assets.items||[]){
    if(!VALID.has(item.status))errors.push(`invalid_asset_status:${item.assetId}`);
    if(!item.path||!exists(item.path)){errors.push(`asset_file_missing:${item.assetId}`);continue;}
    const actual=shaFile(item.path); if(item.contentSha256!==actual)errors.push(`asset_hash_mismatch:${item.assetId}`);
    if(!APPROVED.has(item.status))unresolved.push({kind:'asset',id:item.assetId,status:item.status,reason:item.note||'not approved'});
    else for(const key of ['sourceType','licenseName','reviewer','reviewedAt'])if(!item[key])errors.push(`approved_asset_missing_${key}:${item.assetId}`);
  }
  for(const item of templates.items||[]){
    if(!VALID.has(item.status))errors.push(`invalid_template_status:${item.templateSeed}`);
    if(!APPROVED.has(item.status)||item.originalityReview!=='PASS'||item.thirdPartySimilarityReview!=='PASS')unresolved.push({kind:'template',id:`seed:${item.templateSeed}:${item.name}`,status:item.status,reason:'originality/similarity review not fully approved'});
    if(APPROVED.has(item.status)&&(!item.reviewer||!item.reviewedAt))errors.push(`approved_template_missing_reviewer:${item.templateSeed}`);
  }
  if(!exists('pnpm-lock.yaml'))warnings.push('pnpm_lock_missing_exact_npm_font_binary_not_frozen');
  if(/apt-get install[\s\S]*fonts-ebgaramond/.test(read('docker/worker.Dockerfile'))&&!/fonts-ebgaramond=/.test(read('docker/worker.Dockerfile')))warnings.push('worker_debian_font_packages_not_version_pinned');
  return{status:errors.length?'FAIL':'PASS',releaseEligible:errors.length===0&&unresolved.length===0,errors,warnings,unresolved,counts:{fontRecords:fonts.items?.length||0,assetRecords:assets.items?.length||0,templateRecords:templates.items?.length||0},discovered:d};
}
function print(result){console.log(JSON.stringify(result,null,2));}
const cmd=process.argv[2]||'audit';
const result=audit();
if(cmd==='audit'){print(result);if(result.status!=='PASS')process.exit(1);}
else if(cmd==='release-check'){
  const verdict=result.status==='PASS'&&result.releaseEligible?'GO_FOR_OWNER_APPROVAL':'NO_GO';
  print({...result,verdict,productionAction:'This command never publishes or deploys production.'});
  if(verdict!=='GO_FOR_OWNER_APPROVAL')process.exit(2);
}else{console.error('usage: node scripts/ip-governance.mjs <audit|release-check>');process.exit(64);}
