#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const failures=[],passes=[];const need=(c,m)=>{if(c)passes.push(m);else failures.push(m)};const read=p=>fs.readFileSync(path.join(root,p),'utf8');const exists=p=>fs.existsSync(path.join(root,p));
const pkg=JSON.parse(read('package.json'));const stepMatch=pkg.version.match(/^0\.4\.3-step\.(\d+)[a-z]*$/);need(Boolean(stepMatch)&&Number(stepMatch[1])>=16,'package version retains Step16+ experiment lab baseline');
for(const p of ['packages/core/src/environment.ts','packages/core/src/experiment.ts','experiments/registry.json','experiments/feature-flags.json','scripts/experiment-lab.mjs','config/environments/experiment.env.example','config/environments/staging.env.example','config/environments/production.env.example'])need(exists(p),`${p} exists`);
const env=read('packages/core/src/environment.ts');
for(const term of ['APP_ENV_required_explicit_environment','production_payment_requires_live_mode','DODO_PAYMENTS_ENVIRONMENT_must_be_live_mode_in_production','DODO_PAYMENTS_ENVIRONMENT_must_be_test_mode_in_','R2_OBJECT_PREFIX_required_for_nonproduction','nonproduction_database_matches_production_guard','ALLOW_PRODUCTION_WRITES_forbidden_in_nonproduction'])need(env.includes(term),`environment guard ${term}`);
const feature=read('packages/core/src/experiment.ts');need(feature.includes('defaultEnabled:false'),'flags default OFF contract');need(feature.includes('EXPERIMENT_KILL_SWITCH'),'global kill switch');need(feature.includes('killSwitchKey'),'per-flag kill switch');need(feature.includes('rolloutPercent'),'percentage rollout');
const storage=read('packages/storage/src/index.ts');need(storage.includes('R2_OBJECT_PREFIX'),'R2 config reads prefix');need(storage.includes('this.scopedKey(input.key)'),'R2 writes are scoped');need(storage.includes('this.scopedKey(key)'),'R2 reads/deletes are scoped');
const worker=read('apps/worker/src/index.ts');need(worker.indexOf('assertEnvironmentIsolation(process.env)')<worker.indexOf('const boss=createBoss()'),'worker asserts environment before queue start');
const dodo=read('apps/web/lib/dodo-payments.server.ts');need(dodo.includes('assertPaymentEnvironmentForApp(process.env)'),'payment path checks APP_ENV/payment mode');
const ready=read('apps/web/lib/production-config.server.ts');need(ready.includes('validateEnvironmentIsolation(process.env)'),'readiness checks environment isolation');
const runner=read('scripts/premium-benchmark-runner.ts');for(const term of ['AI_EXPERIMENT_MAX_GENERATIONS_PER_RUN','AI_EXPERIMENT_MAX_CALLS_PER_RUN','AI_EXPERIMENT_DAILY_COST_USD','benchmark_worst_case_call_budget_exceeded','benchmark_budget_attribution_id_required'])need(runner.includes(term),`benchmark budget guard ${term}`);
const lab=read('scripts/experiment-lab.mjs');for(const term of ['allowedEnvironments','aiBudget','premiumBenchmarkImpact','securityIpReviewRequirements','rollbackKillSwitch','defaultEnabled:false','READY_FOR_OWNER_APPROVAL','This command never deploys production'])need(lab.includes(term),`experiment registry/promotion ${term}`);
const flags=JSON.parse(read('experiments/feature-flags.json'));need(flags.flags.every(f=>f.defaultEnabled===false),'registered flags default OFF');
const reg=JSON.parse(read('experiments/registry.json'));need(reg.experiments.every(e=>!e.allowedEnvironments?.includes('production')),'registered experiments exclude production lane');
const runtime=spawnSync(process.execPath,['--experimental-strip-types',path.join(root,'scripts/experiment-environment-runtime-stress.ts')],{encoding:'utf8'});need(runtime.status===0,`environment runtime stress passes: ${runtime.stderr||runtime.stdout}`);
const cli=spawnSync(process.execPath,[path.join(root,'scripts/experiment-lab.mjs'),'validate'],{encoding:'utf8'});need(cli.status===0,'experiment registry validates');
console.log(JSON.stringify({status:failures.length?'FAIL':'PASS',checks:passes.length,failures},null,2));if(failures.length)process.exit(1);
