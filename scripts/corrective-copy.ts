import { readFileSync } from "node:fs";
import {
  MockAIProvider,
  assertSemanticCopyContract,
  buildDeterministicCreativeFallback,
  generateCreativeDirectorDirections,
  semanticCopyContractViolations,
  type AIProvider,
} from "../packages/ai/src/index.ts";
import { GenerationResultSchema, type GenerationBrief, type GenerationResult } from "../packages/card-schema/src/index.ts";
import { portfolioV2AllTemplates, type RankedTemplate, type TemplateMeta } from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function approved(template: TemplateMeta): TemplateMeta {
  return { ...template, status: "active", health: "healthy", launchStatus: "approved" };
}

function ranked(template: TemplateMeta, score = 0.9): RankedTemplate {
  return {
    template,
    score,
    baseScore: score,
    marketScore: 0.8,
    reasons: ["corrective-copy-fixture"],
    components: { relevance: 0.9, market: 0.8, editorial: 0.9, performance: 0.8, textFit: 1, freshness: 0.7, photoFit: 1, noveltyPenalty: 0 },
  };
}

const sourceEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial");
const sourceMidnight = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume");
const sourceQuiet = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress");
need(sourceEditorial && sourceMidnight && sourceQuiet, "copy_fixture_sources_missing");
const candidates: RankedTemplate[] = [ranked(approved(sourceEditorial)), ranked(approved(sourceMidnight)), ranked(approved(sourceQuiet))];

function brief(overrides: Partial<GenerationBrief> = {}): GenerationBrief {
  return {
    locale: "en-US", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL",
    occasion: "Birthday", relationship: "Friend", feeling: "Warm", recipient: "Maya",
    detail: "she keeps blue notebooks from every trip",
    ...overrides,
  };
}

function copyText(result: GenerationResult) {
  return result.directions.map(d => `${d.kicker} ${d.headline} ${d.body}`).join(" ");
}
function identity(result: GenerationResult) {
  return result.directions.map(d => `${d.templateId}:${d.templateVersionId}`).join("|");
}
function noGeneric(text: string) {
  return !/beautiful\s+(?:year|moment)|\b(?:moment|glow)\b|(?:một|những)\s+khoảnh khắc/i.test(text);
}

