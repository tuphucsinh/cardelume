import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
function assert(condition,label){if(!condition)throw new Error(`FAIL: ${label}`);checks.push(label);}

const fonts=readJson('licenses/fonts/FONT_LICENSE_MANIFEST.json');
const candidates=readJson('licenses/fonts/FONT_CANDIDATE_CATALOG.json');
const templates=readJson('licenses/templates/TEMPLATE_PROVENANCE_MANIFEST.json');
const concepts=readJson('experiments/template-concepts/TEMPLATE_CONCEPTS_V2.json');
const typography=readJson('experiments/typography/TYPOGRAPHY_CANDIDATES_V1.json');
const webPkg=readJson('apps/web/package.json');
const css=read('apps/web/app/globals.css');
const art=read('packages/renderer/src/template-art.ts');
const fontCollector=read('scripts/font-provenance-collect.mjs');

assert(fonts.items.length===12,'all current + selected replacement font source entries are governed');
assert(fonts.items.every(x=>x.familyLicenseResearch?.license==='OFL-1.1'),'all current font families researched as OFL-1.1');
assert(fonts.items.every(x=>x.familyLicenseResearch?.commercialDesignUse==='ALLOWED'),'current font family-level commercial design use recorded');
assert(fonts.items.filter(x=>x.status==='APPROVED').every(x=>x.exactVersion&&x.contentSha256&&x.licenseEvidencePath&&x.reviewer&&x.reviewedAt&&x.productionBinaryVerdict==='APPROVED_EXACT_VERSION_HASH_AND_LICENSE_EVIDENCE'),'APPROVED font records have exact version, content hash, license evidence, reviewer, reviewedAt, and approval verdict');
assert(fonts.items.filter(x=>x.status!=='APPROVED').every(x=>x.status==='UNKNOWN'&&x.productionBinaryVerdict==='PENDING_EXACT_VERSION_HASH_AND_LICENSE_EVIDENCE'),'non-APPROVED font records remain fail-closed UNKNOWN status and PENDING verdict');
const dm=fonts.items.find(x=>x.assetId==='web.dm-sans');
assert(dm?.vietnameseCoverageVerified===false,'DM Sans Vietnamese distribution gap is explicitly recorded');

const requiredWebFonts=['@fontsource/cormorant-garamond','@fontsource/plus-jakarta-sans','@fontsource/noto-serif-jp','@fontsource/noto-sans-jp','@fontsource/noto-serif-kr','@fontsource/noto-sans-kr','@fontsource/noto-serif-sc','@fontsource/noto-sans-sc'];
for(const dep of requiredWebFonts)assert(Boolean(webPkg.dependencies?.[dep]),`current web dependency governed: ${dep}`);
for(const dep of requiredWebFonts)assert(webPkg.dependencies?.[dep]==='5.2.6',`current web font dependency exact-pinned at source: ${dep}`);
const workerDocker=read('docker/worker.Dockerfile');
assert(workerDocker.includes('fonts-ebgaramond=0.016+git20210310.42d4f9f2-1'),'worker EB Garamond Debian version exact-pinned');
assert(workerDocker.includes('fonts-lato=2.0-2.1'),'worker Lato Debian version exact-pinned');
assert(workerDocker.includes('fonts-noto-cjk=1:20220127+repack1-1'),'worker Noto CJK Debian version exact-pinned');
assert(workerDocker.includes('/usr/share/doc/fonts-ebgaramond/copyright')&&workerDocker.includes('/usr/share/doc/fonts-lato/copyright')&&workerDocker.includes('/usr/share/doc/fonts-noto-cjk/copyright'),'worker image checks packaged font copyright evidence exists');

assert(fontCollector.includes('worker-image-provenance.json'),'font provenance collector references canonical worker-image-provenance.json');
assert(!fontCollector.includes('dpkg-query')&&!fontCollector.includes('dpkg'),'font provenance collector does not reference host dpkg-query/dpkg probing');

