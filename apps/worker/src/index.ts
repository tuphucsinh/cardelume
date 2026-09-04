import { createHash, randomUUID } from "node:crypto";
import { CardDocumentSchema, GenerationBriefSchema } from "@cardelume/card-schema";
import { createAIProviderFromEnv, createGenerationBudget, generateCreativeDirectorDirections, creativeQualityRisks, criticRepairDirections, buildDeterministicCreativeFallback, type AICallTelemetry, type CreativeDirectorOutcome } from "@cardelume/ai";
import { claimGenerationJob, listManagedTemplates, listRecentStyleFingerprints, recordGenerationAIUsage, recordFunnelEventForOrder, recordTemplateEvent, rollupTemplateMetricsDaily, cleanupTemplateEvents, cleanupFunnelEvents, cleanupStyleFingerprints, cleanupGenerationAIUsage, cleanupCompletedGenerationJobs, cleanupRateLimitBuckets, cleanupStaleWorkerHeartbeats, completeGenerationJob, failGenerationJob, failStaleGenerationJobs, hasCompleteFinalEntitlements, listPhotoAssetCleanupCandidates, loadPaidCardRenderContext, loadTrustedAssetsForVersion, markPhotoAssetDeleted, persistFinalEntitlements, removeWorkerHeartbeat, updateGenerationStage, upsertWorkerHeartbeat } from "@cardelume/db";
import { createBoss, ensureCardeLumeQueues, QUEUES } from "@cardelume/queue";
import { assertRendererFontsReady, CURRENT_RENDERER_VERSION, renderProductionFinal } from "@cardelume/renderer";
import { R2ObjectStorage } from "@cardelume/storage";
import { z } from "zod";
import { buildCreativeCandidatePack, expandedCreativeCandidatePool, selectGenerationTemplates, type TemplateRankInput, type RecentStyleFingerprint } from "@cardelume/templates";
import { assertEnvironmentIsolation } from "@cardelume/core";

assertEnvironmentIsolation(process.env);
const boss=createBoss();
let storage:R2ObjectStorage|undefined;
function privateStorage(){return storage??=(new R2ObjectStorage());}
const nodeId=process.env.NODE_ID||`node-${process.pid}`;
const workerVersion=process.env.APP_VERSION||"0.4.3-step.17i";
let activeJobs=0;
async function heartbeat(){await upsertWorkerHeartbeat({nodeId,version:workerVersion,activeJobs});}
async function tracked<T>(task:()=>Promise<T>):Promise<T>{activeJobs++;await heartbeat().catch(()=>undefined);try{return await task();}finally{activeJobs=Math.max(0,activeJobs-1);await heartbeat().catch(()=>undefined);}}

const FinalRenderJobSchema=z.object({
  productKey:z.literal("cardelume"),
  resourceId:z.string().uuid(),
  jobId:z.string().min(1).max(180),
  orderId:z.string().uuid(),
  orderItemId:z.string().uuid()
});

function int(name:string,fallback:number){const n=Number(process.env[name]||fallback);return Number.isFinite(n)&&n>0?Math.floor(n):fallback;}
function log(event:string,fields:Record<string,unknown>={}){console.log(JSON.stringify({level:"info",event,nodeId,...fields}));}
function safeVersion(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,80);}
function finalKeys(input:{orderId:string;orderItemId:string;resourceVersionId:string}){
  const base=`finals/cardelume/${input.orderId}/${input.orderItemId}/${input.resourceVersionId}/renderer-${safeVersion(CURRENT_RENDERER_VERSION)}`;
  return{jpg:`${base}/card.jpg`,pdf:`${base}/card.pdf`};
}
function finalNames(resourceId:string,format:string){
  const short=resourceId.slice(0,8);
  return{jpg:`CardeLume-${short}-${format}.jpg`,pdf:`CardeLume-${short}-${format}.pdf`};
}

