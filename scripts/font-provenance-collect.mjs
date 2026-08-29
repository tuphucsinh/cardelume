#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import {createRequire} from 'node:module';

const root=path.resolve(import.meta.dirname,'..');
const manifestPath=path.join(root,'licenses/fonts/FONT_LICENSE_MANIFEST.json');
const evidenceDir=path.join(root,'licenses/fonts/evidence');
const workerProvenancePath=path.join(evidenceDir,'worker-image-provenance.json');
fs.mkdirSync(evidenceDir,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=s=>s.replace(/[^a-z0-9._-]+/gi,'_');
const iso=()=>new Date().toISOString();
function treeHash(files){const h=crypto.createHash('sha256');for(const f of files.sort()){h.update(f);h.update('\0');h.update(fs.readFileSync(f));h.update('\0');}return h.digest('hex');}
function findLicense(dir){for(const n of ['OFL.txt','OFL.md','LICENSE','LICENSE.txt','license','license.txt']){const p=path.join(dir,n);if(fs.existsSync(p)&&fs.statSync(p).isFile())return p;}return null;}
function copyEvidence(src,id,version){const ext=path.extname(src)||'.txt';const dest=path.join(evidenceDir,`${safe(id)}-${safe(version)}${ext}`);fs.copyFileSync(src,dest);return path.relative(root,dest).split(path.sep).join('/');}
function resolveNpmPackageDir(source){
  const anchors=[
    path.join(root,'apps/web/package.json'),
    path.join(root,'package.json')
  ];
  for(const anchor of anchors){
    if(!fs.existsSync(anchor))continue;
    try{
      const req=createRequire(anchor);
      const pkgJsonPath=req.resolve(`${source}/package.json`);
      return path.dirname(pkgJsonPath);
    }catch{}
  }
  const fallback=path.join(root,'node_modules',...source.split('/'));
  if(fs.existsSync(path.join(fallback,'package.json')))return fallback;
  return null;
}

function validateProvenanceEntry(pkgName,entry){
  if(typeof pkgName!=='string'||!/^[a-z0-9+.-]+$/i.test(pkgName))return false;
  if(!entry||typeof entry!=='object'||Array.isArray(entry))return false;
  if(typeof entry.version!=='string'||!entry.version.trim())return false;
  if(typeof entry.contentSha256!=='string'||!/^[0-9a-f]{64}$/i.test(entry.contentSha256))return false;
  if(typeof entry.licenseEvidencePath!=='string')return false;
  const normPath=path.normalize(entry.licenseEvidencePath).split(path.sep).join('/').replace(/^\.\//,'');
  if(!normPath.startsWith('licenses/fonts/evidence/')||normPath.includes('..'))return false;
  if(!fs.existsSync(path.join(root,normPath)))return false;
  return true;
}

function loadWorkerProvenance(provenanceFile){
  if(!fs.existsSync(provenanceFile))return null;
  try{
    const raw=fs.readFileSync(provenanceFile,'utf8');
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    if(data.schemaVersion!==1)return null;
    if(typeof data.image!=='string'||!data.image.trim())return null;
    if(typeof data.platform!=='string'||!data.platform.trim())return null;
    if(typeof data.dockerfile!=='string'||!data.dockerfile.trim())return null;
    if(!data.packages||typeof data.packages!=='object'||Array.isArray(data.packages))return null;
    for(const [pkgName,entry] of Object.entries(data.packages)){
      if(!validateProvenanceEntry(pkgName,entry))return null;
    }
    return data;
  }catch{
    return null;
  }
}

const workerProvenance=loadWorkerProvenance(workerProvenancePath);

let collected=0;const notes=[];
for(const item of manifest.items||[]){
  const prior={...item};
  if(item.sourceType==='npm'){
    const dir=resolveNpmPackageDir(item.source);
    if(!dir){notes.push(`${item.assetId}: node_modules package missing`);continue;}
    const pkgPath=path.join(dir,'package.json');
    const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));const lic=findLicense(dir);
    const fontFiles=[];const stack=[dir];while(stack.length){const d=stack.pop();for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())stack.push(p);else if(/\.(woff2?|ttf|otf)$/i.test(e.name))fontFiles.push(p);}}
    if(!lic||!fontFiles.length){notes.push(`${item.assetId}: license or font files missing in installed package`);continue;}
    const exactVersion=pkg.version;
    const contentSha256=treeHash(fontFiles);
    item.exactVersion=exactVersion;
    item.contentSha256=contentSha256;
    item.licenseEvidencePath=copyEvidence(lic,item.assetId,pkg.version);
    item.acquiredAt=iso();
    const isApprovedMatch=prior.status==='APPROVED'&&prior.exactVersion===exactVersion&&prior.contentSha256===contentSha256;
    if(isApprovedMatch){
      item.reviewer=prior.reviewer;
      item.reviewedAt=prior.reviewedAt;
      item.status=prior.status;
      item.productionBinaryVerdict=prior.productionBinaryVerdict;
      item.sourceVersionPinState=prior.sourceVersionPinState;
      item.note=prior.note;
    }else{
      item.reviewer=null;
      item.reviewedAt=null;
      item.status='UNKNOWN';
      item.productionBinaryVerdict='PENDING_EXACT_VERSION_HASH_AND_LICENSE_EVIDENCE';
      item.note='Exact installed package/font tree evidence collected. Status intentionally remains UNKNOWN until human/reviewer verifies license conditions and marks APPROVED.';
    }
    collected++;
  } else if(item.sourceType==='debian'){
    if(!workerProvenance){
      notes.push(`${item.assetId}: worker-image-provenance.json missing or invalid`);
      continue;
    }
    const entry=workerProvenance.packages?.[item.source];
    if(!entry||!validateProvenanceEntry(item.source,entry)){
      notes.push(`${item.assetId}: canonical Debian font evidence missing or invalid in worker-image-provenance.json`);
      continue;
    }
    const exactVersion=entry.version;
    const contentSha256=entry.contentSha256;
    const licenseEvidencePath=entry.licenseEvidencePath;
    const acquiredAt=(typeof entry.acquiredAt==='string'&&entry.acquiredAt)||(typeof workerProvenance.acquiredAt==='string'&&workerProvenance.acquiredAt)||iso();
    item.exactVersion=exactVersion;
    item.contentSha256=contentSha256;
    item.licenseEvidencePath=licenseEvidencePath;
    item.acquiredAt=acquiredAt;
    const isApprovedMatch=prior.status==='APPROVED'&&prior.exactVersion===exactVersion&&prior.contentSha256===contentSha256;
    if(isApprovedMatch){
      item.reviewer=prior.reviewer;
      item.reviewedAt=prior.reviewedAt;
      item.status=prior.status;
      item.productionBinaryVerdict=prior.productionBinaryVerdict;
      item.sourceVersionPinState=prior.sourceVersionPinState;
      item.note=prior.note;
    }else{
      item.reviewer=null;
      item.reviewedAt=null;
      item.status='UNKNOWN';
      item.productionBinaryVerdict='PENDING_EXACT_VERSION_HASH_AND_LICENSE_EVIDENCE';
      item.note='Exact installed Debian package/font tree evidence collected. Status intentionally remains UNKNOWN until human/reviewer verifies package license conditions and marks APPROVED.';
    }
    collected++;
  }
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',collected,notes,warning:'Evidence collection does not approve assets automatically.'},null,2));