assert(candidates.candidates.length>=10,'font candidate catalog is substantive');
assert(candidates.candidates.every(x=>x.license==='OFL-1.1'&&x.commercialUseAllowed===true),'candidate catalog contains only researched commercial-use OFL families');
assert(candidates.candidates.some(x=>x.id==='plus-jakarta-sans'&&x.vietnamese===true&&x.recommendation==='PRIMARY_DM_SANS_REPLACEMENT'),'Plus Jakarta Sans is explicit DM Sans replacement candidate');
assert(candidates.candidates.some(x=>x.id==='newsreader'&&x.vietnamese===true),'Newsreader premium VI-capable experiment exists');
assert(candidates.candidates.some(x=>x.id==='fraunces'&&x.vietnamese===true),'Fraunces premium VI-capable experiment exists');

assert(css.includes('font-family:"Noto Serif JP","Yu Mincho"'),'Japanese page headings prefer bundled Noto');
assert(css.includes('font-family:"Noto Serif SC","Songti SC"'),'Simplified Chinese page headings prefer bundled Noto');
assert(css.includes('font-family:"Noto Serif KR","Apple SD Gothic Neo"'),'Korean page headings prefer bundled Noto');

assert(templates.items.length===28,'all 16 legacy + 12 V2 templates governed');
assert(templates.items.every(x=>x.sourceType==='repo-authored-code-composition'),'all current template records remain repo-authored compositions');
assert(templates.items.every(x=>x.externalReferenceUrl===null),'current template records do not claim external template source');
assert(templates.items.filter(x=>x.templateSeed<=16).every(x=>x.step17cReview?.productionDecision==='PENDING_OWNER_ORIGINALITY_ATTESTATION_AND_VISUAL_SIMILARITY_REVIEW'),'legacy templates remain originality/similarity gated');
assert(templates.items.filter(x=>x.templateSeed>=101).every(x=>x.step17eReview?.productionDecision==='EXPERIMENT_ONLY_PENDING_FULL_PROMOTION_GATES'),'V2 templates remain experiment-only gated');
assert(templates.items.every(x=>x.status==='UNKNOWN'),'Step17F does not fake template production APPROVED status');

assert(!/^\s*import\s/m.test(art),'renderer template-art has no external module/asset import');
for(const name of ['luxury-editorial','midnight-lume','botanical-poise','washi-elegance','soft-seoul','art-deco-noir','photo-story','quiet-minimal','watercolor-bloom','golden-hour','quiet-noir','bold-pop','kawaii-joy','classic-letterpress','celestial-night','little-wonders']){
  assert(art.includes(`"${name}"`),`renderer contains governed template id: ${name}`);
}
for(const name of ['whispered-type','museum-note','monogram-orbit','ribbon-line','memory-window','type-celebration','quiet-seal','pressed-shadow','ink-pause','petal-geometry','night-ledger','soft-fold']){
  assert(art.includes(`"${name}"`),`renderer contains V2 governed template id: ${name}`);
}

assert(concepts.status==='EXPERIMENT_ONLY','new template concepts cannot publish directly');
assert(concepts.concepts.length>=12,'at least 12 original replacement concepts exist');
assert(new Set(concepts.concepts.map(x=>x.id)).size===concepts.concepts.length,'replacement concept IDs are unique');
assert(concepts.concepts.every(x=>x.thesis&&x.signatureMove&&x.assetStrategy),'every replacement concept has thesis/signature/asset strategy');
assert(concepts.concepts.every(x=>!/(etsy|canva|pinterest|competitor|stock template)/i.test(`${x.thesis} ${x.signatureMove} ${x.assetStrategy}`)),'replacement concepts are not framed as copied third-party templates');
assert(typography.status==='EXPERIMENT_ONLY','typography alternatives remain experiment-only');
assert(typography.experiments.every(x=>Array.isArray(x.promoteOnlyIf)&&x.promoteOnlyIf.length>=4),'font experiments have promotion evidence gates');

console.log(`PASS font/template governance source stress: ${checks.length} checks`);
for(const c of checks)console.log(`- ${c}`);
