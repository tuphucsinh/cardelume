import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createAIProviderFromEnv, generateCreativeDirectorDirections, creativeQualityRisks, criticRepairDirections, type AICallTelemetry, type CreativeDirectorOutcome } from "../packages/ai/src/index.ts";
import { portfolioV2AllTemplates, buildCreativeCandidatePack, expandedCreativeCandidatePool, type RecentStyleFingerprint, type TemplateMeta } from "../packages/templates/src/index.ts";
import type { GenerationBrief, GenerationResult } from "../packages/card-schema/src/index.ts";
import { assertEnvironmentIsolation, type AppEnvironment } from "../packages/core/src/environment.ts";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");

type GoldenBrief={
  id:string;goldenSetVersion:string;locale:string;market:string;script:"latin"|"cjk"|"hangul";occasion:string;recipient:string;relationship:string;feeling:string;detail:string;format:GenerationBrief["format"];
  textPressure:"short"|"medium"|"long";difficulty:string;photoMode:"none"|"optional"|"required";hasPhoto:boolean;photoProfile?:GenerationBrief["photoProfile"]&{fixture?:string};repeatIdentity?:string|null;sequenceIndex?:number|null;tags:string[];
};
type GoldenDoc={version:string;briefs:GoldenBrief[]};

type RunRecord={
  benchmarkRunId:string;experimentId?:string;appEnv:AppEnvironment;sourceCommit:string;configHash:string;goldenSetVersion:string;provider:string;model:string;briefId:string;repeat:number;locale:string;market:string;hasPhoto:boolean;photoFixture?:string;repeatIdentity?:string|null;sequenceIndex?:number|null;
  status:"success"|"failed";expanded:boolean;criticUsed:boolean;fallbackRequired:boolean;errorCode?:string;totalLatencyMs:number;telemetry:Array<AICallTelemetry&{estimatedCostUsd?:number}>;result?:GenerationResult;directionMeta?:Array<{familyId?:string;rank?:number;source:"initial"|"expanded"}>;
};

function arg(name:string,fallback?:string){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback;}
function flag(name:string){return process.argv.includes(name);}
function intArg(name:string,fallback:number){const n=Number(arg(name));return Number.isFinite(n)&&n>0?Math.floor(n):fallback;}
function normalizeOccasion(value:string){return ({birthday:"Birthday",anniversary:"Anniversary","thank-you":"Thank You",congratulations:"Congratulations",other:"Other"} as Record<string,string>)[value]??value;}
function normalizeFeeling(value:string){return ({warm:"Warm",elegant:"Elegant",playful:"Fun",romantic:"Romantic",quiet:"Elegant",formal:"Elegant"} as Record<string,string>)[value]??value;}
function pressure(value:GoldenBrief["textPressure"]){return value==="long"?1.34:value==="medium"?.96:.62;}
function clip(value:string,max:number){return Array.from(value).slice(0,max).join("");}
function toGenerationBrief(g:GoldenBrief):GenerationBrief{return{occasion:normalizeOccasion(g.occasion),recipient:clip(g.recipient,120),relationship:clip(g.relationship,80),feeling:normalizeFeeling(g.feeling),detail:clip(g.detail,180),format:g.format,locale:g.locale,hasPhoto:g.hasPhoto,photoProfile:g.hasPhoto&&g.photoProfile?{orientation:g.photoProfile.orientation,temperature:g.photoProfile.temperature,luminance:g.photoProfile.luminance,paletteConfidence:g.photoProfile.paletteConfidence,softened:g.photoProfile.softened}:undefined,market:g.market};}
function cost(t:AICallTelemetry){const ir=Number(process.env.AI_INPUT_COST_PER_MILLION_USD||0),or=Number(process.env.AI_OUTPUT_COST_PER_MILLION_USD||0);if(!Number.isFinite(ir)||!Number.isFinite(or))return undefined;return ((t.inputTokens||0)*ir+(t.outputTokens||0)*or)/1_000_000;}
function configHash(model:string){const config={model,provider:process.env.AI_PROVIDER||"mock",baseUrl:process.env.AI_API_BASE_URL||"",promptMax:process.env.AI_CREATIVE_PROMPT_MAX_BYTES||"28000",wow:process.env.AI_WOW_REPAIR_THRESHOLD||"0.70",confidence:process.env.AI_CONFIDENCE_REPAIR_THRESHOLD||"0.62",novelty:process.env.AI_NOVELTY_REPAIR_THRESHOLD||"0.50",catalog:"portfolioV2-step17e",golden:"1.0.0"};return createHash("sha256").update(JSON.stringify(config)).digest("hex");}
function directionMeta(result:GenerationResult,pool:ReturnType<typeof expandedCreativeCandidatePool>,source:"initial"|"expanded"){
  return result.directions.map(d=>{const i=pool.findIndex(c=>c.template.id===d.templateId&&c.template.versionId===d.templateVersionId);return{familyId:i>=0?pool[i].template.familyId:undefined,rank:i>=0?i+1:undefined,source};});
}
function selectedStyle(result:GenerationResult,catalog:TemplateMeta[]):RecentStyleFingerprint|undefined{
  const d=result.directions[0];if(!d?.templateId)return undefined;const t=catalog.find(x=>x.id===d.templateId&&x.versionId===d.templateVersionId);if(!t)return undefined;return{familyId:t.familyId,templateId:t.id,visualDirection:t.visualDirection,accentMode:d.accentMode,createdAt:new Date().toISOString()};
}

