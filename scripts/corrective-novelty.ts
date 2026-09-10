import { readFileSync } from "node:fs";
import { isCurrentGenerationRequest } from "../apps/web/lib/generation-client.ts";
import { GenerationBriefSchema } from "../packages/card-schema/src/index.ts";
import {
  buildDeterministicCreativeFallback,
  MockAIProvider,
  generateCreativeDirectorDirections,
} from "../packages/ai/src/index.ts";
import {
  portfolioV2AllTemplates,
  selectNovelGenerationTemplates,
  type TemplateIdentity,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const brief = GenerationBriefSchema.parse({
  locale: "en-US",
  format: "portrait-5x7",
  hasPhoto: false,
  market: "GLOBAL",
  feeling: "Warm",
  occasion: "Birthday",
  relationship: "Friend",
  recipient: "Alex",
  detail: "A quiet morning together",
});
const catalog: TemplateMeta[] = portfolioV2AllTemplates.map(template => ({ ...template, launchStatus: "approved" }));
const rankInput = {
  market: brief.market,
  locale: brief.locale,
  format: brief.format,
  feeling: brief.feeling,
  occasion: brief.occasion,
  hasPhoto: brief.hasPhoto,
  catalogMode: "production" as const,
};
function ids(items: Array<{ templateId?: string; templateVersionId?: string }>): string[] {
  return items.flatMap(item => item.templateId && item.templateVersionId ? [`${item.templateId}:${item.templateVersionId}`] : []);
}
function presentationsMatch(items: Array<{ templateId?: string; templateVersionId?: string; presentation?: { templateId: string; templateVersionId: string; rendererTemplateKey: string } }>): boolean {
  return items.every(item => item.templateId && item.templateVersionId && item.presentation?.templateId === item.templateId && item.presentation.templateVersionId === item.templateVersionId && item.presentation.rendererTemplateKey.length > 0);
}
function identity(items: Array<{ template: TemplateMeta }>): TemplateIdentity[] {
  return items.map(item => ({ templateId: item.template.id, templateVersionId: item.template.versionId }));
}

async function main() {
  need(isCurrentGenerationRequest(1, 1), "current_request_rejected");
  need(!isCurrentGenerationRequest(1, 2), "stale_request_allowed");
  const aborted = new AbortController();
  aborted.abort();
  need(!isCurrentGenerationRequest(1, 1, aborted.signal), "aborted_request_allowed");
  console.log("STALE_ASYNC_GATE=PASS");

  const first = selectNovelGenerationTemplates(catalog, rankInput);
  const seen = identity(first.candidates);
  const second = selectNovelGenerationTemplates(catalog, { ...rankInput, seenTemplateIdentities: seen });
  need(second.candidates.every(item => !seen.some(id => id.templateId === item.template.id && id.templateVersionId === item.template.versionId)), "exact_seen_identity_reintroduced");
  const ai = await generateCreativeDirectorDirections(new MockAIProvider(), { ...brief, refreshContext: { seenTemplateIdentities: seen } }, second.candidates);
  need(ai.kind === "ready", "live_ai_not_ready");
  need(ids(ai.result.directions).every(key => !seen.some(id => `${id.templateId}:${id.templateVersionId}` === key)), "live_ai_reintroduced_seen");
  need(presentationsMatch(ai.result.directions), "live_ai_presentation_identity_mismatch");
  const fallback = buildDeterministicCreativeFallback({ ...brief, refreshContext: { seenTemplateIdentities: seen } }, second.candidates, { exhaustionState: second.exhaustionState });
  need(ids(fallback.directions).every(key => !seen.some(id => `${id.templateId}:${id.templateVersionId}` === key)), "server_fallback_reintroduced_seen");
  need(presentationsMatch(fallback.directions), "server_fallback_presentation_identity_mismatch");
  console.log("LIVE_RECOVERY_SERVER_FALLBACK=PASS");

  const cardStudio = readFileSync(new URL("../apps/web/components/card-studio.tsx", import.meta.url), "utf8");
  const generateStart = cardStudio.indexOf("async function generate(regenerating=false)");
  const trackStart = cardStudio.indexOf("\n  function trackTemplate", generateStart);
  const generateBlock = cardStudio.slice(generateStart, trackStart);
  need(generateBlock.includes("generationRequestId"), "browser_request_epoch_missing");
  need(generateBlock.includes("isCurrentGenerationRequest"), "browser_stale_guard_missing");
  need(generateBlock.includes("if(!regenerating)seenTemplateIdentities.current=[]"), "new_brief_seen_reset_missing");
  const catchStart = generateBlock.indexOf("}catch(error){");
  const catchBlock = generateBlock.slice(catchStart);
  need(catchBlock.includes("if(regenerating)"), "browser_regeneration_failure_branch_missing");
  need(catchBlock.includes("setPhase(\"results\")"), "browser_regeneration_failure_not_recoverable");
  const regenerationFailure=catchBlock.slice(catchBlock.indexOf("if(regenerating)")).split("return;")[0];
  need(!regenerationFailure.includes("rememberDisplayed(resultDirections)"), "browser_fallback_bypasses_novelty");
  need(!regenerationFailure.includes("setGeneratedResult(null)"), "browser_fallback_erases_current_choices");
  need(regenerationFailure.includes("setRefreshUnavailable(true)"), "browser_refresh_failure_not_honest");
  const initialFailure = catchBlock.slice(catchBlock.indexOf("// Provider/queue/network failures"));
  need(initialFailure.includes("setPhase(\"brief\")"), "browser_initial_failure_reveals_results");
  need(!initialFailure.includes("rememberDisplayed(resultDirections)"), "browser_initial_failure_bypasses_novelty");
  need(initialFailure.includes("setUsedCuratedFallback(false)"), "browser_initial_failure_claims_curated_fallback");
  need(cardStudio.includes("refreshUnavailable"), "browser_refresh_unavailable_state_missing");
  need(cardStudio.includes("data-exhaustion-state={refreshUnavailable?\"unavailable\":exhaustionState}"), "refresh_click_not_bounded");
  const aiSource = readFileSync(new URL("../packages/ai/src/index.ts", import.meta.url), "utf8");
  need(aiSource.includes("presentation:resolveCanonicalPresentationFromTemplate"), "ai_presentation_authority_missing");
  const workerSource = readFileSync(new URL("../apps/worker/src/index.ts", import.meta.url), "utf8");
  need(workerSource.includes("assertCreativeDirectionDiversity(result,candidatePool,brief!)"), "worker_final_diversity_enforcement_missing");
  need(workerSource.includes("seenTemplateIdentities:brief.refreshContext?.seenTemplateIdentities??[]"), "worker_recovery_seen_context_missing");
  console.log("BROWSER_FALLBACK_AND_RESET_WIRING=PASS");

  const client = readFileSync(new URL("../apps/web/lib/generation-client.ts", import.meta.url), "utf8");
  need(client.includes("generationRequestIsCurrent") || client.includes("isCurrentGenerationRequest"), "client_request_epoch_contract_missing");
  console.log("CORRECTIVE_NOVELTY=PASS");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