const GenerationJobSchema=z.object({productKey:z.literal("cardelume"),resourceId:z.string().uuid(),jobId:z.string().uuid()});

function estimateAiCostMicros(t:AICallTelemetry){
  const inputRate=Number(process.env.AI_INPUT_COST_PER_MILLION_USD||0),outputRate=Number(process.env.AI_OUTPUT_COST_PER_MILLION_USD||0);
  if(!Number.isFinite(inputRate)||!Number.isFinite(outputRate)||(!t.inputTokens&&!t.outputTokens))return undefined;
  return Math.max(0,Math.round((t.inputTokens??0)*inputRate+(t.outputTokens??0)*outputRate));
}
async function persistAiTelemetry(jobId:string,t:AICallTelemetry){await recordGenerationAIUsage({id:randomUUID(),generationJobId:jobId,phase:t.phase,provider:t.provider,model:t.model,inputTokens:t.inputTokens,outputTokens:t.outputTokens,latencyMs:t.latencyMs,estimatedCostMicros:estimateAiCostMicros(t),success:t.success,errorCode:t.errorCode}).catch(()=>undefined);}

if(process.env.APP_MODE==="live"){createAIProviderFromEnv();privateStorage();}
assertRendererFontsReady();
await boss.start();
await ensureCardeLumeQueues(boss);
await boss.schedule(QUEUES.cleanup,"17 * * * *",{kind:"maintenance"});
await heartbeat();
const heartbeatTimer=setInterval(()=>{void heartbeat().catch(error=>log("worker_heartbeat_failed",{error:error instanceof Error?error.message:"unknown"}));},int("WORKER_HEARTBEAT_INTERVAL_SECONDS",15)*1000);
heartbeatTimer.unref();

