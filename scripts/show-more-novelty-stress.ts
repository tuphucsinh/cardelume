import {
  MockAIProvider,
  buildDeterministicCreativeFallback,
  generateCreativeDirectorDirections,
} from "../packages/ai/src/index.ts";
import {
  portfolioV2AllTemplates,
  selectGenerationTemplates,
  selectNovelGenerationTemplates,
  templatePairKey,
  type TemplateIdentity,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import type { GenerationBrief } from "../packages/card-schema/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function identities(items: Array<{ template: TemplateMeta }>): TemplateIdentity[] {
  return items.map(({ template }) => ({ templateId: template.id, templateVersionId: template.versionId }));
}

function keys(items: Array<{ template: TemplateMeta }> | TemplateIdentity[]) {
  return items.map(item => templatePairKey("template" in item ? item.template : item));
}

function overlap(left: string[], right: string[]) {
  return left.filter(key => right.includes(key));
}

const brief: GenerationBrief = {
  locale: "en-US",
  format: "portrait-5x7",
  hasPhoto: false,
  market: "GLOBAL",
  feeling: "Warm",
  occasion: "Birthday",
  relationship: "Friend",
  recipient: "Alex",
  detail: "",
};

// The checked-in portfolio is intentionally candidate-only. This memory-only fixture
// mirrors the managed approved pool without changing catalog, DB, or runtime state.
const catalog: TemplateMeta[] = portfolioV2AllTemplates.map(template => ({
  ...template,
  launchStatus: "approved",
}));

const rankInput = {
  market: brief.market,
  locale: brief.locale,
  format: brief.format,
  feeling: brief.feeling,
  occasion: brief.occasion,
  hasPhoto: brief.hasPhoto,
  catalogMode: "production" as const,
};

function withSeen(seenTemplateIdentities: TemplateIdentity[]) {
  return { ...rankInput, seenTemplateIdentities };
}

function printPass(name: string, detail: string) {
  console.log(`${name}=PASS ${detail}`);
}

