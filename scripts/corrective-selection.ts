import { readFileSync } from "node:fs";
import {
  GenerationBriefSchema,
  withNormalizedBriefContext,
  type GenerationBrief,
} from "../packages/card-schema/src/index.ts";
import {
  buildCreativeCandidatePack,
  portfolioV2AllTemplates,
  rankTemplates,
  selectGenerationTemplates,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import {
  MockAIProvider,
  generateCreativeDirectorDirections,
} from "../packages/ai/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
const baseBrief: GenerationBrief = GenerationBriefSchema.parse({
  occasion: "Graduation — first studio show",
  recipient: "Mai",
  relationship: "sister",
  feeling: "quietly proud and hopeful",
  detail: "the blue notebook she carried through school",
  format: "portrait-5x7",
  locale: "en-US",
  hasPhoto: false,
  market: "US",
});

const selectionBrief = withNormalizedBriefContext(baseBrief);
need(selectionBrief.occasion === baseBrief.occasion, "raw_custom_occasion_lost");
need(selectionBrief.feeling === baseBrief.feeling, "raw_custom_feeling_lost");
need(selectionBrief.selectionContext?.rawOccasion === baseBrief.occasion, "raw_occasion_context_missing");
need(selectionBrief.selectionContext?.rawFeeling === baseBrief.feeling, "raw_feeling_context_missing");
need(selectionBrief.selectionContext?.normalizedOccasion === "graduation — first studio show", "occasion_not_normalized_for_selection");
need(selectionBrief.selectionContext?.normalizedFeeling === "quietly proud and hopeful", "feeling_not_normalized_for_selection");
console.log("BRIEF_RAW_AND_NORMALIZED=PASS");

const approvedCatalog = portfolioV2AllTemplates.map((template, index) => ({
  ...template,
  id: `aaaaaaaa-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  familyId: `bbbbbbbb-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  versionId: `cccccccc-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  status: "active" as const,
  health: "healthy" as const,
  launchStatus: "approved" as const,
}));

const rankInput = {
  market: "US",
  locale: "en-US",
  format: "portrait-5x7",
  feeling: selectionBrief.selectionContext!.normalizedFeeling,
  occasion: selectionBrief.selectionContext!.normalizedOccasion,
  hasPhoto: false,
  catalogMode: "production" as const,
};
const pool = buildCreativeCandidatePack(approvedCatalog, rankInput).all;
need(pool.length > 3 && pool.length <= 8, `bounded_pool_size_${pool.length}`);
need(new Set(pool.map(item => item.template.id)).size === pool.length, "bounded_pool_duplicate");
need(pool.every(item => item.template.status === "active" && item.template.health === "healthy" && item.template.launchStatus === "approved"), "pool_contains_ineligible");
console.log(`BOUNDED_MEANINGFUL_POOL=PASS count=${pool.length}`);

const birthdayScores = rankTemplates(approvedCatalog, { ...rankInput, occasion: "birthday", feeling: "warm" });
const anniversaryScores = rankTemplates(approvedCatalog, { ...rankInput, occasion: "anniversary", feeling: "romantic" });
need(JSON.stringify(birthdayScores.map(item => item.score)) !== JSON.stringify(anniversaryScores.map(item => item.score)), "counterfactual_brief_did_not_change_scores");
console.log("COUNTERFACTUAL_RANKING=PASS");

const editorialOnly = approvedCatalog.slice(0, 3).map((template, index) => ({
  ...template,
  id: `dddddddd-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  familyId: `eeeeeeee-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  versionId: `ffffffff-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  visualDirection: "editorial" as const,
  rendererTemplateKey: "luxury-editorial",
}));
const noForcedMidnight = selectGenerationTemplates(editorialOnly, rankInput);
need(noForcedMidnight.length === 3, `small_relevant_catalog_count_${noForcedMidnight.length}`);
need(noForcedMidnight.every(item => item.template.visualDirection === "editorial"), "forced_midnight_or_archetype_substitution");
console.log("NO_FORCED_ARCHETYPE=PASS");

const tinyCatalog = selectGenerationTemplates(editorialOnly.slice(0, 2), rankInput);
need(tinyCatalog.length === 2, `small_catalog_silent_fabrication_${tinyCatalog.length}`);
need(tinyCatalog.every(item => editorialOnly.some(template => template.id === item.template.id)), "small_catalog_invented_identity");
console.log("SMALL_CATALOG_EXPLICIT=PASS");

const mock = new MockAIProvider();
const aiBriefA = withNormalizedBriefContext(GenerationBriefSchema.parse({ ...baseBrief, occasion: "Graduation", feeling: "proud" }));
const aiBriefB = withNormalizedBriefContext(GenerationBriefSchema.parse({ ...baseBrief, occasion: "Thank You", feeling: "grateful", detail: "the long walk home" }));
const aiPool = buildCreativeCandidatePack(approvedCatalog, {
  ...rankInput,
  occasion: "graduation",
  feeling: "proud",
}).all;
const resultA = await generateCreativeDirectorDirections(mock, aiBriefA, aiPool);
const resultB = await generateCreativeDirectorDirections(mock, aiBriefB, aiPool);
need(resultA.kind === "ready" && resultB.kind === "ready", "mock_director_not_ready");
const allowed = new Set(aiPool.map(item => `${item.template.id}:${item.template.versionId}`));
for (const result of [resultA.result, resultB.result]) {
  need(result.directions.every(direction => allowed.has(`${direction.templateId}:${direction.templateVersionId}`)), "ai_invented_template_identity");
}
need(JSON.stringify(resultA.result.directions.map(direction => direction.body)) !== JSON.stringify(resultB.result.directions.map(direction => direction.body)), "counterfactual_brief_did_not_change_copy");
console.log("AI_POOL_AND_COPY_CONTRACT=PASS");

const route = readFileSync(new URL("../apps/web/app/api/generate/route.ts", import.meta.url), "utf8");
need(route.includes("withNormalizedBriefContext"), "route_drops_normalized_brief_context");
need(route.includes("const {priceQuote:_,...clientBrief}=parsed.data"), "route_does_not_preserve_raw_client_brief");
const worker = readFileSync(new URL("../apps/worker/src/index.ts", import.meta.url), "utf8");
need(worker.includes("candidatePool=noveltySelection.exhaustionState===\"none\"?pack.all:noveltySelection.candidates"), "worker_still_preselects_three_for_ai");
need(!worker.includes("requiredArchetypes"), "worker_keeps_fixed_archetype_quota");
console.log("PRODUCTION_SELECTION_WIRING=PASS");

console.log("CORRECTIVE_SELECTION=PASS");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
