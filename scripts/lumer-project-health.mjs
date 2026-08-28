#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const exists = (p) => fs.existsSync(path.join(root,p));
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const findings=[];
function add(severity, area, status, evidence, action='') { findings.push({severity,area,status,evidence,action}); }

let pkg;
try { pkg=JSON.parse(read('package.json')); add('INFO','source-version','PASS',pkg.version); }
catch (e) { add('P0','package-json','FAIL',String(e),'Repair package.json before other work.'); }

if (exists('pnpm-lock.yaml')) add('INFO','dependency-lock','PASS','pnpm-lock.yaml present');
else add('P1','dependency-lock','UNKNOWN','pnpm-lock.yaml absent from frozen source tree','Generate/recover reviewed lockfile on controlled Pi/runtime before claiming frozen-dependency build.');

const migrationsDir=path.join(root,'packages/db/migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations=fs.readdirSync(migrationsDir).filter(f=>/^\d+.*\.sql$/.test(f)).sort();
  add('INFO','migrations','PASS',`${migrations.length} SQL migrations: ${migrations.join(', ')}`);
} else add('P0','migrations','FAIL','migration directory missing');

const golden='benchmarks/premium/golden-set-v1.json';
if (exists(golden)) {
  try { const g=JSON.parse(read(golden)); const items=Array.isArray(g)?g:(g.briefs||[]); add(items.length>=120?'INFO':'P0','golden-set',items.length>=120?'PASS':'FAIL',`${items.length} briefs`); }
  catch(e){ add('P0','golden-set','FAIL',String(e)); }
} else add('P0','golden-set','FAIL','missing golden-set-v1.json');

const skillRoot=path.join(root,'.hermes/skills');
let skills=0;
if (fs.existsSync(skillRoot)) {
  const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory())walk(p); else if(e.name==='SKILL.md')skills++;}}; walk(skillRoot);
}
add(skills>=18?'INFO':'P1','lumer-skills',skills>=18?'PASS':'FAIL',`${skills} project-local SKILL.md files`);

for (const d of ['docs/MASTER_SPEC_V7.md','docs/ROADMAP_V7.md','docs/SECURITY_GOVERNANCE_SPEC_V1.md','docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md']) {
  add(exists(d)?'INFO':'P1',`doc:${d}`,exists(d)?'PASS':'FAIL',exists(d)?'present':'missing');
}

const sourceFiles=['apps/worker/src/index.ts','packages/ai/src/index.ts','packages/templates/src/index.ts'];
for(const f of sourceFiles) if(exists(f)){const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex').slice(0,12); add('INFO',`source:${f}`,'PASS',`sha256:${h}…`);} else add('P0',`source:${f}`,'FAIL','missing');

// Runtime-connected evidence is intentionally unknown in this offline/read-only helper.
for (const area of ['web-readiness','worker-heartbeat','queue-health','database-health','r2-health','ai-provider-live','dodo-webhook-live','backup-freshness','current-production-version']) {
  add('P2',area,'UNKNOWN','No live credential/service query executed by static project-health helper','Run the read-only Lumer health skill on Pi/staging/production monitoring with least-privilege access.');
}

const rank={P0:0,P1:1,P2:2,P3:3,INFO:4}; findings.sort((a,b)=>rank[a.severity]-rank[b.severity]||a.area.localeCompare(b.area));
console.log(JSON.stringify({generatedAt:new Date().toISOString(), mode:'static-read-only', sourceVersion:pkg?.version??null, findings},null,2));
