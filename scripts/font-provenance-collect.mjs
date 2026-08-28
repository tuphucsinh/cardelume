#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import {spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const manifestPath=path.join(root,'licenses/fonts/FONT_LICENSE_MANIFEST.json');
const evidenceDir=path.join(root,'licenses/fonts/evidence');
fs.mkdirSync(evidenceDir,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=s=>s.replace(/[^a-z0-9._-]+/gi,'_');
const iso=()=>new Date().toISOString();
function treeHash(files){const h=crypto.createHash('sha256');for(const f of files.sort()){h.update(f);h.update('\0');h.update(fs.readFileSync(f));h.update('\0');}return h.digest('hex');}
function findLicense(dir){for(const n of ['OFL.txt','OFL.md','LICENSE','LICENSE.txt','license','license.txt']){const p=path.join(dir,n);if(fs.existsSync(p)&&fs.statSync(p).isFile())return p;}return null;}
function copyEvidence(src,id,version){const ext=path.extname(src)||'.txt';const dest=path.join(evidenceDir,`${safe(id)}-${safe(version)}${ext}`);fs.copyFileSync(src,dest);return path.relative(root,dest).split(path.sep).join('/');}
let collected=0;const notes=[];
for(const item of manifest.items||[]){
  if(item.sourceType==='npm'){
    const dir=path.join(root,'node_modules',...item.source.split('/'));
    const pkgPath=path.join(dir,'package.json');
    if(!fs.existsSync(pkgPath)){notes.push(`${item.assetId}: node_modules package missing`);continue;}
    const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));const lic=findLicense(dir);
    const fontFiles=[];const stack=[dir];while(stack.length){const d=stack.pop();for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())stack.push(p);else if(/\.(woff2?|ttf|otf)$/i.test(e.name))fontFiles.push(p);}}
    if(!lic||!fontFiles.length){notes.push(`${item.assetId}: license or font files missing in installed package`);continue;}
    item.exactVersion=pkg.version;item.contentSha256=treeHash(fontFiles);item.licenseEvidencePath=copyEvidence(lic,item.assetId,pkg.version);item.acquiredAt=iso();
    item.note='Exact installed package/font tree evidence collected. Status intentionally remains UNKNOWN until human/reviewer verifies license conditions and marks APPROVED.';collected++;
  } else if(item.sourceType==='debian'){
    const q=spawnSync('dpkg-query',['-W','-f=${Version}',item.source],{encoding:'utf8'});if(q.status!==0){notes.push(`${item.assetId}: Debian package not installed`);continue;}
    const version=q.stdout.trim();const l=spawnSync('dpkg',['-L',item.source],{encoding:'utf8'});if(l.status!==0){notes.push(`${item.assetId}: dpkg file list unavailable`);continue;}
    const files=l.stdout.split(/\r?\n/).filter(Boolean).filter(p=>/\.(ttf|otf|ttc)$/i.test(p)&&fs.existsSync(p));const copyright=`/usr/share/doc/${item.source}/copyright`;
    if(!files.length||!fs.existsSync(copyright)){notes.push(`${item.assetId}: Debian font binaries/copyright evidence missing`);continue;}
    item.exactVersion=version;item.contentSha256=treeHash(files);item.licenseEvidencePath=copyEvidence(copyright,item.assetId,version);item.acquiredAt=iso();
    item.note='Exact installed Debian package/font tree evidence collected. Status intentionally remains UNKNOWN until human/reviewer verifies package license conditions and marks APPROVED.';collected++;
  }
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',collected,notes,warning:'Evidence collection does not approve assets automatically.'},null,2));
