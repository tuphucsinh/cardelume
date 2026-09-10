import {
  classifyProviderError,
  generateCreativeDirectorDirections,
  OpenAICompatibleProvider,
} from "../packages/ai/src/index.ts";
import {
  GenerationBriefSchema,
  withNormalizedBriefContext,
} from "../packages/card-schema/src/index.ts";
import {
  buildCreativeCandidatePack,
  portfolioV2AllTemplates,
  templateCreativeRecipe,
} from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function response(content: string, status = 200) {
  return new Response(JSON.stringify({
    model: "gemini-flash-lite-latest",
    choices: [{ finish_reason: "stop", message: { role: "assistant", content } }],
  }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function provider(content: string, model = "gemini-flash-lite-latest", baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai") {
  return new OpenAICompatibleProvider({ apiKey: "[REDACTED]", model, baseUrl }, async () => response(content));
}

function fixtureCatalog() {
  return portfolioV2AllTemplates.map((template, index) => ({
    ...template,
    id: `aaaaaaaa-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    familyId: `bbbbbbbb-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    versionId: `cccccccc-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    status: "active" as const,
    health: "healthy" as const,
    launchStatus: "approved" as const,
  }));
}

function buildWrappedDirections(pool: ReturnType<typeof buildCreativeCandidatePack>["all"], count = 3) {
  const selected = [] as typeof pool;
  const families = new Set<string>();
  const visuals = new Set<string>();
  for (const candidate of pool) {
    const family = candidate.template.familyId;
    const visual = candidate.template.visualDirection;
    if (families.has(family) || visuals.has(visual)) continue;
    selected.push(candidate);
    families.add(family);
    visuals.add(visual);
    if (selected.length === count) break;
  }
  return selected.map((candidate, index) => {
    const recipe = templateCreativeRecipe(candidate.template);
    const id = (["editorial", "midnight", "quiet"] as const)[index];
    return {
      id,
      templateId: candidate.template.id,
      templateVersionId: candidate.template.versionId,
      creativeThesis: `A distinct ${candidate.template.visualDirection} direction for this brief, with a clear premium visual point of view.`,
      customerRationale: "A considered fit for this meaningful occasion.",
      signatureMove: [recipe.signatureMoves[0], "recipient_anchor"],
      accentMode: [recipe.preferredAccents[0], "original"],
      kicker: "FOR LAN",
      headline: "A warm anniversary kept close",
      body: "A personal anniversary note for Lan, shaped by a quiet dinner by the river.",
      confidence: 0.9,
      noveltyScore: 0.8,
      wowScore: 0.85,
      riskCodes: [],
    };
  });
}

async function main() {
  const brief = withNormalizedBriefContext(GenerationBriefSchema.parse({
    occasion: "Anniversary",
    recipient: "Lan",
    relationship: "Partner",
    feeling: "Warm",
    detail: "a quiet dinner by the river",
    format: "portrait-5x7",
    locale: "en-US",
    hasPhoto: false,
    market: "US",
  }));
  const pool = buildCreativeCandidatePack(fixtureCatalog(), {
    market: "US",
    locale: "en-US",
    format: "portrait-5x7",
    feeling: "warm",
    occasion: "anniversary",
    hasPhoto: false,
    catalogMode: "production",
  }).all;
  need(pool.length >= 3, `fixture_pool_too_small_${pool.length}`);
  const wrappedDirections = buildWrappedDirections(pool);
  need(wrappedDirections.length === 3, `fixture_distinct_pool_too_small_${wrappedDirections.length}`);
  const wrappedPayload = JSON.stringify({ action: "select", select: { directions: wrappedDirections } });

  const normalized = (await provider(wrappedPayload).generateJson({ system: "Return JSON only.", prompt: "select" })).data as Record<string, unknown>;
  need(normalized.action === "select", "wrapped_action_lost");
  need(Array.isArray(normalized.directions) && normalized.directions.length === 3, "wrapped_directions_not_unwrapped");
  const normalizedFirst = (normalized.directions as Array<Record<string, unknown>>)[0];
  need(typeof normalizedFirst.signatureMove === "string", "signature_move_not_scalar_normalized");
  need(typeof normalizedFirst.accentMode === "string", "accent_mode_not_scalar_normalized");
  console.log("GEMINI_WRAPPED_NORMALIZATION=PASS");

  const liveShape = await provider(wrappedPayload).generateJson({ system: "Return JSON only.", prompt: "select" });
  need((liveShape.data as Record<string, unknown>).directions instanceof Array, "adapter_did_not_normalize_wrapped_payload");
  console.log("GEMINI_ADAPTER_ENVELOPE=PASS");

  const ready = await generateCreativeDirectorDirections(provider(wrappedPayload), brief, pool);
  need(ready.kind === "ready" && ready.result.directions.length === 3, "normalized_generation_not_ready");
  console.log("GEMINI_CANONICAL_THREE=PASS");

  const wrongCount = JSON.stringify({ action: "select", select: { directions: wrappedDirections.slice(0, 2) } });
  let wrongCountError: unknown;
  try {
    await generateCreativeDirectorDirections(provider(wrongCount), brief, pool);
  } catch (error) {
    wrongCountError = error;
  }
  need(wrongCountError instanceof Error && wrongCountError.message === "ai_direction_count_invalid", "wrong_count_not_fail_closed");
  console.log("WRONG_DIRECTION_COUNT_FAIL_CLOSED=PASS");

  let malformedError: unknown;
  try {
    await provider('{"action":"select","select":').generateJson({ system: "Return JSON only.", prompt: "select" });
  } catch (error) {
    malformedError = error;
  }
  need(malformedError instanceof Error && malformedError.message === "ai_provider_invalid_json", "malformed_json_not_rejected");
  need(classifyProviderError(malformedError) === "response_contract", "malformed_json_class_invalid");
  console.log("MALFORMED_GEMINI_FAIL_CLOSED=PASS");

  const openCodePayload = JSON.stringify({ directions: [{ id: "legacy" }] });
  const openCodeData = await provider(openCodePayload, "glm-5.2", "https://opencode.ai/zen/go/v1").generateJson({ system: "Return JSON only.", prompt: "select" });
  need(Array.isArray((openCodeData.data as Record<string, unknown>).directions), "opencode_top_level_changed");
  need(((openCodeData.data as Record<string, unknown>).directions as unknown[]).length === 1, "opencode_payload_changed");
  console.log("OPENCODE_TOP_LEVEL_REGRESSION=PASS");

  console.log("CORRECTIVE_GEMINI_COMPATIBILITY=PASS");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "corrective_gemini_compatibility_failed");
  process.exit(1);
});
