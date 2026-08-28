import { readFileSync } from "node:fs";
function read(path:string){return readFileSync(path,"utf8");}
function need(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}

const migration=read("packages/db/migrations/0008_managed_templates.sql");
const templates=read("packages/templates/src/index.ts");
const db=read("packages/db/src/templates.ts");
const checkout=read("apps/web/app/api/checkout/route.ts");
const snapshot=read("packages/card-schema/src/index.ts");
const checkoutDb=read("packages/db/src/checkout-payment.ts");
const worker=read("apps/worker/src/index.ts");
const publicApi=read("apps/web/app/api/templates/route.ts");
const eventsApi=read("apps/web/app/api/templates/events/route.ts");
const eventToken=read("apps/web/lib/template-event-token.server.ts");
const generationStatus=read("apps/web/app/api/generate/[jobId]/route.ts");
const productionConfig=read("apps/web/lib/production-config.server.ts");
const adminRoute=read("apps/web/app/api/admin/templates/[templateId]/route.ts");
const adminVersion=read("apps/web/app/api/admin/templates/[templateId]/versions/route.ts");
const adminCreate=read("apps/web/app/api/admin/templates/route.ts");
const proxy=read("apps/web/proxy.ts");
const studio=read("apps/web/components/card-studio.tsx");
const ready=read("apps/web/app/health/ready/route.ts");

for(const table of ["template_families","templates","template_versions","template_targeting","template_events","template_metrics_daily"])need(migration.includes(`create table if not exists ${table}`),`migration_missing_${table}`);
need(migration.includes("foreign key(id,current_version_id) references template_versions(template_id,id)"),"current_version_not_template_scoped");
need(migration.includes("card_versions_managed_template_pair_fkey"),"checkout_template_pair_fk_missing");
need(migration.includes("card_versions_managed_template_pair_complete_check"),"checkout_template_pair_completeness_missing");
need(/template_version_id uuid not null/.test(migration),"template_event_version_not_required");
need(migration.includes("template_events_template_version_pair_fkey"),"event_template_pair_fk_missing");
need(migration.includes("managed_template_source_check"),"template_source_check_missing");
const templateSeed=(migration.match(/insert into templates\([\s\S]*?on conflict do nothing;/)||[])[0]??"";
need((templateSeed.match(/\('10000000-/g)||[]).length===16,"template_seed_count_not_16");
need(!templateSeed.includes("'30000000-"),"template_seed_has_version_column_mismatch");
const versionSeed=(migration.match(/insert into template_versions\([\s\S]*?on conflict do nothing;/)||[])[0]??"";
need((versionSeed.match(/\('30000000-/g)||[]).length===16,"version_seed_count_not_16");
need(migration.includes("Exact bootstrap targeting"),"bootstrap_targeting_not_exact");

need(templates.includes('photoMode:visualDirection==="photo"?"required":"none"'),"bootstrap_photo_capability_mismatch");
need(templates.includes("function performanceScore"),"normalized_performance_missing");
need(templates.includes("Bayesian-style smoothing"),"performance_smoothing_missing");
need(templates.includes("surfaceTemplates"),"surface_ranker_missing");
need(templates.includes("selectGenerationTemplates"),"ai_template_selector_missing");
need(!templates.includes("usage_count"),"raw_usage_feedback_loop_detected");

need(snapshot.includes("templateVersionId:z.string().uuid().optional()")||snapshot.includes("templateVersionId: z.string().uuid().optional()"),"snapshot_version_missing");
need(snapshot.includes("template_identity_incomplete"),"snapshot_template_pair_guard_missing");
need(checkout.includes("templateVersionId:parsed.data.card.templateVersionId"),"checkout_exact_version_lookup_missing");
need(checkoutDb.includes("managed_template_source"),"checkout_source_persistence_missing");
need(db.includes("v.id=${input.templateVersionId}::uuid"),"db_exact_version_lookup_missing");
need(db.includes("row.template_source??\"ai_direction\""),"paid_source_attribution_missing");

need(worker.indexOf("const pack=buildCreativeCandidatePack")<worker.indexOf("outcome=await generateCreativeDirectorDirections"),"ai_called_before_template_ranker");
need(worker.includes("rollupTemplateMetricsDaily"),"template_daily_rollup_not_wired");
need(worker.includes("cleanupTemplateEvents"),"template_event_retention_not_wired");
need(ready.includes("templateCatalogReadiness"),"template_catalog_readiness_not_wired");

need(publicApi.includes("recommended:surface.recommended.map"),"recommended_surface_missing");
need(publicApi.includes("marketPicks:surface.marketPicks.map"),"market_surface_missing");
need(publicApi.includes("more:surface.more.map"),"show_more_surface_missing");
need(publicApi.includes('process.env.APP_MODE==="mock"')&&publicApi.includes("template_catalog_unavailable"),"live_catalog_not_fail_closed");
need(eventsApi.includes('.max(24)'),"template_event_batch_unbounded");
need(eventsApi.includes("checkUserRateLimit"),"template_event_rate_limit_missing");
need(publicApi.includes("issueTemplateEventToken")&&publicApi.includes("eventToken:"),"template_surface_event_token_missing");
need(eventsApi.includes("verifyTemplateEventToken")&&eventsApi.includes("template_event_forbidden"),"template_event_token_not_verified");
need(eventToken.includes("createHmac")&&eventToken.includes("timingSafeEqual")&&eventToken.includes("exp"),"template_event_hmac_not_hardened");
need(eventToken.includes("anonymousId")&&eventToken.includes("sid:"),"template_event_not_session_bound");
need(eventsApi.includes("templateEventDedupeKey")&&migration.includes("dedupe_key text unique")&&db.includes("dedupe_key"),"template_event_replay_dedupe_missing");
need(generationStatus.includes("issueTemplateEventToken")&&generationStatus.includes('source:"ai_direction"'),"ai_direction_event_token_missing");
need(productionConfig.includes("TEMPLATE_EVENT_SECRET"),"template_event_secret_not_launch_gated");
need(!eventsApi.includes("recipient")&&!eventsApi.includes("headline")&&!eventsApi.includes("photoAsset"),"template_event_api_collects_content");

need(adminVersion.includes("renderer_capability_expansion_not_approved"),"admin_renderer_capability_guard_missing");
need(adminCreate.includes("approvedRenderer.supportedFormats")&&adminCreate.includes("approvedRenderer.scriptSupport"),"admin_create_renderer_capability_inheritance_missing");
need(adminRoute.includes("archiveManagedTemplate"),"delete_not_archive");
need(!adminRoute.match(/delete\s+from\s+templates/i),"admin_hard_delete_detected");
need(proxy.includes("x-cardelume-admin-action"),"admin_action_csrf_guard_missing");
need(proxy.includes("TEMPLATE_ADMIN_PASSWORD"),"admin_auth_missing");
// Step 17F removed the customer template browser; backend 4+4+8 surfaces remain available for admin/research/compatibility.
need(!studio.includes("openTemplateBrowser"),"customer_template_browser_should_remain_removed");
need(studio.includes("templateVersionId:selected.templateVersionId"),"studio_checkout_version_missing");
need(studio.includes("templateSource:selected.templateSource"),"studio_checkout_source_missing");

console.log(JSON.stringify({status:"PASS",checks:{seedTemplates:16,seedVersions:16,versionPinned:true,archiveOnly:true,rankingBeforeAI:true,surface:"4+4+8 max",paidSourceAttribution:true,metricsRetention:true,adminActionGuard:true,catalogReadiness:true,signedAnalytics:true,sessionBoundAnalytics:true,replayDedupe:true}},null,2));
