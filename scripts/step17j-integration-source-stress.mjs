#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');const json=p=>JSON.parse(read(p));const exists=p=>fs.existsSync(path.join(root,p));
const pass=[];const check=(ok,name)=>{if(!ok)throw new Error(`step17j_source_failed:${name}`);pass.push(name)};
const pkg=json('package.json'),webPkg=json('apps/web/package.json');
for(const p of ['apps/web','apps/worker','packages/ai','packages/card-schema','packages/core','packages/db','packages/queue','packages/renderer','packages/storage','packages/templates','packages/ui'])check(json(`${p}/package.json`).version===pkg.version,`version:${p}`);
check(pkg.version==='0.4.3-step.17j','root-version');check(webPkg.dependencies.next==='16.3.3','next-16.3.3-security-pin');
const migration=read('packages/db/migrations/0011_funnel_and_launch_approvals.sql');
check(/create table if not exists funnel_events/.test(migration),'funnel-table');check(/enable row level security/.test(migration),'funnel-and-approval-rls');check(/create table if not exists template_launch_approvals/.test(migration),'launch-approval-table');check(/cardelume_demote_template_launch_on_version_change/.test(migration),'version-change-demotes-approval');check(/template_launch_approved_evidence_check/.test(migration),'db-approved-evidence-check');check(/template_launch_approvals_immutable/.test(migration)&&/before update or delete/.test(migration),'db-approval-history-immutable');
const funnel=read('packages/db/src/funnel.ts'),funnelRoute=read('apps/web/app/api/analytics/funnel/route.ts');
check(/createHmac\("sha256"/.test(funnelRoute)&&/ANALYTICS_PSEUDONYM_KEY/.test(funnelRoute),'browser-funnel-hmac');check(/hmac\(/.test(funnel)&&/ANALYTICS_PSEUDONYM_KEY/.test(funnel),'server-funnel-hmac');check(!/\n\s*(?:message|recipient|photo_url|ip_address)\s+/i.test(migration),'funnel-schema-no-content-or-ip');
const studio=read('apps/web/components/card-studio.tsx'),paid=read('apps/web/components/paid-unlock.tsx');
for(const e of ['studio_started','generation_requested','results_viewed','direction_selected','finish_opened','checkout_opened','checkout_started'])check(studio.includes(`"${e}"`),`funnel-web:${e}`);check(paid.includes('download_jpg')&&paid.includes('download_pdf'),'funnel-downloads');
const webhook=read('apps/web/app/api/webhooks/dodo/route.ts'),worker=read('apps/worker/src/index.ts');check(webhook.includes('payment_completed'),'server-payment-funnel');check(worker.includes('final_render_completed'),'server-render-funnel');
const templatesDb=read('packages/db/src/templates.ts'),launchRoute=read('apps/web/app/api/admin/templates/[templateId]/launch/route.ts');check(/template_launch_evidence_required/.test(templatesDb),'approval-requires-three-evidence');check(/template_launch_runtime_not_ready/.test(templatesDb),'approval-requires-active-healthy-passed');check(/Approve for launch/.test(read('apps/web/app/admin/templates/template-admin.tsx')),'admin-explicit-launch-action');check(launchRoute.includes('decideManagedTemplateLaunch'),'admin-launch-route');
const proxy=read('apps/web/proxy.ts');check(proxy.includes('startsWith("/admin")')&&proxy.includes('startsWith("/api/admin")'),'all-admin-routes-protected');check(proxy.includes('ADMIN_REQUIRE_EDGE_ACCESS')&&proxy.includes('cf-access-jwt-assertion'),'cloudflare-access-boundary');check(proxy.includes('x-cardelume-admin-actor')&&launchRoute.includes('x-cardelume-admin-actor'),'trusted-admin-actor-audit-trail');check(exists('apps/web/app/api/admin/funnel/route.ts'),'admin-operating-pulse-endpoint');
const csp=read('apps/web/lib/csp.ts'),prod=read('apps/web/lib/production-config.server.ts');check(/nonce-\$\{nonce\}/.test(csp)&&/strict-dynamic/.test(csp)&&!/script-src[^\n]*unsafe-inline/.test(csp),'nonce-csp-no-script-unsafe-inline');check(prod.includes('CSP_ENFORCE')&&prod.includes('ADMIN_REQUIRE_EDGE_ACCESS'),'prod-security-gates');check(prod.includes('LEGAL_CONTENT_APPROVED')&&prod.includes('LEGAL_ENTITY_NAME')&&prod.includes('LEGAL_CONTACT_EMAIL'),'prod-legal-gates');check(prod.includes('ANALYTICS_PSEUDONYM_KEY'),'prod-analytics-hmac-key');
for(const p of ['apps/web/app/privacy/page.tsx','apps/web/app/terms/page.tsx','apps/web/app/refund/page.tsx'])check(!/placeholder/i.test(read(p)),`legal-no-placeholder:${p}`);
check(!/shareUrl|Share link|hosted share/i.test(paid),'no-phantom-hosted-share-ui');

const marketing=read('packages/templates/src/index.ts'),home=read('apps/web/app/page.tsx');
check(marketing.includes('step17jShowcaseTemplatesForEnvironment')&&marketing.includes('t.launchStatus==="approved"'),'production-marketing-approved-only');
check(home.includes('step17jShowcaseTemplatesForEnvironment(process.env.APP_ENV)'),'homepage-uses-step17j-showroom-gate');
check(home.includes('hero-brand-object')&&home.includes('marketingTemplates[0]'),'homepage-safe-brand-fallback');
check(!/direction="(?:editorial|botanical|midnight)"/.test(home),'homepage-no-hardcoded-unapproved-template-directions');

const compose=read('docker-compose.yml');check((compose.match(/0\.4\.3-step\.17j/g)||[]).length>=4,'compose-step17j');check(read('docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md').includes('0001 → 0011'),'step18-migration-0011');

const governanceRegistry=read('governance/check-registry.mjs'),governanceRunner=read('scripts/governance-runner.mjs'),rootPackage=json('package.json');
check(governanceRegistry.includes("tier: 'fast'")&&governanceRegistry.includes("tier: 'release'")&&governanceRegistry.includes("tier: 'heavy'"),'governance-three-tiers');
for(const script of ['check:fast','check:release','check:heavy','check:status'])check(Boolean(rootPackage.scripts?.[script]),`governance-script:${script}`);
check(!Object.keys(rootPackage.scripts||{}).some(k=>/^test:step17/.test(k)),'no-step-specific-root-aggregates');
check(!governanceRunner.includes('docker compose up')&&!governanceRunner.includes('kubectl')&&!governanceRunner.includes('production deploy'),'governance-runner-no-deploy');
check(exists('governance/README.md')&&exists('docs/HISTORY_INDEX.md'),'governance-docs');
check(!exists('quality/step17f/logs'),'per-check-log-sprawl-removed');

check(Object.keys(rootPackage.scripts||{}).length<=36,'root-command-surface-compressed');
const authorityDocs=['README.md','START_HERE_HERMES.txt','docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md','docs/SPEC_INDEX_V7.md','docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md'].map(read).join('\n');
check(!/pre-pi5-readiness|lumer-release-evidence|test:step17[cfde]?/i.test(authorityDocs),'current-authority-has-no-superseded-governance-entrypoints');
check(exists('docs/GOVERNANCE_COMPRESSION_0.4.3_STEP17G.md')&&exists('docs/MARKETING_APPROVAL_BOUNDARY_0.4.3_STEP17H.md')&&exists('docs/PREMIUM_EXPERIENCE_CONVERGENCE_0.4.3_STEP17I.md')&&exists('docs/MATERIAL_MAGIC_GALLERY_PREMIUM_CONVERGENCE_0.4.3_STEP17J.md')&&exists('docs/VALIDATION_REPORT_0.4.3_STEP17J.md')&&exists('docs/STEP17J_HERMES_LUMER_HANDOFF.md')&&exists('quality/step17j/STEP17J_SOURCE_VALIDATION.json'),'step17j-current-docs');

const schema=read('packages/card-schema/src/index.ts'),ai=read('packages/ai/src/index.ts'),recovery=read('apps/web/app/d/[recoveryId]/page.tsx');
check(schema.includes('customerRationale:z.string().min(1).max(140).optional()'),'customer-rationale-schema');
check(ai.includes('customer-facing, same language as brief')&&ai.includes('never hidden reasoning'),'customer-rationale-ai-boundary');
check(ai.includes('safeCustomerRationale')&&ai.includes('chain[- ]of[- ]thought')&&ai.includes('forbidden.test(text)?undefined:text'),'customer-rationale-fail-closed-sanitizer');
check(studio.includes('reveal-folio')&&studio.includes('viewTransitionName:`card-')&&studio.includes('withTransition(()=>setPhase("results"))'),'folio-reveal-result-continuity');
check(studio.includes('messageUndo')&&studio.includes('undoMessage')&&!studio.includes('rewriteTone("playful")'),'finish-rewrite-undo-and-simplification');
check(studio.includes('Print layout (optional)')&&studio.includes('Digital PDF layout'),'digital-print-layout-clarity');
check(studio.includes('useState<""|(typeof relations)[number]>("")'),'neutral-relationship-default');
check(home.includes('hero-material-stage')&&home.includes('marketingTemplates[0]')&&home.includes('hero-brand-object'),'single-material-hero');
check(recovery.includes('recovery-keepsake'),'postpay-keepsake-handoff');
check(studio.includes('data-phase-focus')&&studio.includes('[data-phase-focus]'),'phase-focus-management');
check(!studio.includes('generated?.creativeThesis'),'raw-creative-thesis-not-exposed');


const physical=read('apps/web/components/physical-effects.tsx'),pricing=read('apps/web/lib/pricing.ts'),layout=read('apps/web/app/layout.tsx');
check(marketing.includes('step17jPortfolioSlugs')&&marketing.includes('step17jPortfolioTemplates'),'step17j-curated-portfolio');
for(const slug of ['luxury-editorial','midnight-lume','botanical-poise','washi-elegance','soft-seoul','art-deco-noir','photo-story','quiet-minimal','classic-letterpress','celestial-night','museum-note','memory-window','whispered-type','night-ledger','pressed-shadow','monogram-orbit'])check(marketing.includes(`"${slug}"`),`step17j-portfolio:${slug}`);
check((marketing.match(/"luxury-editorial"|"midnight-lume"|"botanical-poise"|"washi-elegance"|"soft-seoul"|"art-deco-noir"|"photo-story"|"quiet-minimal"|"classic-letterpress"|"celestial-night"/g)||[]).length>=10,'step17j-prioritizes-041-ten');
for(const field of ['materialWorld','materialCues','energy','colorWorld','motionProfile','localeStrengths','printFormatStrength'])check(marketing.includes(field),`step17j-material-metadata:${field}`);
check(marketing.includes('candidate.template.materialWorld===prior.template.materialWorld')&&marketing.includes('worldPenalty'),'ai-ranking-material-diversity');
check(ai.includes('materialWorld:item.template.materialWorld')&&ai.includes('three different IDs that still feel like siblings is not enough'),'ai-director-sees-material-world');
check((home.includes('marketingTemplates.slice(0,16)')&&home.includes('step17j-style-card')&&home.includes('gallery-world-${t.materialWorld}'))||(home.includes('ProductProofSection')&&exists('apps/web/components/product-proof-section.tsx')&&(()=>{const ps=read('apps/web/components/product-proof-section.tsx'),pl=exists('apps/web/content/product-proof.ts')?read('apps/web/content/product-proof.ts'):(exists('apps/web/lib/product-proof.ts')?read('apps/web/lib/product-proof.ts'):'');return ps.includes('getRetainedMvpTemplates(templates)')&&(ps.includes('retainedTemplates.map((t,index)')||ps.includes('retainedTemplates.map((t, index)')||/retainedTemplates\.map\(\s*\(t,\s*index\)/.test(ps))&&ps.includes('step17j-style-card')&&ps.includes('gallery-world-${t.materialWorld}')&&(pl.includes('function getRetainedMvpTemplates')||pl.includes('getRetainedMvpTemplates'));})()),'041-gallery-presentation-16');
check(home.includes('PhysicalCardSurface className="gallery-physical"')||(home.includes('ProductProofSection')&&read('apps/web/components/product-proof-section.tsx').includes('PhysicalCardSurface className="gallery-physical"')),'gallery-material-interaction');
check(physical.includes('const defaults:Prefs={master:false,haptics:false,gyro:false,lighting:false}')&&physical.includes('cardelume.physical-effects.v2'),'automatic-material-magic-default');
check(physical.includes('--pointer-rx')&&physical.includes('--pointer-ry')&&physical.includes('requestAnimationFrame'),'pointer-tilt-raf');
check(read('apps/web/components/site-header.tsx').includes('PhysicalEffectsControl')&&!studio.includes('PhysicalEffectsControl'),'no-fx-settings-in-customer-path');
check(studio.includes('print-layout-picker')&&studio.includes('print-layout-thumb'),'visual-print-layout-picker');
check(studio.includes('Digital PDF layout')&&studio.includes('no physical card'),'print-layout-digital-clarity');
check(read('apps/web/app/globals.css').includes('@keyframes palette-bloom')&&studio.includes('palette-feedback show'),'palette-bloom-visible-intelligence');
check(layout.includes('@fontsource/cormorant-garamond')&&layout.includes('@fontsource/plus-jakarta-sans'),'english-premium-font-pair');
for(const market of ['US','GB','CA','AU','SG','JP','KR','FR','DE','ES','IT','BR','MX','CN','VN','IN'])check(pricing.includes(`${market}:{market:"${market}"`),`pricing-market:${market}`);
check(pricing.includes('HOLIDAY_TARGET')&&pricing.includes('holidayBundle:HOLIDAY_TARGET'),'holiday-bundle-logic-retained');
check(!paid.includes('<HolidayBundleCheckout'),'holiday-bundle-hidden-from-paid-ui');
check(studio.includes('magicTypography(')&&studio.includes('Magic Fit')===false,'magic-typography-remains-invisible-tech');
check(studio.includes('messageUndo')&&studio.includes('messageRef.current!==sourceMessage'),'message-refine-reversible-safe');
check(home.includes('hero-material-stage')&&home.includes('hero-physical'),'hybrid-hero-material-object');
check(read('apps/web/app/globals.css').includes('Base experience must already be premium'),'progressive-enhancement-budget-source-rule');

const priorStep17fCoverage=[
  'scripts/web-visual-direction-source-stress.mjs','scripts/product-ux-source-stress.mjs',
  'scripts/font-template-production-standard-stress.mjs','scripts/font-template-governance-source-stress.mjs',
  'scripts/template-portfolio-v2-source-stress.mjs','scripts/template-v2-multilingual-stress.mjs',
  'experiments/template-concepts/experimental-template-source-stress.mjs','scripts/ip-copyright-source-stress.mjs',
  'scripts/security-governance-source-stress.mjs','scripts/experiment-staging-source-stress.mjs',
  'scripts/pre-pi5-deployment-source-stress.mjs','scripts/lumer-toolkit-source-stress.mjs','scripts/premium-benchmark-source-stress.mjs'
];
for(const probe of priorStep17fCoverage)check(governanceRegistry.includes(probe),`release-registry-retains:${probe}`);
for(const probe of ['scripts/ai-creative-director-source-stress.ts','scripts/payment-boundary-source-stress.ts','scripts/photo-upload-boundary-stress.ts','scripts/generation-queue-source-stress.ts','scripts/dodo-payment-contract-stress.ts','scripts/recovery-security-stress.ts'])check(governanceRegistry.includes(probe),`release-registry-critical-boundary:${probe}`);



console.log(JSON.stringify({ok:true,checks:pass.length,names:pass},null,2));