await boss.work(QUEUES.aiPlan,{localConcurrency:int("AI_PLAN_CONCURRENCY",1)},async jobs=>tracked(async()=>{const job=jobs[0];if(!job)return;
  const payload=GenerationJobSchema.safeParse(job.data);if(!payload.success)throw new Error("invalid_ai_plan_job_payload");
  log("ai_plan_start",{queueJobId:job.id,jobId:payload.data.jobId});
  const claim=await claimGenerationJob({jobId:payload.data.jobId});if(claim.state==="ready"){log("ai_plan_already_ready",{jobId:payload.data.jobId});return;}
  let brief:ReturnType<typeof GenerationBriefSchema.parse>|undefined;
  let catalog:Awaited<ReturnType<typeof listManagedTemplates>>|undefined;
  let rankInput:TemplateRankInput|undefined;
  try{
    brief=GenerationBriefSchema.parse(claim.job.brief);
    await updateGenerationStage({jobId:payload.data.jobId,status:"composing",stage:2});
    catalog=await listManagedTemplates();
    const persistedRecent=await listRecentStyleFingerprints({userId:claim.job.user_id,limit:5}).catch(()=>[]);
    const refreshRecent=(brief.refreshContext?.priorTemplateIds??[]).flatMap(templateId=>{
      const template=catalog!.find(item=>item.id===templateId);
      return template?[{familyId:template.familyId,templateId:template.id,visualDirection:template.visualDirection,createdAt:new Date().toISOString()}]:[];
    });
    // Refresh evidence is intentionally soft. It nudges novelty but cannot veto the best candidate.
    const recentStyles:RecentStyleFingerprint[]=[...refreshRecent,...persistedRecent.map(r=>({familyId:r.familyId,templateId:r.templateId??undefined,visualDirection:r.visualDirection,accentMode:r.accentMode??undefined,createdAt:r.createdAt??undefined}))].slice(0,8);
    const narrowedRankInput:TemplateRankInput={market:brief.market,locale:brief.locale,format:brief.format,feeling:brief.feeling,occasion:brief.occasion,hasPhoto:brief.hasPhoto,recentStyles};
    rankInput=narrowedRankInput;
    const pack=buildCreativeCandidatePack(catalog,narrowedRankInput);
    if(pack.all.length<3)throw new Error("ai_template_candidates_insufficient");
    const budget=createGenerationBudget();
    const provider=createAIProviderFromEnv();
    let outcome:CreativeDirectorOutcome;const directorStarted=Date.now();
    try{outcome=await generateCreativeDirectorDirections(provider,brief,pack.all,recentStyles,"creative_director",undefined,budget);await persistAiTelemetry(payload.data.jobId,outcome.telemetry);}catch(error){await persistAiTelemetry(payload.data.jobId,{phase:"creative_director",provider:provider.providerName,model:provider.modelName,latencyMs:Date.now()-directorStarted,success:false,errorCode:error instanceof Error?error.message:"generation_provider_failed"});throw error;}
    let candidatePool=pack.all;
    if(outcome.kind==="expand_pool"){
      budget.ensureAiBudget();
      const priorCritique={reasonCode:outcome.reasonCode,desiredTraits:outcome.desiredTraits};
      candidatePool=expandedCreativeCandidatePool(catalog,narrowedRankInput,16);
      if(candidatePool.length<3)throw new Error("ai_template_candidates_insufficient");
      const expandedStarted=Date.now();
      try{outcome=await generateCreativeDirectorDirections(provider,brief,candidatePool,recentStyles,"expanded_director",priorCritique,budget);await persistAiTelemetry(payload.data.jobId,outcome.telemetry);}catch(error){await persistAiTelemetry(payload.data.jobId,{phase:"expanded_director",provider:provider.providerName,model:provider.modelName,latencyMs:Date.now()-expandedStarted,success:false,errorCode:error instanceof Error?error.message:"generation_provider_failed"});throw error;}
      if(outcome.kind!=="ready")throw new Error("ai_creative_range_insufficient");
    }
    if(outcome.kind!=="ready")throw new Error("ai_creative_range_insufficient");
    let result=outcome.result;const risks=creativeQualityRisks(result,brief,recentStyles);
    const criticTriggers=new Set(["creative_range","copy_risk","low_confidence","low_wow","market_tension","low_novelty"]);
    const premiumCritical=new Set(["creative_range","copy_risk","low_confidence","low_wow"]);
    if(risks.includes("creative_range")&&candidatePool.length<12)candidatePool=expandedCreativeCandidatePool(catalog,narrowedRankInput,16);
    if(risks.some(r=>criticTriggers.has(r))){
      budget.ensureAiBudget();
      const criticStarted=Date.now();
      try{
        const repaired=await criticRepairDirections(provider,brief,result,candidatePool,risks,budget);
        result=repaired.result;
        if(repaired.telemetry.latencyMs>0)await persistAiTelemetry(payload.data.jobId,repaired.telemetry);
      }catch(error){
        await persistAiTelemetry(payload.data.jobId,{phase:"critic_repair",provider:provider.providerName,model:provider.modelName,latencyMs:Date.now()-criticStarted,success:false,errorCode:error instanceof Error?error.message:"ai_critic_failed"});
        if(risks.some(r=>premiumCritical.has(r))||(error instanceof Error&&(error.message==="ai_budget_exhausted"||error.message==="ai_provider_timeout")))throw error;
      }
      const remaining=creativeQualityRisks(result,brief,recentStyles);
      if(remaining.some(r=>premiumCritical.has(r)))throw new Error("ai_premium_quality_not_met");
    }
    await completeGenerationJob({jobId:payload.data.jobId,result});
    await Promise.all(result.directions.flatMap((direction,index)=>direction.templateId&&direction.templateVersionId?[recordTemplateEvent({eventId:randomUUID(),templateId:direction.templateId,templateVersionId:direction.templateVersionId,eventType:"ai_assigned",source:"ai_direction",market:brief!.market,locale:brief!.locale,rankPosition:index+1})]:[])).catch(()=>undefined);
    log("ai_plan_complete",{jobId:payload.data.jobId,directionCount:result.directions.length});
  }catch(error){
    const raw=error instanceof Error?error.message:"generation_provider_failed";
    const safe=raw.startsWith("ai_")||raw.startsWith("generation_")?raw:"generation_provider_failed";
    const errorCode=safe.startsWith("ai_")?safe:"generation_provider_failed";
    log("ai_plan_recovery_started",{jobId:payload.data.jobId,errorCode});
    try{
      if(!brief||!catalog||!rankInput)throw new Error("ai_generation_safe_failure");
      const fallbackCandidates=selectGenerationTemplates(catalog,{...rankInput,catalogMode:"production"});
      const fallbackResult=buildDeterministicCreativeFallback(brief,fallbackCandidates);
      await completeGenerationJob({jobId:payload.data.jobId,result:fallbackResult});
      log("ai_plan_fallback_used",{jobId:payload.data.jobId,directionCount:fallbackResult.directions.length});
    }catch{
      await failGenerationJob({jobId:payload.data.jobId,errorCode:"ai_generation_safe_failure"});
      log("ai_plan_safe_failure",{jobId:payload.data.jobId,errorCode:"ai_generation_safe_failure"});
    }
  }
}));

