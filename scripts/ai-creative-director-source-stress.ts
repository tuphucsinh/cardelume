import {readFileSync} from "node:fs";
import {validateThreeDirectionDiversity, criticRepairDirections, MockAIProvider, generateCreativeDirectorDirections, OpenAICompatibleProvider} from "../packages/ai/src/index.ts";
import type {AIProvider,AIProviderResponse} from "../packages/ai/src/index.ts";
import {buildCreativeCandidatePack, portfolioV2AllTemplates, templateArchetype, templateCreativeRecipe} from "../packages/templates/src/index.ts";
function read(p:string){return readFileSync(p,"utf8")}function need(v:unknown,m:string):asserts v{if(!v)throw new Error(m)}
const templates=read("packages/templates/src/index.ts");
const ai=read("packages/ai/src/index.ts");
const worker=read("apps/worker/src/index.ts");
const migration=read("packages/db/migrations/0009_ai_creative_director.sql");
const dbTemplates=read("packages/db/src/templates.ts");
const dbGeneration=read("packages/db/src/generation.ts");
const cardSchema=read("packages/card-schema/src/index.ts");
const checkoutCard=read("apps/web/lib/checkout-card.server.ts");
const studio=read("apps/web/components/card-studio.tsx");
const spec=read("docs/AI_CREATIVE_DIRECTOR_0.4.3_STEP13.md");

need(spec.includes("Rules protect quality; AI directs creativity"),"creative_authority_missing");
need(spec.includes("No soft ranking score is a final creative decision"),"soft_rank_authority_wrong");
need(templates.includes("buildCreativeCandidatePack"),"creative_pack_missing");
need(templates.includes("Math.min(6,ranked.length)"),"fit_six_missing");
need(templates.includes("Math.min(2,wildcardRanked.length)"),"wildcard_two_missing");
need(templates.includes("recentStylePenalty")&&templates.includes("noveltyPenalty*.16"),"novelty_soft_prior_missing");
need(templates.includes("editorialScore>=84"),"wildcard_quality_floor_missing");
need(ai.includes('o.action==="expand_pool"'),"ai_pool_expansion_missing");
need(ai.includes("ai_template_not_in_candidate_pool"),"ai_candidate_invention_guard_missing");
need(ai.includes("ai_template_family_duplicate"),"ai_family_diversity_guard_missing");
need(ai.includes("creativeThesis")&&ai.includes("signatureMove")&&ai.includes("wowScore"),"premium_creative_contract_missing");
need(ai.includes("assertPromptBudget(prompt)"),"prompt_budget_guard_missing");
need(ai.includes("criticRepairDirections")&&ai.includes("creativeQualityRisks"),"conditional_critic_missing");

need(templates.includes("fitTarget=Math.max(3,Math.floor(limit*.75))"),"expanded_fit_exploration_ratio_missing");
need(ai.includes("priorCritique")&&worker.includes("priorCritique={reasonCode:outcome.reasonCode"),"ai_critique_not_carried_into_expansion");
need(ai.includes("allowTemplateSwap=risks.includes(\"creative_range\")"),"creative_range_reconsideration_missing");
need(ai.includes("ai_critic_family_duplicate")&&ai.includes("ai_critic_template_duplicate"),"critic_swap_identity_guard_missing");
need(worker.includes("premiumCritical")&&worker.includes("ai_premium_quality_not_met"),"post_critic_premium_fail_closed_missing");
need(ai.includes("AI_WOW_REPAIR_THRESHOLD")&&ai.includes("AI_CONFIDENCE_REPAIR_THRESHOLD"),"premium_thresholds_missing");
need(worker.indexOf("const pack=buildCreativeCandidatePack")<worker.indexOf("outcome=await generateCreativeDirectorDirections"),"ai_runs_before_shortlist");
need(worker.includes("listRecentStyleFingerprints"),"recent_style_not_wired");
need(worker.includes("expandedCreativeCandidatePool")&&worker.includes('outcome.kind==="expand_pool"'),"worker_expansion_missing");
need(worker.includes("criticTriggers")&&worker.includes("criticRepairDirections"),"worker_critic_missing");
need(worker.includes("recordGenerationAIUsage"),"ai_usage_ledger_not_wired");
for(const table of ["style_fingerprints","generation_ai_usage"])need(migration.includes(`create table if not exists ${table}`),`migration_missing_${table}`);
need(!migration.includes("recipient")&&!migration.includes("headline")&&!migration.includes("body text")&&!migration.includes("photo_asset"),"style_memory_contains_content_field");
need(dbTemplates.includes("recordStyleFingerprint")&&dbTemplates.includes("listRecentStyleFingerprints"),"style_memory_db_missing");
need(dbGeneration.includes("recordGenerationAIUsage"),"ai_usage_db_missing");
need(cardSchema.includes("creativeThesis")&&cardSchema.includes("signatureMove")&&cardSchema.includes("photoProfile"),"generation_schema_not_step13");
need(!checkoutCard.includes("photo_accent_requires_photo_direction"),"legacy_photo_slot_hard_rule_present");
need(checkoutCard.includes('input.managedTemplate?.photoMode==="required"'),"template_photo_hard_constraint_missing");
need(studio.includes('photoAssetId:(selected.photoMode==="required"'),"studio_photo_still_slot_bound");
need(studio.includes("suggestedAccentMode"),"ai_accent_not_used");

