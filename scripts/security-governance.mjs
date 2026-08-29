#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root=path.resolve(import.meta.dirname,'..');
const rel=p=>p.split(path.sep).join('/');
const abs=p=>path.join(root,p);
const exists=p=>fs.existsSync(abs(p));
const read=p=>fs.readFileSync(abs(p),'utf8');
const json=p=>JSON.parse(read(p));
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(abs(p)),{recursive:true});fs.writeFileSync(abs(p),JSON.stringify(v,null,2)+'\n');};
const NOW=()=>new Date().toISOString();
const reportDir='security/reports';

const SKIP_DIRS=new Set(['.git','node_modules','.next','dist','coverage','.pnpm-store','benchmark-results','.turbo']);
const TEXT_EXT=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.yaml','.yml','.toml','.txt','.sh','.html','.css','.env','.example','']);
function walk(dir='.',out=[]){
  for(const e of fs.readdirSync(abs(dir),{withFileTypes:true})){
    if(SKIP_DIRS.has(e.name))continue;
    const p=dir==='.'?e.name:path.join(dir,e.name);
    if(e.isDirectory())walk(p,out); else out.push(rel(p));
  }
  return out;
}
function isTextCandidate(p){
  if(p==='scripts/security-governance.mjs')return false;
  if(p.startsWith('security/reports/'))return false;
  if(/\.(zip|png|jpe?g|webp|gif|avif|ico|pdf|woff2?|ttf|otf|ttc)$/i.test(p))return false;
  const ext=path.extname(p).toLowerCase();
  return TEXT_EXT.has(ext)||path.basename(p).startsWith('.env');
}
function redactPreview(line){
  const eq=line.indexOf('=');
  if(eq>0)return line.slice(0,eq+1)+'[REDACTED]';
  return line.slice(0,120).replace(/[A-Za-z0-9_\-]{12,}/g,'[REDACTED]');
}
function secretScan(){
  const findings=[];
  const rules=[
    ['private_key',new RegExp('-----BEGIN '+'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----')],
    ['aws_access_key',new RegExp('AK'+'IA[0-9A-Z]{16}')],
    ['github_token',new RegExp('gh'+'[pousr]_[A-Za-z0-9]{20,}')],
    ['openai_style_secret',new RegExp('s'+'k-[A-Za-z0-9_\\-]{20,}')],
    ['live_payment_secret',new RegExp('s'+'k_live_[A-Za-z0-9]{16,}')]
  ];
  const secretName=/\b(?:[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|SERVICE_ROLE_KEY|WEBHOOK_KEY|ACCESS_KEY)[A-Z0-9_]*)\s*=\s*([^\s#][^#]*)/;
  for(const p of walk().filter(isTextCandidate)){
    let text;try{text=read(p);}catch{continue;}
    const lines=text.split(/\r?\n/);
    lines.forEach((line,i)=>{
      for(const [rule,re] of rules)if(re.test(line))findings.push({rule,path:p,line:i+1,preview:redactPreview(line)});
      if(path.basename(p).startsWith('.env')&&!/\.example$/.test(p)){
        const m=line.match(secretName);
        if(m){const v=m[1].trim().replace(/^['"]|['"]$/g,'');if(v&&!/^\$\{|^<|^CHANGEME$|^REPLACE_ME$|^example$/i.test(v))findings.push({rule:'nonempty_secret_env_assignment',path:p,line:i+1,preview:redactPreview(line)});}
      }
    });
  }
  const report={schemaVersion:1,generatedAt:NOW(),status:findings.length?'FAIL':'PASS',scanner:'CardeLume high-confidence source/worktree scanner; run a dedicated history/entropy scanner in controlled CI before release.',findings};
  writeJson(`${reportDir}/secret-scan.json`,report);
  return report;
}
function packageManifests(){
  return walk().filter(p=>p==='package.json'||/^(apps|packages)\/[^/]+\/package\.json$/.test(p)).sort();
}
function sourceSbom(){
  const components=[];
  for(const manifestPath of packageManifests()){
    const pkg=json(manifestPath);
    for(const [scope,deps] of [['runtime',pkg.dependencies||{}],['development',pkg.devDependencies||{}],['optional',pkg.optionalDependencies||{}]]){
      for(const [name,declared] of Object.entries(deps))components.push({type:'library',name,version:String(declared),scope,properties:[{name:'cardelume:declaredBy',value:manifestPath},{name:'cardelume:versionKind',value:'declared-range-or-workspace-reference'}]});
    }
  }
  const unique=[];const seen=new Set();
  for(const c of components){const key=`${c.name}|${c.version}|${c.scope}`;if(!seen.has(key)){seen.add(key);unique.push(c);}}
  const lock=exists('pnpm-lock.yaml');
  const sbom={bomFormat:'CycloneDX',specVersion:'1.5',version:1,serialNumber:`urn:uuid:${crypto.randomUUID()}`,metadata:{timestamp:NOW(),component:{type:'application',name:'cardelume',version:json('package.json').version},properties:[{name:'cardelume:sbomCompleteness',value:lock?'source-manifest-plus-lock-present-but-not-resolved-by-this-tool':'partial-source-manifests-no-lockfile'},{name:'cardelume:releaseAuthority',value:'NOT_A_RELEASE_SBOM'}]},components:unique};
  writeJson(`${reportDir}/source-sbom.cdx.json`,sbom);
  return{status:'PASS',completeForRelease:false,lockPresent:lock,components:unique.length,path:`${reportDir}/source-sbom.cdx.json`};
}
function dockerEvidence(){
  const files=['docker/web.Dockerfile','docker/worker.Dockerfile'];
  const details=files.map(p=>{const s=read(p);return{path:p,nodeImageDigestPinned:/node:[^\s]+@sha256:[a-f0-9]{64}/.test(s),unprivileged:/\bUSER\s+cardelume\b/.test(s),frozenInstall:/pnpm install --frozen-lockfile/.test(s),aptPackagesVersionPinned:!/apt-get install[\s\S]*fonts-ebgaramond/.test(s)||/fonts-ebgaramond=/.test(s)};});
  const compose=read('docker-compose.yml');
  return{details,cloudflaredDigestPinned:/cloudflare\/cloudflared:[^\s]+@sha256:[a-f0-9]{64}/.test(compose),noNewPrivileges:(compose.match(/no-new-privileges:true/g)||[]).length>=3};
}
function headerEvidence(){
  const next=read('apps/web/next.config.ts'),proxy=read('apps/web/proxy.ts'),csp=read('apps/web/lib/csp.ts');
  const scriptUnsafe=/script-src[^\n]*unsafe-inline/.test(csp),styleUnsafe=/style-src[^\n]*unsafe-inline/.test(csp);
  return{hstsOneYear:/max-age=31536000/.test(next),hstsIncludeSubDomains:/includeSubDomains/.test(next),nosniff:/X-Content-Type-Options[\s\S]*nosniff/.test(next),referrerPolicy:/Referrer-Policy/.test(next),cspEnforced:false,cspReportOnly:/Content-Security-Policy-Report-Only/.test(proxy),cspNonceReady:/nonce-\$\{nonce\}/.test(csp)&&/strict-dynamic/.test(csp),cspScriptUnsafeInline:scriptUnsafe,cspStyleUnsafeInline:styleUnsafe,cspUnsafeInline:scriptUnsafe||styleUnsafe,cspEnforcementRuntimeGated:/CSP_ENFORCE/.test(proxy)};
}
function ipAudit(){
  const r=spawnSync(process.execPath,['scripts/ip-governance.mjs','audit'],{cwd:root,encoding:'utf8'});
  try{return JSON.parse(r.stdout||'{}');}catch{return{status:'FAIL',releaseEligible:false,errors:['ip_audit_unparseable']};}
}
function asvsSummary(){
  const m=json('security/asvs/ASVS_5.0.0_L2_MATRIX.json');
  const counts={};for(const c of m.controls)counts[c.status]=(counts[c.status]||0)+1;
  const blockers=m.controls.filter(c=>c.mandatoryForLaunch&&['BLOCKED','NOT_EXECUTED'].includes(c.status)).map(c=>({id:c.id,status:c.status,title:c.title}));
  const partial=m.controls.filter(c=>c.mandatoryForLaunch&&c.status==='PARTIAL').map(c=>({id:c.id,title:c.title}));
  return{standard:`${m.standard} ${m.version} ${m.target}`,counts,blockers,partial};
}
function audit(){
  const secret=secretScan();const sbom=sourceSbom();const docker=dockerEvidence();const headers=headerEvidence();const ip=ipAudit();const asvs=asvsSummary();
  const sourceChecks={
    secretScan:secret.status,
    sourceSbom:sbom.status,
    lockfile:exists('pnpm-lock.yaml')?'PASS':'BLOCKED',
    nodeImageDigestPinned:docker.details.every(x=>x.nodeImageDigestPinned)?'PASS':'FAIL',
    unprivilegedContainers:docker.details.every(x=>x.unprivileged)&&docker.noNewPrivileges?'PASS':'FAIL',
    cloudflaredDigestPinned:docker.cloudflaredDigestPinned?'PASS':'FAIL',
    workerAptFontPackagesPinned:docker.details.find(x=>x.path.endsWith('worker.Dockerfile'))?.aptPackagesVersionPinned?'PASS':'BLOCKED',
    hstsSource:headers.hstsOneYear&&headers.hstsIncludeSubDomains?'PASS':'FAIL',
    cspEnforcement:headers.cspEnforced&&!headers.cspUnsafeInline?'PASS':'BLOCKED',
    ipGovernance:ip.status==='PASS'?'PASS':'FAIL',
    ipProductionCatalog:ip.releaseEligible?'PASS':'BLOCKED'
  };
  const infrastructureFail=Object.values(sourceChecks).includes('FAIL');
  const releaseBlockers=Object.entries(sourceChecks).filter(([,v])=>v==='BLOCKED').map(([k])=>k).concat(asvs.blockers.map(x=>x.id));
  const report={schemaVersion:1,generatedAt:NOW(),candidate:json('package.json').version,status:infrastructureFail?'FAIL':'PASS',meaning:'PASS means the governance tooling/source audit executed correctly; it does NOT mean production security is approved.',releaseEligible:!infrastructureFail&&releaseBlockers.length===0&&asvs.partial.length===0,sourceChecks,headers,docker,asvs,ip:{status:ip.status,releaseEligible:ip.releaseEligible,unresolvedCount:ip.unresolved?.length??null},releaseBlockers:[...new Set(releaseBlockers)].sort()};
  writeJson(`${reportDir}/security-governance-audit.json`,report);return report;
}
function runtimeEvidence(name){
  const p=`security/evidence/${name}.json`;if(!exists(p))return{ok:false,path:p,reason:'missing'};
  try{const x=json(p);return{ok:x.status==='PASS',path:p,reason:x.status==='PASS'?'PASS':`status=${x.status??'unknown'}`};}catch{return{ok:false,path:p,reason:'invalid_json'};}
}
function releaseCheck(){
  const a=audit();
  const gates=[];const gate=(name,ok,evidence)=>gates.push({name,status:ok?'PASS':'FAIL',evidence});
  gate('governance-audit',a.status==='PASS',`${reportDir}/security-governance-audit.json`);
  gate('dependency-lock',exists('pnpm-lock.yaml'),'pnpm-lock.yaml required');
  gate('ip-production-catalog',Boolean(a.ip.releaseEligible),'all production fonts/assets/templates need approved exact provenance');
  gate('enforced-csp',a.headers.cspEnforced&&!a.headers.cspUnsafeInline,'enforced CSP without unsafe-inline script/style required after browser/staging validation');
  gate('asvs-source-blockers',a.asvs.blockers.length===0,`${a.asvs.blockers.length} selected mandatory ASVS blocker(s)`);
  gate('asvs-source-partials',a.asvs.partial.length===0,`${a.asvs.partial.length} selected mandatory ASVS partial control(s) require closure/evidence`);
  const releaseSbom='security/reports/release-sbom.cdx.json';let releaseSbomPass=false;if(exists(releaseSbom)&&exists('pnpm-lock.yaml')){try{const b=json(releaseSbom);const lockSha=shaFile('pnpm-lock.yaml');releaseSbomPass=b.metadata?.properties?.some?.(p=>p.name==='cardelume:lockSha256'&&p.value===lockSha)&&b.metadata?.properties?.some?.(p=>p.name==='cardelume:sbomCompleteness'&&p.value==='resolved-installed-pnpm-graph');}catch{}}gate('release-sbom',releaseSbomPass,releaseSbom);
  const vuln='security/reports/dependency-vulnerability-report.json';let vulnPass=false;if(exists(vuln)){try{const v=json(vuln);vulnPass=v.status==='PASS'&&(!v.lockSha256||v.lockSha256===(exists('pnpm-lock.yaml')?shaFile('pnpm-lock.yaml'):''));}catch{}}
  gate('dependency-vulnerability-scan',vulnPass,vuln);
  for(const name of ['staging-security-validation','tls-edge-validation','rls-authorization-validation','security-logging-validation','secret-store-validation','backup-restore-validation']){const e=runtimeEvidence(name);gate(name,e.ok,`${e.path}: ${e.reason}`);}
  const verdict=gates.every(g=>g.status==='PASS')?'GO_FOR_OWNER_APPROVAL':'NO_GO';
  const result={generatedAt:NOW(),candidate:json('package.json').version,verdict,note:'Fail-closed evidence check only. It never deploys production. GO_FOR_OWNER_APPROVAL still requires explicit owner approval.',gates};
  console.log(JSON.stringify(result,null,2));if(verdict!=='GO_FOR_OWNER_APPROVAL')process.exitCode=2;return result;
}

const cmd=process.argv[2]||'audit';
if(cmd==='secret-scan'){const r=secretScan();console.log(JSON.stringify(r,null,2));if(r.status!=='PASS')process.exitCode=1;}
else if(cmd==='sbom-source'){console.log(JSON.stringify(sourceSbom(),null,2));}
else if(cmd==='audit'){const r=audit();console.log(JSON.stringify(r,null,2));if(r.status!=='PASS')process.exitCode=1;}
else if(cmd==='release-check'){releaseCheck();}
else {console.error('usage: node scripts/security-governance.mjs <secret-scan|sbom-source|audit|release-check>');process.exit(64);}