await boss.work(QUEUES.final,{localConcurrency:int("FINAL_RENDER_CONCURRENCY",1)},async jobs=>tracked(async()=>{const job=jobs[0];if(!job)return;
  const parsed=FinalRenderJobSchema.safeParse(job.data);
  if(!parsed.success)throw new Error("invalid_final_render_job_payload");
  const payload=parsed.data;
  log("final_render_start",{queueJobId:job.id,jobId:payload.jobId,orderId:payload.orderId,orderItemId:payload.orderItemId,productKey:payload.productKey});

  if(await hasCompleteFinalEntitlements({orderId:payload.orderId,orderItemId:payload.orderItemId})){
    log("final_render_already_complete",{jobId:payload.jobId,orderId:payload.orderId,orderItemId:payload.orderItemId});
    return;
  }

  const context=await loadPaidCardRenderContext({orderId:payload.orderId,orderItemId:payload.orderItemId});
  if(!context)throw new Error("paid_card_render_context_not_found");
  if(context.resourceId!==payload.resourceId)throw new Error("final_render_resource_mismatch");
  const doc=CardDocumentSchema.parse(context.document);

  const trusted=await loadTrustedAssetsForVersion({resourceVersionId:context.resourceVersionId});
  const assets:Record<string,{bytes:Uint8Array;contentType:"image/jpeg"}>={};
  for(const asset of trusted){
    const object=await privateStorage().getPrivate(asset.cleanObjectKey);
    if(object.contentType!=="image/jpeg"||object.bytes.byteLength!==asset.byteSize)throw new Error("trusted_photo_object_mismatch");
    const digest=createHash("sha256").update(object.bytes).digest("hex");
    if(digest!==asset.sha256)throw new Error("trusted_photo_sha256_mismatch");
    assets[asset.assetId]={bytes:object.bytes,contentType:"image/jpeg"};
  }
  const rendered=await renderProductionFinal(doc,{assets});
  const keys=finalKeys(context),names=finalNames(context.resourceId,doc.format);

  await privateStorage().putPrivate({
    key:keys.jpg,bytes:rendered.jpg,contentType:"image/jpeg",
    metadata:{product:"cardelume",renderer:CURRENT_RENDERER_VERSION,format:doc.format}
  });
  await privateStorage().putPrivate({
    key:keys.pdf,bytes:rendered.pdf,contentType:"application/pdf",
    metadata:{product:"cardelume",renderer:CURRENT_RENDERER_VERSION,format:doc.format}
  });

  // Re-check authoritative PAID inside the DB transaction immediately before
  // entitlements become visible. If payment state changed, private R2 objects
  // remain unentitled/orphaned and a cleanup job may remove them later.
  const entitlementIds=await persistFinalEntitlements({
    orderId:context.orderId,orderItemId:context.orderItemId,resourceId:context.resourceId,
    assets:[
      {assetKind:"jpg",downloadName:names.jpg,contentType:"image/jpeg",finalObjectKey:keys.jpg},
      {assetKind:"pdf",downloadName:names.pdf,contentType:"application/pdf",finalObjectKey:keys.pdf}
    ]
  });
  await recordFunnelEventForOrder({orderId:context.orderId,eventId:randomUUID(),eventType:"final_render_completed",source:"worker",dedupeKey:`final_render_completed:${context.orderId}`}).catch(()=>undefined);
  log("final_render_complete",{
    jobId:payload.jobId,orderId:context.orderId,orderItemId:context.orderItemId,
    renderer:CURRENT_RENDERER_VERSION,format:doc.format,entitlementCount:entitlementIds.length,
    jpgBytes:rendered.jpg.byteLength,pdfBytes:rendered.pdf.byteLength
  });
}));