// P20M1T05 Three-direction diversity source invariants
need(ai.includes("validateThreeDirectionDiversity"),"validate_three_direction_diversity_missing");
need(ai.includes("uniqueFamilyIds: 3")&&ai.includes("uniqueVisualDirections: 3")&&ai.includes("minDistinctArchetypes: 2"),"diversity_contract_shape_missing");
need(ai.includes("ai_visual_direction_duplicate"),"visual_direction_diversity_guard_missing");
need(ai.includes("ai_direction_diversity_insufficient"),"archetype_diversity_guard_missing");
need(ai.includes("validateThreeDirectionDiversity(resolvedTargets)"),"diversity_guard_not_wired_in_selection");
need(ai.includes("validateThreeDirectionDiversity(resolvedInitial)"),"diversity_guard_not_wired_before_critic_early_return");
need(ai.includes("validateThreeDirectionDiversity(resolvedRepairs)"),"diversity_guard_not_wired_in_critic");

const criticFnSource=ai.slice(ai.indexOf("export async function criticRepairDirections"));
const initialGuardPos=criticFnSource.indexOf("validateThreeDirectionDiversity(resolvedInitial)");
const earlyReturnPos=criticFnSource.indexOf("if(!riskyIds.size)return");
need(initialGuardPos!==-1&&earlyReturnPos!==-1&&initialGuardPos<earlyReturnPos,"critic_diversity_guard_must_precede_early_return");

