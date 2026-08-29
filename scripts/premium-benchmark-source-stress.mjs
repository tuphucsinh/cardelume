import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
const golden=JSON.parse(read("benchmarks/premium/golden-set-v1.json"));
const refManifest=JSON.parse(read(".ai/evidence/premium-reference-stimuli.json"));
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

// Protocol freeze, validation and reference stimuli provenance contracts.
need(lab.includes('import crypto from "node:crypto"')||lab.includes("node:crypto"),"lab_crypto_import_missing");
need(lab.includes("function deriveStratifiedSubset")&&lab.includes("function freezeProtocol")&&lab.includes("function validateFrozenPremiumProtocol"),"lab_protocol_freeze_functions_missing");
need(lab.includes("deriveStratifiedSubset,")&&lab.includes("freezeProtocol,")&&lab.includes("validateFrozenPremiumProtocol,"),"lab_protocol_freeze_exports_missing");
need(lab.includes("function canonicalProtocolPayload")&&lab.includes("function hashProtocolPayload")&&["goldenSetVersion","goldenSetSha256","goldenSetBriefCount","rubricVersion","scoreDimensions","criticalDefectFlags","subsetBriefIds","subsetStratification","raterRosterStatus","raterRosterHash","conflictPolicyStatus","conflictPolicyHash","referenceStimuliManifest","referenceStimuliManifestSha256","sealedOutputLocation","status","governance","note"].every(f=>lab.includes(`${f}:p.${f}`)),"protocol_canonical_payload_contract_missing");
need(["humanReviewRequired:true","minimumIndependentRaters:5","blindReviewRequired:true","ownerScoringProhibited:true","realModelRequired:true"].every(g=>lab.includes(g)),"protocol_governance_contract_missing");
need(lab.includes('cmd==="freeze-protocol"')&&lab.includes('cmd==="validate-protocol"'),"lab_cli_protocol_commands_missing");
need(lab.includes("protocol_out_must_be_absolute_path")&&lab.includes("protocol_out_must_not_be_inside_repository")&&lab.includes("protocol_file_already_exists"),"lab_freeze_path_guards_missing");
need(lab.includes("protocol_sealed_output_inside_repo")&&lab.includes("protocol_sealed_output_location_invalid"),"lab_validate_path_guards_missing");

need(lab.includes("goldenSetSha256:goldenSha")&&lab.includes("golden_sha256_mismatch"),"protocol_golden_sha_guard_missing");
need(lab.includes("referenceStimuliManifestSha256:refSha")&&lab.includes("reference_stimuli_manifest_sha_mismatch"),"protocol_ref_manifest_sha_guard_missing");
need(lab.includes("deriveStratifiedSubset(briefs,30)")&&lab.includes("subset_brief_ids_lt_30")&&lab.includes("subset_stratification_non_canonical"),"protocol_subset_stratification_guard_missing");
for(const locale of ["en","vi","ja","ko","zh-CN","es","fr","de","pt-BR","it"])need(lab.includes(`"${locale}"`),`protocol_locale_missing_${locale}`);
need(lab.includes("protocol_stratification_missing_locale_${loc}")&&lab.includes("subset_missing_locale_${loc}"),"protocol_locale_guard_missing");
for(const occ of ["birthday","anniversary","thank-you","congratulations"])need(lab.includes(`"${occ}"`)&&lab.includes("subset_missing_occasion_"),"protocol_occasion_guard_missing");
for(const p of ["short","medium","long"])need(lab.includes(`"${p}"`)&&lab.includes("subset_missing_pressure_"),"protocol_pressure_guard_missing");
for(const ph of ["none","optional","required"])need(lab.includes(`"${ph}"`)&&lab.includes("subset_missing_photo_"),"protocol_photo_guard_missing");
for(const dim of ["personal_relevance_0_10","emotional_resonance_0_10","premium_art_direction_0_10","originality_0_10","wow_0_10","copy_quality_0_10","visual_copy_harmony_0_10","market_language_naturalness_0_10"])need(lab.includes(`"${dim}"`)&&lab.includes("missing_score_dimension_"),`protocol_score_dimension_guard_missing_${dim}`);
for(const def of ["critical_rendering_defect_0_1","critical_copyright_defect_0_1","critical_security_defect_0_1","critical_localization_defect_0_1","culturally_inappropriate_0_1"])need(lab.includes(`"${def}"`)&&lab.includes("missing_defect_flag_"),`protocol_defect_flag_guard_missing_${def}`);
need(lab.includes('raterRosterStatus="PENDING_INDEPENDENT_DECLARATION"')&&lab.includes("rater_roster_status_invalid"),"protocol_rater_roster_guard_missing");
need(lab.includes('conflictPolicyStatus="PENDING_INDEPENDENT_DECLARATION"')&&lab.includes("conflict_policy_status_invalid"),"protocol_conflict_policy_guard_missing");
need(lab.includes('PROTOCOL_STATUS_FROZEN="FROZEN_PENDING_SEALED_EVIDENCE"')&&lab.includes("status:PROTOCOL_STATUS_FROZEN")&&lab.includes("protocol_status_invalid")&&lab.includes("protocol_hash_integrity_mismatch"),"protocol_hash_integrity_guard_missing");

need(refManifest.status==="SOURCE_ONLY_REFERENCE_SAFE","reference_manifest_status_invalid");
need(refManifest.summary?.binaryCommitted===false&&refManifest.summary?.customerDataIncluded===false,"reference_manifest_safety_flags_invalid");
need(Array.isArray(refManifest.stimuli)&&refManifest.stimuli.length>0,"reference_manifest_stimuli_missing");
need(refManifest.stimuli.every(s=>s.redistributionStatus==="NO_BINARY_REDISTRIBUTION"&&s.licenseBasis==="internal-synthetic-reference-metadata-only"),"reference_manifest_stimuli_licensing_invalid");
need(refManifest.provenancePolicy?.includes("No raw binary")&&refManifest.provenancePolicy?.includes("No model training, customer data, commercial asset redistribution, license approval, ownership conclusion, or fair-use claim."),"reference_manifest_provenance_policy_missing");
need(refManifest.reviewAnchoringBasis==="internal-synthetic-reference-metadata-only-no-license-claim","reference_manifest_anchoring_basis_missing");
need(lab.includes("reference_stimuli_safety_violation")&&lab.includes('refDoc.status!=="SOURCE_ONLY_REFERENCE_SAFE"'),"lab_reference_manifest_enforcement_missing");

console.log(JSON.stringify({ok:true,briefs:golden.briefs.length,locales:new Set(golden.briefs.map(b=>b.locale)).size,checks:"step14 premium benchmark source contract + step13 challenge evidence + protocol freeze contract"}));