async function runOne(g:GoldenBrief,repeat:number,recentStyles:RecentStyleFingerprint[],provider:ReturnType<typeof createAIProviderFromEnv>,catalog:TemplateMeta[],runId:string,sourceCommit:string,hash:string,appEnv:AppEnvironment,experimentId?:string):Promise<RunRecord>{
  const started=Date.now(),telemetry:RunRecord["telemetry"]=[];let expanded=false,criticUsed=false;const brief=toGenerationBrief(g);let currentPool:ReturnType<typeof buildCreativeCandidatePack>["all"]=[];let source:"initial"|"expanded"="initial";
  const base={benchmarkRunId:runId,experimentId,appEnv,sourceCommit,configHash:hash,goldenSetVersion:g.goldenSetVersion,provider:provider.providerName,model:provider.modelName,briefId:g.id,repeat,locale:g.locale,market:g.market,hasPhoto:g.hasPhoto,photoFixture:g.photoProfile?.fixture,repeatIdentity:g.repeatIdentity,sequenceIndex:g.sequenceIndex};
  try{
    const rankInput={market:brief.market,locale:brief.locale,format:brief.format,feeling:brief.feeling,occasion:brief.occasion,hasPhoto:brief.hasPhoto,bodyPressure:pressure(g.textPressure),recentStyles};
    const pack=buildCreativeCandidatePack(catalog,rankInput);currentPool=pack.all;if(currentPool.length<3)throw new Error("benchmark_template_candidates_insufficient");
    let outcome:CreativeDirectorOutcome=await generateCreativeDirectorDirections(provider,brief,currentPool,recentStyles,"creative_director");telemetry.push({...outcome.telemetry,estimatedCostUsd:cost(outcome.telemetry)});
    if(outcome.kind==="expand_pool"){
      expanded=true;source="expanded";const priorCritique={reasonCode:outcome.reasonCode,desiredTraits:outcome.desiredTraits};currentPool=expandedCreativeCandidatePool(catalog,rankInput,16);if(currentPool.length<3)throw new Error("benchmark_template_candidates_insufficient");
      outcome=await generateCreativeDirectorDirections(provider,brief,currentPool,recentStyles,"expanded_director",priorCritique);telemetry.push({...outcome.telemetry,estimatedCostUsd:cost(outcome.telemetry)});if(outcome.kind!=="ready")throw new Error("ai_creative_range_insufficient");
    }
    if(outcome.kind!=="ready")throw new Error("ai_creative_range_insufficient");let result=outcome.result;
    const risks=creativeQualityRisks(result,brief,recentStyles);const criticTriggers=new Set(["creative_range","copy_risk","low_confidence","low_wow","market_tension","low_novelty"]);const premiumCritical=new Set(["creative_range","copy_risk","low_confidence","low_wow"]);
    if(risks.includes("creative_range")&&currentPool.length<12){currentPool=expandedCreativeCandidatePool(catalog,rankInput,16);source="expanded";}
    if(risks.some(r=>criticTriggers.has(r))){criticUsed=true;const repaired=await criticRepairDirections(provider,brief,result,currentPool,risks);result=repaired.result;telemetry.push({...repaired.telemetry,estimatedCostUsd:cost(repaired.telemetry)});const remaining=creativeQualityRisks(result,brief,recentStyles);if(remaining.some(r=>premiumCritical.has(r)))throw new Error("ai_premium_quality_not_met");}
    return{...base,status:"success",expanded,criticUsed,fallbackRequired:false,totalLatencyMs:Date.now()-started,telemetry,result,directionMeta:directionMeta(result,currentPool,source)};
  }catch(error){return{...base,status:"failed",expanded,criticUsed,fallbackRequired:true,errorCode:error instanceof Error?error.message:"benchmark_generation_failed",totalLatencyMs:Date.now()-started,telemetry};}
}