// P20M1T05 Adversarial contract execution
// 1. Same-family A/B/C rejects
let sameFamilyRejected=false;
try{
  validateThreeDirectionDiversity([
    {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-same-1",visualDirection:"editorial",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-same-1",visualDirection:"midnight",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-unique-3",visualDirection:"photo",photoMode:"required"}
  ]);
}catch(err){
  sameFamilyRejected=true;
  need((err as Error).message==="ai_template_family_duplicate","same_family_error_mismatch");
}
need(sameFamilyRejected,"same_family_abc_did_not_reject");

// 2. Three distinct IDs with duplicate visualDirection rejects
let duplicateVisualRejected=false;
try{
  validateThreeDirectionDiversity([
    {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"editorial",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"midnight",photoMode:"none"}
  ]);
}catch(err){
  duplicateVisualRejected=true;
  need((err as Error).message==="ai_visual_direction_duplicate","duplicate_visual_error_mismatch");
}
need(duplicateVisualRejected,"duplicate_visual_direction_did_not_reject");

// 3. Three unique family + visual directions but only one effective archetype rejects
let singleArchetypeRejected=false;
try{
  // botanical, washi, and seoul all resolve to archetype "editorial"
  validateThreeDirectionDiversity([
    {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"botanical",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"washi",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"seoul",photoMode:"none"}
  ]);
}catch(err){
  singleArchetypeRejected=true;
  need((err as Error).message==="ai_direction_diversity_insufficient","single_archetype_error_mismatch");
}
need(singleArchetypeRejected,"single_effective_archetype_did_not_reject");

// 4. Valid photo/editorial/midnight mix passes
const validPhotoResult=validateThreeDirectionDiversity([
  {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none"},
  {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"midnight",photoMode:"none"},
  {templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"photo",photoMode:"required"}
]);
need(validPhotoResult.ok===true,"valid_photo_result_not_ok");
need(validPhotoResult.uniqueFamilyIds===3,"valid_photo_families_not_3");
need(validPhotoResult.uniqueVisualDirections===3,"valid_photo_visuals_not_3");
need(validPhotoResult.minDistinctArchetypes===2,"valid_photo_min_archetypes_not_2");
need(validPhotoResult.distinctArchetypeCount===3,"valid_photo_archetype_count_mismatch");

// 5. Valid quiet/editorial/midnight mix passes
const validQuietResult=validateThreeDirectionDiversity([
  {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none"},
  {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"midnight",photoMode:"none"},
  {templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"minimal",photoMode:"none"}
]);
need(validQuietResult.ok===true,"valid_quiet_result_not_ok");
need(validQuietResult.distinctArchetypeCount===3,"valid_quiet_archetype_count_mismatch");

// 6. Invalid direction count rejects
let countRejected=false;
try{
  validateThreeDirectionDiversity([
    {templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none"},
    {templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"midnight",photoMode:"none"}
  ]);
}catch(err){
  countRejected=true;
  need((err as Error).message==="ai_direction_count_invalid","direction_count_error_mismatch");
}
need(countRejected,"direction_count_not_three_did_not_reject");

// Helper: build a typed fake AIProvider that returns deterministic data
function makeFakeProvider(data:unknown,providerName="fake",modelName="fake-model"):AIProvider{
  return {
    providerName,
    modelName,
    async generateJson(_input:{system:string;prompt:string;timeoutMs?:number}):Promise<AIProviderResponse>{
      return{data,provider:providerName,model:modelName,usage:{inputTokens:10,outputTokens:10},latencyMs:1};
    },
  };
}

async function main(){
  // 7. Critic repair rejects duplicate visualDirection even when risks=[] and early-return would occur
  let criticDuplicateVisualRejected=false;
  try{
    const mockCandidates: any[] = [
      {template:{id:"10000000-0000-4000-8000-000000000001",versionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none",name:"T1"}},
      {template:{id:"10000000-0000-4000-8000-000000000002",versionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"editorial",photoMode:"none",name:"T2"}},
      {template:{id:"10000000-0000-4000-8000-000000000003",versionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"midnight",photoMode:"none",name:"T3"}},
    ];
    const duplicateVisualResult: any = {
      directions: [
        {id:"editorial",templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",headline:"Headline 1",body:"Body 1",kicker:"Kicker 1",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]},
        {id:"midnight",templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",headline:"Headline 2",body:"Body 2",kicker:"Kicker 2",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]},
        {id:"quiet",templateId:"10000000-0000-4000-8000-000000000003",templateVersionId:"30000000-0000-4000-8000-000000000003",headline:"Headline 3",body:"Body 3",kicker:"Kicker 3",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]}
      ]
    };
    await criticRepairDirections(new MockAIProvider(), {locale:"en-US",format:"standard_greeting",hasPhoto:false} as any, duplicateVisualResult, mockCandidates, []);
  }catch(err){
    criticDuplicateVisualRejected=true;
    need((err as Error).message==="ai_visual_direction_duplicate","critic_duplicate_visual_error_mismatch");
  }
  need(criticDuplicateVisualRejected,"critic_duplicate_visual_did_not_reject_on_empty_risks");

  // 8. Critic repair fails closed on missing candidate identity before early return
  let criticMissingCandidateRejected=false;
  try{
    const mockCandidates: any[] = [
      {template:{id:"10000000-0000-4000-8000-000000000001",versionId:"30000000-0000-4000-8000-000000000001",familyId:"fam-1",visualDirection:"editorial",photoMode:"none",name:"T1"}},
      {template:{id:"10000000-0000-4000-8000-000000000002",versionId:"30000000-0000-4000-8000-000000000002",familyId:"fam-2",visualDirection:"midnight",photoMode:"none",name:"T2"}},
      {template:{id:"10000000-0000-4000-8000-000000000003",versionId:"30000000-0000-4000-8000-000000000003",familyId:"fam-3",visualDirection:"photo",photoMode:"required",name:"T3"}},
    ];
    const missingCandidateResult: any = {
      directions: [
        {id:"editorial",templateId:"10000000-0000-4000-8000-000000000001",templateVersionId:"30000000-0000-4000-8000-000000000001",headline:"Headline 1",body:"Body 1",kicker:"Kicker 1",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]},
        {id:"midnight",templateId:"10000000-0000-4000-8000-000000000002",templateVersionId:"30000000-0000-4000-8000-000000000002",headline:"Headline 2",body:"Body 2",kicker:"Kicker 2",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]},
        {id:"photo",templateId:"10000000-0000-4000-8000-000000000099",templateVersionId:"30000000-0000-4000-8000-000000000099",headline:"Headline 3",body:"Body 3",kicker:"Kicker 3",confidence:0.95,wowScore:0.95,noveltyScore:0.95,riskCodes:[]}
      ]
    };
    await criticRepairDirections(new MockAIProvider(), {locale:"en-US",format:"standard_greeting",hasPhoto:true} as any, missingCandidateResult, mockCandidates, []);
  }catch(err){
    criticMissingCandidateRejected=true;
    need((err as Error).message==="ai_critic_candidate_missing","critic_missing_candidate_error_mismatch");
  }
  need(criticMissingCandidateRejected,"critic_missing_candidate_did_not_reject");

  // ── RUNTIME CONTRACT SECTION ────────────────────────────────────────────────
  // Production imports are top-level — no duplicate dynamic imports here.

  // Non-photo brief: expected slots are editorial / midnight / quiet
  const validBrief={
    locale:"en-US" as const,
    format:"portrait-5x7" as const,
    hasPhoto:false as const,
    market:"US",
    feeling:"Elegant",
    occasion:"Birthday",
    relationship:"Friend",
    recipient:"Alex",
    detail:"",
  };
  const pack=buildCreativeCandidatePack(portfolioV2AllTemplates,validBrief);
  need(pack.all.length>=3,"pack_too_small");

  // Pick one candidate per required effective archetype from pack.all
  function pickByArchetype(candidates:typeof pack.all,arch:string){
    const found=candidates.find(c=>templateArchetype(c.template)===arch);
    if(!found)throw new Error(`no_candidate_for_archetype_${arch}`);
    return found;
  }
  const cEd=pickByArchetype(pack.all,"editorial");
  const cMid=pickByArchetype(pack.all,"midnight");
  const cQui=pickByArchetype(pack.all,"quiet");
  need(
    cEd.template.id!==cMid.template.id&&cMid.template.id!==cQui.template.id,
    "archetype_candidates_not_distinct"
  );

  // Build a valid select direction for a given slot + candidate.
  // creativeThesis must be ≥24 chars; signatureMove + accentMode must be in recipe.
  // Derive from templateCreativeRecipe so values are always valid for the candidate.
  function validDirection(slot:string, c:typeof cEd){
    const recipe=templateCreativeRecipe(c.template);
    const signatureMove=recipe.signatureMoves[0]??"recipient_anchor" as const;
    const accentMode=recipe.preferredAccents[0]??"original" as const;
    return {
      id:slot,
      templateId:c.template.id,
      templateVersionId:c.template.versionId,
      creativeThesis:"A refined expression crafted with precision for this exact moment in time.",
      customerRationale:"A quiet, considered fit for this day.",
      signatureMove,
      accentMode,
      kicker:"FOR THIS MOMENT",
      headline:"Something beautiful, just for you.",
      body:"May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be.",
      confidence:0.92,
      noveltyScore:0.84,
      wowScore:0.86,
      riskCodes:[] as string[],
    };
  }

  const validPayload={
    action:"select" as const,
    directions:[
      validDirection("editorial",cEd),
      validDirection("midnight",cMid),
      validDirection("quiet",cQui),
    ],
  };

  // ── 9. VALID_RESPONSE — happy path ────────────────────────────────────────
  const validOutcome=await generateCreativeDirectorDirections(
    makeFakeProvider(validPayload),validBrief,pack.all
  );
  need(validOutcome.kind==="ready","valid_response_not_ready");
  need(validOutcome.result.directions.length===3,"valid_response_not_three_directions");
  console.log("VALID_RESPONSE=PASS");

  // ── 10. MALFORMED_RESPONSE — null payload rejects ─────────────────────────
  let malformedRejected=false;
  try{
    await generateCreativeDirectorDirections(makeFakeProvider(null),validBrief,pack.all);
  }catch(err){
    malformedRejected=true;
    need(
      (err as Error).message==="ai_creative_invalid_response",
      `malformed_response_wrong_error: ${(err as Error).message}`
    );
  }
  need(malformedRejected,"malformed_response_did_not_reject");
  console.log("MALFORMED_RESPONSE=REJECTED");

  // ── 11. INVALID_DIRECTION_COUNT — 2 directions rejects ───────────────────
  let countTwoRejected=false;
  try{
    const twoDir={action:"select" as const,directions:validPayload.directions.slice(0,2)};
    await generateCreativeDirectorDirections(makeFakeProvider(twoDir),validBrief,pack.all);
  }catch(err){
    countTwoRejected=true;
    need(
      (err as Error).message==="ai_direction_count_invalid",
      `count_two_wrong_error: ${(err as Error).message}`
    );
  }
  need(countTwoRejected,"direction_count_2_did_not_reject");
  console.log("INVALID_DIRECTION_COUNT=REJECTED");

  // ── 12. INVALID_TEMPLATE_IDENTITY — unknown templateId rejects ────────────
  let unknownTemplateRejected=false;
  try{
    const badDirs=validPayload.directions.map((d,i)=>
      i===0
        ?{...d,templateId:"99999999-0000-4000-8000-000000000099",templateVersionId:"99999999-0000-4000-8000-000000000099"}
        :d
    );
    await generateCreativeDirectorDirections(
      makeFakeProvider({action:"select" as const,directions:badDirs}),validBrief,pack.all
    );
  }catch(err){
    unknownTemplateRejected=true;
    need(
      (err as Error).message==="ai_template_not_in_candidate_pool",
      `unknown_template_wrong_error: ${(err as Error).message}`
    );
  }
  need(unknownTemplateRejected,"unknown_template_did_not_reject");
  console.log("INVALID_TEMPLATE_IDENTITY=REJECTED");

  // ── 13. Wrong slot id rejects with ai_direction_set_invalid ───────────────
  // Replace "editorial" id with "photo" — parser expects editorial/midnight/quiet for hasPhoto=false
  let wrongSlotRejected=false;
  try{
    const badSlotDirs=validPayload.directions.map((d,i)=>i===0?{...d,id:"photo"}:d);
    await generateCreativeDirectorDirections(
      makeFakeProvider({action:"select" as const,directions:badSlotDirs}),validBrief,pack.all
    );
  }catch(err){
    wrongSlotRejected=true;
    need(
      (err as Error).message==="ai_direction_set_invalid",
      `wrong_slot_wrong_error: ${(err as Error).message}`
    );
  }
  need(wrongSlotRejected,"wrong_slot_id_did_not_reject");

  // ── 14. OpenAICompatibleProvider fetchImpl seam ───────────────────────────
  // All fixtures are synthetic local Response objects — no network calls.
  const fakeConfig={apiKey:"test-key",model:"fake-model",baseUrl:"http://localhost:19999"};

  function makeEnvelope(innerJson:string){
    return JSON.stringify({
      choices:[{message:{content:innerJson}}],
      usage:{prompt_tokens:10,completion_tokens:10},
      model:"fake-model",
    });
  }

  // 14a. Valid JSON envelope accepted
  const validInnerJson=JSON.stringify(validPayload);
  const validEnvBody=makeEnvelope(validInnerJson);
  const fetchValid:typeof fetch=async(_url,_init)=>new Response(validEnvBody,{status:200,headers:{"content-type":"application/json"}});
  const providerValid=new OpenAICompatibleProvider(fakeConfig,fetchValid);
  const envResult=await providerValid.generateJson({system:"s",prompt:"p"});
  need(envResult.data!==null&&typeof envResult.data==="object","valid_envelope_data_not_object");
  need((envResult.data as Record<string,unknown>).action==="select","valid_envelope_action_not_select");

  // 14b. Malformed outer JSON rejected
  let outerJsonRejected=false;
  try{
    const fetchBadOuter:typeof fetch=async(_url,_init)=>new Response("NOT_JSON",{status:200,headers:{"content-type":"application/json"}});
    await new OpenAICompatibleProvider(fakeConfig,fetchBadOuter).generateJson({system:"s",prompt:"p"});
  }catch(err){
    outerJsonRejected=true;
    need(
      (err as Error).message==="ai_provider_invalid_response",
      `outer_json_wrong_error: ${(err as Error).message}`
    );
  }
  need(outerJsonRejected,"outer_json_did_not_reject");

  // 14c. Invalid inner message JSON rejected
  let innerJsonRejected=false;
  try{
    const badInnerEnv=makeEnvelope("NOT_VALID_JSON");
    const fetchBadInner:typeof fetch=async(_url,_init)=>new Response(badInnerEnv,{status:200,headers:{"content-type":"application/json"}});
    await new OpenAICompatibleProvider(fakeConfig,fetchBadInner).generateJson({system:"s",prompt:"p"});
  }catch(err){
    innerJsonRejected=true;
    need(
      (err as Error).message==="ai_provider_invalid_json",
      `inner_json_wrong_error: ${(err as Error).message}`
    );
  }
  need(innerJsonRejected,"inner_json_did_not_reject");

  // 14d. Oversized declared content-length rejected
  let oversizedRejected=false;
  try{
    const fetchOversized:typeof fetch=async(_url,_init)=>new Response(validEnvBody,{status:200,headers:{"content-type":"application/json","content-length":"999999999"}});
    await new OpenAICompatibleProvider(fakeConfig,fetchOversized).generateJson({system:"s",prompt:"p"});
  }catch(err){
    oversizedRejected=true;
    need(
      (err as Error).message==="ai_provider_response_too_large",
      `oversized_wrong_error: ${(err as Error).message}`
    );
  }
  need(oversizedRejected,"oversized_response_did_not_reject");

  // 14e. AbortError timeout maps to ai_provider_timeout
  // fetchImpl returns a pending Promise that rejects when the provider's AbortController fires.
  let timeoutRejected=false;
  try{
    const fetchTimeout:typeof fetch=(_url,init)=>new Promise<Response>((_res,rej)=>{
      const sig=init?.signal;
      if(sig?.aborted){rej(new DOMException("The operation was aborted.","AbortError"));return;}
      sig?.addEventListener("abort",()=>rej(new DOMException("The operation was aborted.","AbortError")),{once:true});
    });
    await new OpenAICompatibleProvider(fakeConfig,fetchTimeout).generateJson({system:"s",prompt:"p",timeoutMs:10});
  }catch(err){
    timeoutRejected=true;
    need(
      (err as Error).message==="ai_provider_timeout",
      `timeout_wrong_error: ${(err as Error).message}`
    );
  }
  need(timeoutRejected,"abort_error_did_not_map_to_timeout");
  console.log("TIMEOUT_OR_PROVIDER_FAILURE=HANDLED");

  // 14f. HTTP 503 maps to ai_provider_http_503
  let http503Rejected=false;
  try{
    const fetch503:typeof fetch=async(_url,_init)=>new Response("Service Unavailable",{status:503});
    await new OpenAICompatibleProvider(fakeConfig,fetch503).generateJson({system:"s",prompt:"p"});
  }catch(err){
    http503Rejected=true;
    need(
      (err as Error).message==="ai_provider_http_503",
      `http503_wrong_error: ${(err as Error).message}`
    );
  }
  need(http503Rejected,"http_503_did_not_reject");
  console.log("AI_PROVIDER_CONTRACT=PASS");

  console.log(JSON.stringify({status:"PASS",step13:{candidatePack:"6+2",aiFinalCreativeDecision:true,expansion:true,conditionalCritic:true,creativeReconsideration:true,postCriticFailClosed:true,styleMemoryContentFree:true,aiUsageLedger:true,photoCreativeDecision:true},p20m1t05:{threeDirectionDiversityContract:true,adversarialGuardsPassed:true},p21r3t01:{runtimeContractAssertions:true,fakeProviderHappyPath:true,parserFailures:true,openAIProviderSeam:true}},null,2));
}

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});