async function main() {
  need(catalog.length >= 12, `fixture_catalog_${catalog.length}`);

  const first = selectNovelGenerationTemplates(catalog, rankInput);
  need(first.exhaustionState === "none" && first.candidates.length === 3, "first_generation_not_three_fresh");
  const firstKeys = keys(first.candidates);

  const second = selectNovelGenerationTemplates(catalog, withSeen(identities(first.candidates)));
  need(second.exhaustionState === "none" && second.candidates.length === 3, "first_refresh_not_three_fresh");
  const secondKeys = keys(second.candidates);
  need(overlap(firstKeys, secondKeys).length === 0, `FIRST_REFRESH_OVERLAP:${overlap(firstKeys, secondKeys).join(",")}`);
  printPass("FIRST_REFRESH", `overlap=0`);

  const third = selectNovelGenerationTemplates(catalog, withSeen([...identities(first.candidates), ...identities(second.candidates)]));
  const thirdKeys = keys(third.candidates);
  need(third.exhaustionState === "none" && third.candidates.length === 3, "second_refresh_not_three_fresh");
  need(overlap([...firstKeys, ...secondKeys], thirdKeys).length === 0, "MULTI_ROUND_OVERLAP");
  printPass("MULTI_ROUND", `round2_overlap=0 cumulative=${firstKeys.length + secondKeys.length}`);

  const aiBrief = { ...brief, refreshContext: { seenTemplateIdentities: identities(first.candidates) } };
  const aiSelection = selectNovelGenerationTemplates(catalog, withSeen(identities(first.candidates)));
  const aiOutcome = await generateCreativeDirectorDirections(new MockAIProvider(), aiBrief, aiSelection.candidates);
  need(aiOutcome.kind === "ready", "live_ai_not_ready");
  const aiKeys = aiOutcome.result.directions.map(direction => `${direction.templateId}:${direction.templateVersionId}`.toLowerCase());
  need(overlap(firstKeys, aiKeys).length === 0, "LIVE_AI_REINTRODUCED_SEEN");
  printPass("LIVE_AI", `overlap=0`);

  let providerFailed = false;
  try {
    await generateCreativeDirectorDirections({
      providerName: "failing-fixture",
      modelName: "fixture",
      async generateJson() {
        throw new Error("fixture_provider_failure");
      },
    }, aiBrief, aiSelection.candidates);
  } catch {
    providerFailed = true;
  }
  need(providerFailed, "provider_failure_fixture_did_not_fail");
  const fallback = buildDeterministicCreativeFallback(aiBrief, aiSelection.candidates, { exhaustionState: aiSelection.exhaustionState });
  const fallbackKeys = fallback.directions.map(direction => `${direction.templateId}:${direction.templateVersionId}`.toLowerCase());
  need(overlap(firstKeys, fallbackKeys).length === 0, "FALLBACK_REINTRODUCED_SEEN");
  printPass("PROVIDER_FAILURE_FALLBACK", `overlap=0`);

  // Recovery uses the same deterministic selector/fallback contract after a failed provider.
  const recoverySelection = selectNovelGenerationTemplates(catalog, withSeen(identities(first.candidates)));
  const recovered = buildDeterministicCreativeFallback(aiBrief, recoverySelection.candidates, { exhaustionState: recoverySelection.exhaustionState });
  const recoveredKeys = recovered.directions.map(direction => `${direction.templateId}:${direction.templateVersionId}`.toLowerCase());
  need(overlap(firstKeys, recoveredKeys).length === 0, "RECOVERY_REINTRODUCED_SEEN");
  printPass("RECOVERY", `overlap=0`);

  const keepUnseen = catalog.slice(-2);
  const almostSeen = catalog.slice(0, -2).map(template => ({ templateId: template.id, templateVersionId: template.versionId }));
  const partial = selectNovelGenerationTemplates(catalog, withSeen(almostSeen));
  const partialKeys = keys(partial.candidates);
  const expectedUnseen = keys(keepUnseen.map(template => ({ template })));
  need(partial.exhaustionState === "partial", `partial_state_${partial.exhaustionState}`);
  need(expectedUnseen.every(key => partialKeys.includes(key)), "PARTIAL_DROPPED_UNSEEN");
  need(partialKeys.slice(0, expectedUnseen.length).every(key => expectedUnseen.includes(key)), "PARTIAL_UNSEEN_NOT_FIRST");
  printPass("PARTIAL_EXHAUSTION", `unseen=${expectedUnseen.length}`);

  const allSeen = catalog.map(template => ({ templateId: template.id, templateVersionId: template.versionId }));
  const total = selectNovelGenerationTemplates(catalog, withSeen(allSeen));
  need(total.exhaustionState === "total" && total.candidates.length === 3, `total_state_${total.exhaustionState}_${total.candidates.length}`);
  const totalResult = buildDeterministicCreativeFallback({ ...brief, refreshContext: { seenTemplateIdentities: allSeen } }, total.candidates, { exhaustionState: total.exhaustionState });
  need(totalResult.exhaustionState === "total", "TOTAL_EXHAUSTION_NOT_TRUTHFUL");
  printPass("TOTAL_EXHAUSTION", `state=${totalResult.exhaustionState}`);

  const initialDiversity = selectGenerationTemplates(catalog, rankInput);
  need(initialDiversity.length === 3, "initial_diversity_count");
  need(new Set(initialDiversity.map(item => item.template.familyId)).size === 3, "initial_diversity_family_duplicate");
  printPass("PERCEPTUAL_DIVERSITY_REGRESSION", `families=3`);

  const deterministicA = selectNovelGenerationTemplates(catalog, withSeen(identities(first.candidates)));
  const deterministicB = selectNovelGenerationTemplates(catalog, withSeen(identities(first.candidates)));
  need(JSON.stringify(keys(deterministicA.candidates)) === JSON.stringify(keys(deterministicB.candidates)), "selection_not_deterministic");
  printPass("DETERMINISM", "same_input_same_pairs");

  console.log("SHOW_MORE_NOVELTY_TESTS=PASS");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
