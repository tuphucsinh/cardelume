import { readFileSync } from "node:fs";
import {
  MockAIProvider,
  buildDeterministicCreativeFallback,
  generateCreativeDirectorDirections,
  semanticCustomerRationale,
  type AIProvider,
} from "../packages/ai/src/index.ts";
import { type GenerationBrief, type GenerationResult } from "../packages/card-schema/src/index.ts";
import { portfolioV2AllTemplates, type RankedTemplate, type TemplateMeta } from "../packages/templates/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function approved(template: TemplateMeta): TemplateMeta { return { ...template, status: "active", health: "healthy", launchStatus: "approved" }; }
function ranked(template: TemplateMeta): RankedTemplate {
  return { template, score: .9, baseScore: .9, marketScore: .8, reasons: ["rationale-fixture"], components: { relevance: .9, market: .8, editorial: .9, performance: .8, textFit: 1, freshness: .7, photoFit: 1, noveltyPenalty: 0 } };
}
const source = ["luxury-editorial", "midnight-lume", "classic-letterpress"].map(slug => portfolioV2AllTemplates.find(t => t.slug === slug));
need(source.every(Boolean), "rationale_fixture_templates_missing");
const candidates = source.map(template => ranked(approved(template!)));
function brief(overrides: Partial<GenerationBrief> = {}): GenerationBrief {
  return { locale: "en-US", format: "portrait-5x7", hasPhoto: false, market: "GLOBAL", occasion: "Graduation", relationship: "Friend", feeling: "Warm", recipient: "Linh", detail: "the blue notebook from her final semester", ...overrides };
}
function rationales(result: GenerationResult) { return result.directions.map(direction => direction.customerRationale ?? ""); }
function noForbidden(text: string) { return !/\b(?:ai|model|prompt|system|rank(?:ing)?|score|candidate|template|material|algorithm|reasoning)\b|https?:\/\/|\d+(?:\.\d+)?%/i.test(text); }

async function main() {
  const markers: string[] = [];
  for (const [locale, occasion, feeling] of [["en-US", "Anniversary", "Romantic"], ["vi", "Graduation", "Warm"], ["en-US", "Get Well", "Elegant"]] as const) {
    const current = brief({ locale, occasion, feeling });
    const rationale = semanticCustomerRationale(current, 0);
    need(rationale.length >= 12 && noForbidden(rationale), `semantic_rationale_invalid:${locale}:${occasion}`);
    need(/anniversary|graduation|get well|kỷ niệm|graduation|dịp/i.test(rationale), `semantic_rationale_missing_occasion:${locale}:${occasion}`);
    need(/romantic|intimate|warm|elegant|refined|lãng mạn|ấm áp|thanh lịch/i.test(rationale), `semantic_rationale_missing_feeling:${locale}:${feeling}`);
  }
  markers.push("SEMANTIC_EN_VI_RATIONALE=PASS");

  const fallbackBrief = brief({ locale: "vi", occasion: "Get Well", feeling: "Warm", relationship: "Mom", recipient: "An" });
  const fallback = buildDeterministicCreativeFallback(fallbackBrief, candidates);
  need(rationales(fallback).every(value => value && noForbidden(value)), "fallback_rationale_missing_or_unsafe");
  need(rationales(fallback).some(value => /Get Well|dịp/i.test(value)) && rationales(fallback).some(value => /Warm|ấm áp/i.test(value)), "fallback_rationale_not_brief_grounded");
  markers.push("DETERMINISTIC_FALLBACK_RATIONALE=PASS");

  const base = new MockAIProvider();
  const invalidProvider: AIProvider = {
    providerName: "invalid-rationale-fixture", modelName: "fixture",
    async generateJson(input) {
      const response = await base.generateJson(input);
      const payload = response.data as { directions: Array<Record<string, unknown>> };
      return { ...response, data: { ...payload, directions: payload.directions.map(direction => ({ ...direction, customerRationale: "Model score 93% using cotton material" })) } };
    },
  };
  const invalidBrief = brief({ locale: "en-US", occasion: "Anniversary", feeling: "Romantic" });
  const result = await generateCreativeDirectorDirections(invalidProvider, invalidBrief, candidates);
  need(result.kind === "ready", "invalid_rationale_provider_not_recovered");
  need(rationales(result.result).every(value => value && noForbidden(value)), "invalid_provider_rationale_leaked");
  need(rationales(result.result).some(value => /anniversary/i.test(value)) && rationales(result.result).some(value => /romantic|intimate/i.test(value)), "invalid_provider_rationale_not_semantic_fallback");
  markers.push("INVALID_PROVIDER_RATIONALE_SANITIZED=PASS");

  const studio = readFileSync("apps/web/components/card-studio.tsx", "utf8");
  need(studio.includes("semanticRationaleFallback"), "browser_semantic_rationale_fallback_missing");
  need(!studio.includes("display.material||previewCopy.kicker"), "material_or_preview_copy_used_as_rationale");
  need(studio.includes("data-customer-rationale"), "selected_rationale_not_carried_to_finish");
  markers.push("BROWSER_RATIONALE_AUTHORITY=PASS");
  for (const marker of markers) console.log(marker);
  console.log("CORRECTIVE_RATIONALE=PASS");
}
main().catch(error => { console.error(error); process.exitCode = 1; });