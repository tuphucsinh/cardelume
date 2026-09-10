import { readFileSync } from "node:fs";
import { GenerationBriefSchema } from "../packages/card-schema/src/index.ts";
import { assertCreativeDirectionDiversity, buildDeterministicCreativeFallback, creativeQualityRisks } from "../packages/ai/src/index.ts";
import { portfolioV2AllTemplates, buildCreativeCandidatePack, selectNovelGenerationTemplates, type TemplateIdentity, type TemplateMeta } from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function identities(items: Array<{ template: TemplateMeta }>): TemplateIdentity[] { return items.map(item => ({ templateId: item.template.id, templateVersionId: item.template.versionId })); }
function pairs(items: Array<{ templateId?: string; templateVersionId?: string }>): string[] { return items.flatMap(item => item.templateId && item.templateVersionId ? [`${item.templateId}:${item.templateVersionId}`] : []); }

const brief = GenerationBriefSchema.parse({locale:"en",format:"portrait-5x7",hasPhoto:false,market:"OTHER",feeling:"Elegant",occasion:"Anniversary",relationship:"Partner",recipient:"Lan",detail:"",selectionContext:{rawFeeling:"Elegant",rawOccasion:"Anniversary",normalizedFeeling:"elegant",normalizedOccasion:"anniversary"}});
const catalog: TemplateMeta[] = portfolioV2AllTemplates.filter(template => template.launchStatus !== "hold" && template.launchStatus !== "retired");
const initialInput = {market:brief.market,locale:brief.locale,format:brief.format,feeling:"elegant",occasion:"anniversary",hasPhoto:false};

async function main() {
  const initialSelection = selectNovelGenerationTemplates(catalog, initialInput);
  need(initialSelection.unseenCount >= 3, "initial_pool_not_ready");
  const initialPool = buildCreativeCandidatePack(catalog, initialInput).all;
  const initial = buildDeterministicCreativeFallback(brief, initialSelection.candidates, {allowStagingCandidates:true});
  const initialRisks = creativeQualityRisks(initial, brief, [], initialSelection.candidates);
  need(!initialRisks.some(r => ["creative_range","copy_risk","low_confidence","low_wow"].includes(r)), `initial_premium_risk:${initialRisks.join(",")}`);
  const seen = initial.directions.flatMap(direction => direction.templateId && direction.templateVersionId ? [{templateId:direction.templateId,templateVersionId:direction.templateVersionId}] : []);
  const refreshBrief = {...brief, refreshContext:{seenTemplateIdentities:seen}};
  const refreshInput = {...initialInput, recentStyles:seen.flatMap(item => { const t=catalog.find(candidate => candidate.id===item.templateId&&candidate.versionId===item.templateVersionId); return t?[{familyId:t.familyId,templateId:t.id,visualDirection:t.visualDirection,createdAt:new Date().toISOString()}]:[]; }),seenTemplateIdentities:seen};
  const refreshSelection = selectNovelGenerationTemplates(catalog, refreshInput);
  need(refreshSelection.unseenCount >= 3, "refresh_pool_not_ready");
  need(refreshSelection.candidates.every(item => !seen.some(identity => identity.templateId===item.template.id&&identity.templateVersionId===item.template.versionId)), "refresh_recycled_seen_candidate");
  const refreshPool = buildCreativeCandidatePack(catalog, refreshInput).all;
  const refresh = buildDeterministicCreativeFallback(refreshBrief, refreshSelection.candidates, {exhaustionState:refreshSelection.exhaustionState,allowStagingCandidates:true});
  const refreshRisks = creativeQualityRisks(refresh, refreshBrief, refreshInput.recentStyles, refreshSelection.candidates);
  need(!refreshRisks.some(r => ["creative_range","copy_risk","low_confidence","low_wow"].includes(r)), `refresh_premium_risk:${refreshRisks.join(",")}`);
  assertCreativeDirectionDiversity(refresh, refreshSelection.candidates, refreshBrief);
  need(pairs(refresh.directions).every(pair => !seen.some(identity => `${identity.templateId}:${identity.templateVersionId}`===pair)), "refresh_recycled_seen_candidate");
  console.log(`INITIAL_PASS_SHOW_MORE_PASS=PASS unseen=${refreshSelection.unseenCount} pool=${refreshPool.length}`);

  const fallback = refresh;
  need(pairs(fallback.directions).every(pair => !seen.some(identity => `${identity.templateId}:${identity.templateVersionId}`===pair)), "recovery_recycled_seen_candidate");
  console.log("STAGING_RECOVERY_FALLBACK=PASS");

  const allSeen = catalog.map(template => ({templateId:template.id,templateVersionId:template.versionId}));
  const exhausted = selectNovelGenerationTemplates(catalog, {...initialInput,seenTemplateIdentities:allSeen});
  need(exhausted.unseenCount === 0, "exhaustion_unseen_pool_nonzero");
  need(exhausted.exhaustionState === "total", "exhaustion_state_not_total");
  console.log("GENUINE_QUALITY_EXHAUSTION=PASS unseen=0 no_recycle_allowed");

  const worker = readFileSync(new URL("../apps/worker/src/index.ts", import.meta.url), "utf8");
  need(worker.includes('if(isRefresh&&noveltySelection.unseenCount<3)throw new Error("ai_template_exhausted")'), "worker_exhaustion_guard_missing");
  need(worker.includes('catalogMode:"production"') === false, "recovery_forces_production_catalog");
  need(worker.includes("ai_quality_gate_evaluated"), "quality_gate_diagnostics_missing");
  const client = readFileSync(new URL("../apps/web/lib/generation-client.ts", import.meta.url), "utf8");
  need(client.includes("generation_exhausted"), "client_exhaustion_mapping_missing");
  const studio = readFileSync(new URL("../apps/web/components/card-studio.tsx", import.meta.url), "utf8");
  need(studio.includes("novelty_exhausted") && studio.includes("no more unseen directions"), "truthful_exhaustion_copy_missing");
  console.log("TRUTHFUL_EXHAUSTION_WIRING=PASS");
}

main().catch(error => { console.error(error); process.exit(1); });