function requiredPositiveEnv(name:string){const n=Number(process.env[name]);if(!Number.isFinite(n)||n<=0)throw new Error(`${name}_required_positive`);return n;}
function budgetContext(appEnv:AppEnvironment,totalGenerations:number){
  if(appEnv!=="experiment"&&appEnv!=="staging")return undefined;
  const experimentId=(process.env.EXPERIMENT_ID||process.env.BENCHMARK_BUDGET_ID||"").trim();
  if(!experimentId)throw new Error("benchmark_budget_attribution_id_required");
  const maxGenerations=requiredPositiveEnv("AI_EXPERIMENT_MAX_GENERATIONS_PER_RUN");
  const maxCalls=requiredPositiveEnv("AI_EXPERIMENT_MAX_CALLS_PER_RUN");
  const dailyCostUsd=requiredPositiveEnv("AI_EXPERIMENT_DAILY_COST_USD");
  if(totalGenerations>maxGenerations)throw new Error("benchmark_generation_budget_exceeded");
  // One director + one bounded expansion + one critic is the Step 13 worst case.
  if(totalGenerations*3>maxCalls)throw new Error("benchmark_worst_case_call_budget_exceeded");
  const safeId=experimentId.replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,80);
  const ledger=path.join(root,"experiments",`${safeId}.budget-ledger.jsonl`);
  const day=new Date().toISOString().slice(0,10);
  let spent=0;if(fs.existsSync(ledger)){for(const line of fs.readFileSync(ledger,"utf8").split(/\r?\n/)){if(!line.trim())continue;try{const row=JSON.parse(line);if(row.day===day)spent+=Number(row.costUsd)||0;}catch{}}}
  if(spent>=dailyCostUsd)throw new Error("benchmark_daily_cost_budget_exhausted");
  return{experimentId,ledger,day,dailyCostUsd,spent};
}
function recordBudget(ctx:ReturnType<typeof budgetContext>,record:RunRecord){if(!ctx)return;const costUsd=record.telemetry.reduce((sum,t)=>sum+(t.estimatedCostUsd??0),0);ctx.spent+=costUsd;fs.appendFileSync(ctx.ledger,JSON.stringify({at:new Date().toISOString(),day:ctx.day,experimentId:ctx.experimentId,benchmarkRunId:record.benchmarkRunId,briefId:record.briefId,repeat:record.repeat,calls:record.telemetry.length,costUsd})+"\n");if(ctx.spent>ctx.dailyCostUsd)throw new Error("benchmark_daily_cost_budget_exceeded_after_generation");}

async function main(){
  const goldenFile=path.resolve(arg("--golden",path.join(root,"benchmarks/premium/golden-set-v1.json"))!);const doc=JSON.parse(fs.readFileSync(goldenFile,"utf8")) as GoldenDoc;
  const appEnv=assertEnvironmentIsolation(process.env);
  const repeat=intArg("--repeat",3),limit=Math.min(doc.briefs.length,intArg("--limit",doc.briefs.length));const offset=Math.max(0,Number(arg("--offset","0"))||0);const selected=doc.briefs.slice(offset,offset+limit);
  if(!selected.length)throw new Error("benchmark_no_briefs_selected");
  if(flag("--require-real-model")&&(process.env.AI_PROVIDER||"mock").toLowerCase()==="mock")throw new Error("benchmark_real_model_required");
  const catalogFile=arg("--catalog-json");const catalog:TemplateMeta[]=catalogFile?JSON.parse(fs.readFileSync(path.resolve(catalogFile),"utf8")):portfolioV2AllTemplates;
  if(!Array.isArray(catalog)||catalog.length<3)throw new Error("benchmark_catalog_invalid");
  const provider=createAIProviderFromEnv();const runId=arg("--run-id",`premium-${new Date().toISOString().replace(/[:.]/g,"-")}-${randomUUID().slice(0,8)}`)!;const sourceCommit=process.env.BENCHMARK_SOURCE_COMMIT||process.env.GIT_COMMIT||"archive-0.4.3-step14";const hash=configHash(provider.modelName);
  const outFile=path.resolve(arg("--out",path.join(root,"benchmark-results",`${runId}.jsonl`))!);fs.mkdirSync(path.dirname(outFile),{recursive:true});
  const budget=budgetContext(appEnv,selected.length*repeat);
  const memory=new Map<string,RecentStyleFingerprint[]>();let completed=0;
  for(const g of selected){for(let r=1;r<=repeat;r++){
    const history=g.repeatIdentity?memory.get(g.repeatIdentity)||[]:[];const record=await runOne(g,r,history,provider,catalog,runId,sourceCommit,hash,appEnv,budget?.experimentId);fs.appendFileSync(outFile,JSON.stringify(record)+"\n");recordBudget(budget,record);completed++;
    if(record.status==="success"&&g.repeatIdentity&&record.result){const s=selectedStyle(record.result,catalog);if(s)memory.set(g.repeatIdentity,[s,...history].slice(0,5));}
    console.log(JSON.stringify({event:"benchmark_progress",completed,total:selected.length*repeat,briefId:g.id,repeat:r,status:record.status,expanded:record.expanded,critic:record.criticUsed,fallback:record.fallbackRequired}));
  }}
  console.log(JSON.stringify({event:"benchmark_complete",runId,outFile,records:completed,provider:provider.providerName,model:provider.modelName,configHash:hash}));
}

await main();
