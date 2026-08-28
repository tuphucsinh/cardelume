#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const lock=path.join(root,'pnpm-lock.yaml');
const out=path.join(root,'security/reports/release-sbom.cdx.json');
const die=(m,c=2)=>{console.error(m);process.exit(c);};
if(!fs.existsSync(lock))die('release_sbom_requires_pnpm_lock');
const pnpm=process.env.PNPM_BIN||'pnpm';
const r=spawnSync(pnpm,['list','-r','--json','--depth','Infinity'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
if(r.error||r.status!==0)die(`pnpm_list_failed:${r.error?.message||r.stderr||r.status}`);
let roots;try{roots=JSON.parse(r.stdout);}catch{die('pnpm_list_json_invalid');}
const components=new Map();
function add(name,node,scope='required'){
  if(!node||typeof node!=='object')return;
  const n=node.name||name;const version=node.version;
  if(n&&version&&!String(version).startsWith('link:')&&!String(version).startsWith('workspace:')){
    const key=`${n}@${version}`;if(!components.has(key))components.set(key,{type:'library',name:n,version:String(version),scope,properties:[{name:'cardelume:resolvedFrom',value:'pnpm-installed-graph'}]});
  }
  for(const [k,v] of Object.entries(node.dependencies||{}))add(k,v,'required');
  for(const [k,v] of Object.entries(node.optionalDependencies||{}))add(k,v,'optional');
  for(const [k,v] of Object.entries(node.devDependencies||{}))add(k,v,'excluded');
}
for(const item of Array.isArray(roots)?roots:[roots])add(item.name,item,item.dev?'excluded':'required');
const lockSha=crypto.createHash('sha256').update(fs.readFileSync(lock)).digest('hex');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const bom={bomFormat:'CycloneDX',specVersion:'1.5',version:1,serialNumber:`urn:uuid:${crypto.randomUUID()}`,metadata:{timestamp:new Date().toISOString(),component:{type:'application',name:'cardelume',version:pkg.version},properties:[{name:'cardelume:sbomCompleteness',value:'resolved-installed-pnpm-graph'},{name:'cardelume:lockSha256',value:lockSha},{name:'cardelume:releaseCandidate',value:pkg.version}]},components:[...components.values()].sort((a,b)=>`${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`))};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(bom,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',path:path.relative(root,out),lockSha256:lockSha,components:bom.components.length,candidate:pkg.version},null,2));
