import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
const golden=JSON.parse(read("benchmarks/premium/golden-set-v1.json"));
const runner=read("scripts/premium-benchmark-runner.ts");
const lab=read("scripts/premium-benchmark-lab.mjs");
const ai=read("packages/ai/src/index.ts");
const worker=read("apps/worker/src/index.ts");
const templates=read("packages/templates/src/index.ts");
const studio=read("apps/web/components/card-studio.tsx");

need(golden.briefs.length>=120,"golden_set_lt_120");
for(const locale of ["en","vi","ja","ko","zh-CN","es","fr","de","pt-BR","it"])need(golden.briefs.some(b=>b.locale===locale),`golden_locale_missing_${locale}`);
for(const kind of ["synthetic-excellent-portrait","synthetic-busy-photo","synthetic-dark-photo","synthetic-imperfect-usable"])need(golden.briefs.some(b=>b.photoProfile?.fixture===kind),`photo_fixture_missing_${kind}`);
need(golden.briefs.every(b=>b.referenceSafety==="synthetic-no-customer-data"),"golden_set_reference_safety_missing");
need(new Set(golden.briefs.filter(b=>b.repeatIdentity).map(b=>b.repeatIdentity)).size>=10,"repeat_customer_sequences_missing");

need(runner.includes("generateCreativeDirectorDirections")&&runner.includes("buildCreativeCandidatePack"),"benchmark_not_exercising_step13_director");
need(runner.includes("expandedCreativeCandidatePool")&&runner.includes('outcome.kind==="expand_pool"'),"benchmark_expansion_measurement_missing");
need(runner.includes("criticRepairDirections")&&runner.includes("criticUsed"),"benchmark_critic_measurement_missing");
need(runner.includes("fallbackRequired")&&runner.includes("totalLatencyMs")&&runner.includes("telemetry"),"runner_measurement_contract_missing");
need(runner.includes("estimatedCostUsd")&&runner.includes("configHash")&&runner.includes("sourceCommit"),"benchmark_economics_or_repro_metadata_missing");
need(runner.includes("repeatIdentity")&&runner.includes("RecentStyleFingerprint"),"repeat_user_memory_simulation_missing");

for(const metric of ["personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10"])need(lab.includes(metric),`human_rubric_missing_${metric}`);
need(lab.includes("topFamilyShare")&&lab.includes("top3FamilyShare")&&lab.includes("visualDirections")&&lab.includes("accents"),"creative_concentration_metrics_missing");
need(lab.includes("p50LatencyMs")&&lab.includes("p95LatencyMs")&&lab.includes("estimatedCostPerGenerationUsd"),"model_economics_summary_missing");
need(lab.includes('recommendation="REVIEW_REQUIRED"'),"human_authority_gate_missing");

// Mandatory Creative Director challenge evidence remains present in the actual Step 13 core.
need(ai.includes("ranking scores are priors, not commands")||ai.includes("ranking scores are priors, not commands".replace("ranking","Ranking")),"challenge_lower_rank_override_missing");
need(worker.includes('outcome.kind==="expand_pool"')&&worker.includes("expandedCreativeCandidatePool")&&worker.includes("priorCritique"),"challenge_bounded_expansion_missing");
need(worker.includes('if(outcome.kind!=="ready")throw new Error("ai_creative_range_insufficient")'),"challenge_second_expansion_not_bounded");
need(ai.includes('allowTemplateSwap=risks.includes("creative_range")'),"challenge_copy_only_template_lock_missing");
need(ai.includes("ai_critic_candidate_missing")&&ai.includes("candidate=candidates.find"),"challenge_critic_supplied_candidate_guard_missing");
need(worker.includes("ai_premium_quality_not_met")&&studio.includes("setUsedCuratedFallback(true)"),"challenge_persistent_risk_fallback_missing");
need(ai.includes("if(accentMode===\"photo\"&&(!brief.hasPhoto||candidate.template.photoMode===\"none\"))accentMode=\"original\"")&&templates.includes("photoFit"),"challenge_photo_control_missing");
need(ai.includes("explicit user intent wins"),"challenge_user_preference_authority_missing");
need(templates.includes("noveltyPenalty")&&templates.includes("recentStyles")&&ai.includes("compactRecentStyles"),"challenge_recent_style_soft_memory_missing");

console.log(JSON.stringify({ok:true,briefs:golden.briefs.length,locales:new Set(golden.briefs.map(b=>b.locale)).size,checks:"step14 premium benchmark source contract + step13 challenge evidence"}));