await boss.work(QUEUES.cleanup,{localConcurrency:int("CLEANUP_CONCURRENCY",1)},async jobs=>tracked(async()=>{const job=jobs[0];if(!job)return;
  log("cleanup_start",{jobId:job.id});
  const expiredGenerationJobs=await failStaleGenerationJobs({olderThanMinutes:int("GENERATION_JOB_TTL_MINUTES",5)});
  const candidates=await listPhotoAssetCleanupCandidates({olderThanMinutes:int("PHOTO_QUARANTINE_TTL_MINUTES",120),limit:25});
  let removed=0;
  for(const candidate of candidates){
    try{
      await privateStorage().deletePrivate(candidate.quarantine_object_key);
      await privateStorage().deletePrivate(candidate.clean_object_key);
      if(await markPhotoAssetDeleted({assetId:candidate.id}))removed++;
    }catch(error){log("photo_cleanup_delete_failed",{assetId:candidate.id,error:error instanceof Error?error.message:"unknown"});}
  }
  const rolledTemplateMetricRows=await rollupTemplateMetricsDaily({lookbackDays:2});
  const removedTemplateEvents=await cleanupTemplateEvents({olderThanDays:int("TEMPLATE_EVENT_RETENTION_DAYS",90)});
  const removedFunnelEvents=await cleanupFunnelEvents({olderThanDays:int("FUNNEL_EVENT_RETENTION_DAYS",180)});
  const removedStyleFingerprints=await cleanupStyleFingerprints({olderThanDays:int("STYLE_FINGERPRINT_RETENTION_DAYS",180)});
  const removedAiUsage=await cleanupGenerationAIUsage({olderThanDays:int("AI_USAGE_RETENTION_DAYS",30)});
  const removedGenerationJobs=await cleanupCompletedGenerationJobs({olderThanDays:int("GENERATION_RESULT_RETENTION_DAYS",7)});
  const removedRateBuckets=await cleanupRateLimitBuckets({olderThanHours:48});
  const removedStaleWorkers=await cleanupStaleWorkerHeartbeats({olderThanHours:24});
  log("cleanup_complete",{jobId:job.id,removed,expiredGenerationJobs,rolledTemplateMetricRows,removedTemplateEvents,removedFunnelEvents,removedStyleFingerprints,removedAiUsage,removedGenerationJobs,removedRateBuckets,removedStaleWorkers});
}));

log("worker_ready",{version:workerVersion});

let stopping=false;async function shutdown(){if(stopping)return;stopping=true;clearInterval(heartbeatTimer);await removeWorkerHeartbeat({nodeId}).catch(()=>undefined);await boss.stop({graceful:true});process.exit(0);}
process.on("SIGTERM",()=>{void shutdown();});
process.on("SIGINT",()=>{void shutdown();});
