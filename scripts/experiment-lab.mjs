#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const registryPath=path.join(root,'experiments/registry.json');
const flagsPath=path.join(root,'experiments/feature-flags.json');
const recordsDir=path.join(root,'experiments/records');
const resultsDir=path.join(root,'experiments/results');
const statuses=new Set(['draft','running','candidate','staging','archived','rejected','promoted']);
const environments=new Set(['development','experiment','staging','production']);
function arg(name,fallback){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback;}
function has(name){return process.argv.includes(name);}
function need(name){const v=arg(name);if(!v)throw new Error(`${name.replace(/^--/,'')}_required`);return v;}
function readJson(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function writeJson(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
function safeId(id){if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(id))throw new Error('experiment_id_invalid');return id;}
function flagKey(value){if(!/^[a-z][a-z0-9_-]{2,80}$/.test(value))throw new Error('feature_flag_invalid');return value;}
function iso(value){const d=new Date(value);if(!Number.isFinite(d.valueOf()))throw new Error('date_invalid');return d.toISOString();}
function positive(name,fallback){const n=Number(arg(name,fallback));if(!Number.isFinite(n)||n<=0)throw new Error(`${name.replace(/^--/,'')}_invalid`);return n;}
function comma(v){return (v??'').split(',').map(x=>x.trim()).filter(Boolean);}
function validationErrors(record){
  const e=[];
  if(!record||typeof record!=='object')return['record_invalid'];
  if(!/^[a-z0-9][a-z0-9-]{2,63}$/.test(record.id??''))e.push('id');
  for(const k of ['owner','hypothesis','scope','branchWorktree','featureFlag','startAt','successMetric','premiumBenchmarkImpact','rollbackKillSwitch','status'])if(!record[k])e.push(k);
  if(!statuses.has(record.status))e.push('status_invalid');
  if(!Array.isArray(record.allowedEnvironments)||!record.allowedEnvironments.length||record.allowedEnvironments.some(x=>!environments.has(x)))e.push('allowedEnvironments');
  if(record.allowedEnvironments?.includes('production'))e.push('experiment_allowedEnvironments_must_not_include_production');
  for(const k of ['maxCallsPerRun','maxBenchmarkGenerations','dailyCostUsd'])if(!(Number(record.aiBudget?.[k])>0))e.push(`aiBudget.${k}`);
  if(!Array.isArray(record.securityIpReviewRequirements)||!record.securityIpReviewRequirements.length)e.push('securityIpReviewRequirements');
  return [...new Set(e)];
}
function findRecord(id){const reg=readJson(registryPath);return reg.experiments.find(x=>x.id===id);}

function create(){
  const id=safeId(need('--id')),flag=flagKey(arg('--flag',id.replace(/-/g,'_')));
  const registry=readJson(registryPath),flags=readJson(flagsPath);
  if(registry.experiments.some(x=>x.id===id)||fs.existsSync(path.join(recordsDir,`${id}.json`)))throw new Error('experiment_id_exists');
  if(flags.flags.some(x=>x.key===flag))throw new Error('feature_flag_exists');
  const startAt=new Date().toISOString(),expiresAt=iso(arg('--expires',new Date(Date.now()+30*86400_000).toISOString()));
  const record={
    id,owner:arg('--owner','Lumer'),hypothesis:need('--hypothesis'),scope:need('--scope'),
    branchWorktree:arg('--branch',`exp/${id}`),featureFlag:flag,startAt,endAt:null,
    allowedEnvironments:comma(arg('--allowed','experiment,staging')),
    aiBudget:{maxCallsPerRun:positive('--max-calls','300'),maxBenchmarkGenerations:positive('--max-generations','150'),dailyCostUsd:positive('--daily-usd','20')},
    successMetric:need('--metric'),premiumBenchmarkImpact:arg('--premium-impact','must not regress approved premium/WOW floor'),
    securityIpReviewRequirements:comma(arg('--reviews','security-delta,ip-provenance-delta')),
    rollbackKillSwitch:`KILL_${flag.toUpperCase().replace(/[^A-Z0-9]+/g,'_')}`,
    status:'draft',createdBy:'experiment-lab-v1'
  };
  const errors=validationErrors(record);if(errors.length)throw new Error(`experiment_invalid:${errors.join(',')}`);
  registry.experiments.push(record);flags.flags.push({key:flag,description:record.scope,defaultEnabled:false,allowedEnvironments:record.allowedEnvironments,rolloutPercent:0,owner:record.owner,expiresAt,killSwitchKey:record.rollbackKillSwitch,experimentId:id});
  writeJson(registryPath,registry);writeJson(flagsPath,flags);writeJson(path.join(recordsDir,`${id}.json`),record);
  console.log(JSON.stringify({ok:true,created:id,branchWorktree:record.branchWorktree,featureFlag:flag,killSwitch:record.rollbackKillSwitch,next:'create branch/worktree and isolated experiment environment; do not promote production'},null,2));
}
function validate(){
  const registry=readJson(registryPath),flags=readJson(flagsPath),errors=[];
  if(registry.version!==1)errors.push('registry_version');if(flags.version!==1)errors.push('flags_version');
  const ids=new Set(),flagKeys=new Set();
  for(const r of registry.experiments){for(const e of validationErrors(r))errors.push(`${r.id||'unknown'}:${e}`);if(ids.has(r.id))errors.push(`${r.id}:duplicate`);ids.add(r.id);const f=flags.flags.find(x=>x.experimentId===r.id&&x.key===r.featureFlag);if(!f)errors.push(`${r.id}:flag_missing`);else if(f.defaultEnabled!==false)errors.push(`${r.id}:flag_not_default_off`);}
  for(const f of flags.flags){if(flagKeys.has(f.key))errors.push(`${f.key}:duplicate_flag`);flagKeys.add(f.key);if(f.defaultEnabled!==false)errors.push(`${f.key}:default_must_be_false`);if(!f.expiresAt)errors.push(`${f.key}:expiresAt`);if(!f.killSwitchKey)errors.push(`${f.key}:killSwitchKey`);}
  console.log(JSON.stringify({ok:errors.length===0,experiments:registry.experiments.length,flags:flags.flags.length,errors},null,2));if(errors.length)process.exitCode=1;
}
function promotionCheck(){
  const id=safeId(need('--id')),to=arg('--to','staging');if(!['staging','production'].includes(to))throw new Error('promotion_target_invalid');
  const record=findRecord(id);if(!record)throw new Error('experiment_not_found');
  const evidencePath=path.join(resultsDir,id,'promotion-evidence.json');const ev=fs.existsSync(evidencePath)?readJson(evidencePath):{};
  const gates={
    objectiveBuildTests:ev.objectiveBuildTests===true,
    premiumBenchmark:ev.premiumBenchmark===true,
    ipProvenance:ev.ipProvenance===true,
    security:ev.security===true,
    migrationRollbackPlan:ev.migrationRollbackPlan===true,
    isolatedStagingE2E:ev.isolatedStagingE2E===true,
    productionConfigDiffReviewed:ev.productionConfigDiffReviewed===true,
    killSwitchVerified:ev.killSwitchVerified===true
  };
  const required=to==='staging'?['objectiveBuildTests','premiumBenchmark','ipProvenance','security','migrationRollbackPlan','killSwitchVerified']:Object.keys(gates);
  const missing=required.filter(k=>!gates[k]);
  const verdict=missing.length?'NO_GO':to==='production'?'READY_FOR_OWNER_APPROVAL':'GO_FOR_STAGING';
  console.log(JSON.stringify({experiment:id,target:to,verdict,gates,missing,ownerApprovalRequired:to==='production',note:to==='production'?'This command never deploys production. Obtain explicit owner approval after this evidence review.':'Staging must still use isolated non-production services.'},null,2));
  if(missing.length)process.exitCode=2;
}

function createWorktree(){
  const id=safeId(need('--id')),record=findRecord(id);if(!record)throw new Error('experiment_not_found');
  if(!fs.existsSync(path.join(root,'.git')))throw new Error('git_repository_required_for_worktree');
  const base=arg('--base','main');if(!/^[A-Za-z0-9._/-]{1,120}$/.test(base))throw new Error('worktree_base_invalid');
  const worktreeRoot=path.resolve(root,arg('--worktree-root','.worktrees'));
  const allowedRoot=path.resolve(root,'.worktrees');if(worktreeRoot!==allowedRoot&&!worktreeRoot.startsWith(allowedRoot+path.sep))throw new Error('worktree_root_must_be_inside_.worktrees');
  const target=path.join(worktreeRoot,id);fs.mkdirSync(worktreeRoot,{recursive:true});if(fs.existsSync(target))throw new Error('worktree_target_exists');
  const branch=record.branchWorktree;if(branch!==`exp/${id}`&&!branch.startsWith(`exp/${id}-`))throw new Error('experiment_branch_name_invalid');
  const out=spawnSync('git',['worktree','add','-b',branch,target,base],{cwd:root,encoding:'utf8'});if(out.status!==0)throw new Error(`git_worktree_failed:${(out.stderr||out.stdout).trim().slice(0,300)}`);
  console.log(JSON.stringify({ok:true,experiment:id,branch,target,note:'Experiment worktree only; production promotion is separate and owner-gated.'},null,2));
}

function archive(){const id=safeId(need('--id')),reason=need('--reason'),registry=readJson(registryPath);const i=registry.experiments.findIndex(x=>x.id===id);if(i<0)throw new Error('experiment_not_found');registry.experiments[i]={...registry.experiments[i],status:'archived',endAt:new Date().toISOString(),archiveReason:reason};writeJson(registryPath,registry);const p=path.join(recordsDir,`${id}.json`);if(fs.existsSync(p))writeJson(p,registry.experiments[i]);console.log(JSON.stringify({ok:true,archived:id,reason},null,2));}

const command=process.argv[2]??'validate';
try{if(command==='create')create();else if(command==='validate')validate();else if(command==='promotion-check')promotionCheck();else if(command==='worktree-create')createWorktree();else if(command==='archive')archive();else throw new Error('command_invalid');}
catch(error){console.error(JSON.stringify({ok:false,error:error instanceof Error?error.message:'experiment_lab_failed'}));process.exit(1);}