async function main() {
  const markers: string[] = [];

  // Many occasions and feelings must change deterministic copy, not only remove a Birthday word.
  const occasions = ["Birthday", "Anniversary", "Thank You", "Congratulations", "New Baby"];
  const viCopies = occasions.map((occasion, index) => {
    const result = buildDeterministicCreativeFallback(brief({ locale: "vi", occasion, feeling: ["Warm", "Romantic", "Elegant", "Fun", "Surprise me"][index], recipient: `Người nhận ${index + 1}`, detail: `chi tiết riêng ${index + 1}` }), candidates);
    assertSemanticCopyContract(result, brief({ locale: "vi", occasion, feeling: ["Warm", "Romantic", "Elegant", "Fun", "Surprise me"][index], recipient: `Người nhận ${index + 1}`, detail: `chi tiết riêng ${index + 1}` }));
    const text = copyText(result);
    need(noGeneric(text), `vi_generic_copy:${occasion}`);
    need(text.includes(`Người nhận ${index + 1}`), `vi_recipient_missing:${occasion}`);
    need(text.includes(`chi tiết riêng ${index + 1}`), `vi_detail_missing:${occasion}`);
    return text;
  });
  need(new Set(viCopies).size === viCopies.length, "vi_standard_occasions_collapsed");
  markers.push("VI_STANDARD_OCCASION_VARIETY=PASS");

  const englishWarm = copyText(buildDeterministicCreativeFallback(brief({ locale: "en-US", occasion: "Birthday", feeling: "Warm" }), candidates));
  const englishRomantic = copyText(buildDeterministicCreativeFallback(brief({ locale: "en-US", occasion: "Birthday", feeling: "Romantic" }), candidates));
  need(englishWarm !== englishRomantic, "english_feeling_collapsed");
  need(noGeneric(englishWarm) && noGeneric(englishRomantic), "english_generic_copy_present");
  markers.push("EN_FEELING_VARIETY=PASS");

  // New Baby and custom occasions must use their own semantic input and never silently become Birthday.
  for (const occasion of ["Graduation", "New Baby", "Get Well"]) {
    const customBrief = brief({ locale: "vi", occasion, feeling: "Warm", recipient: "Linh", detail: `${occasion} needs a personal note` });
    const result = buildDeterministicCreativeFallback(customBrief, candidates);
    const text = copyText(result);
    assertSemanticCopyContract(result, customBrief);
    need(text.includes(occasion), `custom_occasion_missing:${occasion}`);
    need(!/birthday|sinh nhật/i.test(text), `custom_occasion_became_birthday:${occasion}`);
    need(!semanticCopyContractViolations(result, customBrief).length, `custom_contract_violation:${occasion}`);
  }
  markers.push("CUSTOM_OCCASION_SEMANTICS=PASS");

  // Normal provider path uses the same semantic brief contract and remains localized/personalized.
  const liveBrief = brief({ locale: "vi", occasion: "Graduation", feeling: "Elegant", recipient: "Linh", detail: "the blue notebook from her final semester" });
  const liveOutcome = await generateCreativeDirectorDirections(new MockAIProvider(), liveBrief, candidates);
  need(liveOutcome.kind === "ready", "mock_live_copy_not_ready");
  assertSemanticCopyContract(liveOutcome.result, liveBrief);
  need(!semanticCopyContractViolations(liveOutcome.result, liveBrief).length, "mock_live_copy_contract_violation");
  need(copyText(liveOutcome.result).includes("Linh"), "mock_live_recipient_missing");
  markers.push("LIVE_SEMANTIC_CONTRACT=PASS");

  // Provider failure/recovery uses deterministic semantic copy while preserving exact candidate identity.
  const failingProvider: AIProvider = {
    providerName: "forced-failure", modelName: "forced-failure",
    async generateJson() { throw new Error("ai_provider_timeout"); },
  };
  const recoveryBrief = brief({ locale: "vi", occasion: "Get Well", feeling: "Warm", recipient: "An", detail: "a quiet recovery at home" });
  let providerFailed = false;
  try { await generateCreativeDirectorDirections(failingProvider, recoveryBrief, candidates); }
  catch { providerFailed = true; }
  need(providerFailed, "forced_provider_failure_not_observed");
  const recovery = buildDeterministicCreativeFallback(recoveryBrief, candidates, { exhaustionState: "partial" });
  assertSemanticCopyContract(recovery, recoveryBrief);
  need(identity(recovery) === identity(buildDeterministicCreativeFallback(recoveryBrief, candidates)), "recovery_identity_changed");
  need(copyText(recovery).includes("An") && copyText(recovery).includes("Get Well"), "recovery_semantic_signals_missing");
  markers.push("PROVIDER_FAILURE_RECOVERY=PASS");

  // Explicit regression: a collapsed generic trio is still classified as a copy risk.
  // (CL2 removed the `generic_collapse` keyword rule that banned premium words such as
  // "moment"/"glow"; duplicate/collapsed output is caught by `direction_copy_duplicate`.)
  const collapsed = GenerationResultSchema.parse({
    directions: recovery.directions.map((direction, index) => ({
      ...direction,
      kicker: "FOR THIS MOMENT",
      headline: index === 0 ? "A beautiful year awaits." : "Make this moment glow.",
      body: "A moment worth keeping for someone special.",
    })),
  });
  need(semanticCopyContractViolations(collapsed, recoveryBrief).includes("direction_copy_duplicate"), "collapsed_generic_trio_not_detected");
  markers.push("GENERIC_COLLAPSE_DETECTED=PASS");

  // User-supplied semantic inputs may legitimately contain detector vocabulary.
  for (const legitimateBrief of [
    brief({ occasion: "One Moment", recipient: "Glow", detail: "that one moment we shared" }),
    brief({ locale: "vi", occasion: "Kỷ niệm", recipient: "Ánh Glow", detail: "khoảnh khắc đẹp bên gia đình" }),
  ]) {
    const legitimate = buildDeterministicCreativeFallback(legitimateBrief, candidates);
    assertSemanticCopyContract(legitimate, legitimateBrief);
    need(semanticCopyContractViolations(legitimate, legitimateBrief).length === 0, "user_input_detector_false_positive");
  }
  markers.push("USER_INPUT_GENERIC_WORDS_SAFE=PASS");

  // Browser result surface must not reintroduce the static trio as an authority.
  const studio = readFileSync("apps/web/components/card-studio.tsx", "utf8");
  need(studio.includes("if(!generated?.presentation)return null"), "browser_result_authority_guard_missing");
  need(studio.includes("const resultBody=generated.body"), "browser_result_body_not_authoritative");
  need(!studio.includes("const resultBody=generated?.body??"), "browser_static_body_fallback_remains");
  markers.push("BROWSER_COPY_AUTHORITY=PASS");

  for (const marker of markers) console.log(marker);
  console.log("CORRECTIVE_COPY=PASS");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
