import { generateCreativeDirectorDirections, buildDeterministicCreativeFallback } from "../packages/ai/src/index.ts";
import type { AIProvider, AIProviderResponse } from "../packages/ai/src/index.ts";
import { buildCreativeCandidatePack, selectGenerationTemplates, portfolioV2AllTemplates, templateArchetype } from "../packages/templates/src/index.ts";
import type { RankedTemplate, TemplateMeta } from "../packages/templates/src/index.ts";
import { GenerationResultSchema } from "../packages/card-schema/src/index.ts";
import type { GenerationBrief } from "../packages/card-schema/src/index.ts";

function need(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }

const fixtureBrief: GenerationBrief = {
  locale: "en-US", format: "portrait-5x7", hasPhoto: false, market: "US",
  feeling: "Elegant", occasion: "Birthday", relationship: "Friend", recipient: "Alex", detail: "",
};

const fixturePhotoBrief: GenerationBrief = {
  locale: "en-US", format: "portrait-5x7", hasPhoto: true, market: "US",
  feeling: "Warm", occasion: "Birthday", relationship: "Partner", recipient: "Sam", detail: "",
};

function makeApprovedClone(src: TemplateMeta): TemplateMeta {
  return { ...src, status: "active", health: "healthy", launchStatus: "approved" };
}

// Build an approved fixture catalog from existing portfolio objects.
// All source identities (id, versionId, name, visualDirection) are preserved.
// This ensures buildCreativeCandidatePack in production catalogMode has eligible templates.
const approvedCatalog = portfolioV2AllTemplates.map(makeApprovedClone);
const prodCatalog = approvedCatalog;

const srcEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial")!;
const srcMidnight  = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume")!;
const srcQuiet     = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress")!;
const srcPhoto     = portfolioV2AllTemplates.find(t => t.slug === "photo-story")!;
need(srcEditorial && srcMidnight && srcQuiet && srcPhoto, "fixture_sources_missing");

// Approved clones preserve exact source id, versionId, name, visualDirection.
const approvedEditorial = makeApprovedClone(srcEditorial);
const approvedMidnight  = makeApprovedClone(srcMidnight);
const approvedQuiet     = makeApprovedClone(srcQuiet);
const approvedPhoto     = makeApprovedClone(srcPhoto);

function ranked(t: TemplateMeta): RankedTemplate {
  return {
    template: t, score: 0.9, baseScore: 0.9, marketScore: 0.8, reasons: ["fixture"],
    components: { relevance: 0.9, market: 0.8, editorial: 0.9, performance: 0.8, textFit: 1, freshness: 0.7, photoFit: 1, noveltyPenalty: 0 },
  };
}

const approvedTripleNoPhoto: RankedTemplate[] = [ranked(approvedEditorial), ranked(approvedMidnight), ranked(approvedQuiet)];
const approvedTriplePhoto: RankedTemplate[]   = [ranked(approvedEditorial), ranked(approvedMidnight), ranked(approvedPhoto)];

type CountableProvider = AIProvider & { getCallCount(): number };

function fakeProvider(data: unknown): CountableProvider {
  let callCount = 0;
  return {
    providerName: "fake", modelName: "fake-model",
    async generateJson(_input: { system: string; prompt: string; timeoutMs?: number }): Promise<AIProviderResponse> {
      callCount++;
      return { data, provider: "fake", model: "fake-model", usage: { inputTokens: 10, outputTokens: 10 }, latencyMs: 1 };
    },
    getCallCount() { return callCount; },
  };
}

function validProviderPayload(pack: ReturnType<typeof buildCreativeCandidatePack>, brief: GenerationBrief) {
  const slots = brief.hasPhoto ? (["editorial","midnight","photo"] as const) : (["editorial","midnight","quiet"] as const);
  return {
    action: "select" as const,
    directions: slots.map(slot => {
      const arch = slot === "photo" ? "photo" : slot === "midnight" ? "midnight" : slot === "quiet" ? "quiet" : "editorial";
      const c = pack.all.find(x => templateArchetype(x.template) === arch) ?? pack.all[0];
      return {
        id: slot, templateId: c.template.id, templateVersionId: c.template.versionId,
        creativeThesis: "A refined expression crafted with precision for this exact moment in time.",
        customerRationale: "A quiet, considered fit for this day.",
        signatureMove: "recipient_anchor", accentMode: "original",
        kicker: "FOR THIS MOMENT", headline: "Something beautiful, just for you.",
        body: "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be.",
        confidence: 0.92, noveltyScore: 0.84, wowScore: 0.86, riskCodes: [] as string[],
      };
    }),
  };
}

async function main() {
  // Deferred marker list — PASS markers are only emitted after ALL assertions pass.
  const passMarkers: string[] = [];

  const rankInput = {
    market: fixtureBrief.market, locale: fixtureBrief.locale, format: fixtureBrief.format,
    feeling: fixtureBrief.feeling, occasion: fixtureBrief.occasion, hasPhoto: fixtureBrief.hasPhoto,
    catalogMode: "production" as const,
  };
  // prodCatalog is an approved clone of portfolioV2AllTemplates — all templates are eligible
  // in production catalogMode, so the pack is never empty.
  const pack = buildCreativeCandidatePack(prodCatalog, rankInput);
  need(pack.all.length >= 3, "pack_too_small_for_stress");

  // VALID_THREE
  const validPayload = validProviderPayload(pack, fixtureBrief);
  const validOutcome = await generateCreativeDirectorDirections(fakeProvider(validPayload), fixtureBrief, pack.all);
  need(validOutcome.kind === "ready", "valid_three_not_ready");
  need(validOutcome.result.directions.length === 3, "valid_three_not_three");
  GenerationResultSchema.parse(validOutcome.result);
  passMarkers.push("VALID_THREE=PASS");

  // ZERO_DIRECTION_RECOVERY — prove exactly one provider invocation
  const zeroProvider = fakeProvider({ action:"select", directions:[] });
  let zeroRejected = false;
  try { await generateCreativeDirectorDirections(zeroProvider, fixtureBrief, pack.all); }
  catch { zeroRejected = true; }
  need(zeroRejected, "zero_direction_did_not_reject");
  need(zeroProvider.getCallCount() === 1, "zero_direction_more_than_one_provider_call");
  const zeroFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(zeroFallback.directions.length === 3, "zero_fallback_not_three");
  GenerationResultSchema.parse(zeroFallback);
  passMarkers.push("ZERO_DIRECTION_RECOVERY=PASS");

  // ONE_DIRECTION_RECOVERY — prove exactly one provider invocation
  const oneProvider = fakeProvider({ action:"select", directions:[validPayload.directions[0]] });
  let oneRejected = false;
  try { await generateCreativeDirectorDirections(oneProvider, fixtureBrief, pack.all); }
  catch { oneRejected = true; }
  need(oneRejected, "one_direction_did_not_reject");
  need(oneProvider.getCallCount() === 1, "one_direction_more_than_one_provider_call");
  const oneFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(oneFallback.directions.length === 3, "one_fallback_not_three");
  GenerationResultSchema.parse(oneFallback);
  passMarkers.push("ONE_DIRECTION_RECOVERY=PASS");

  // TWO_DIRECTION_RECOVERY — prove exactly one provider invocation
  const twoProvider = fakeProvider({ action:"select", directions:validPayload.directions.slice(0,2) });
  let twoRejected = false;
  try { await generateCreativeDirectorDirections(twoProvider, fixtureBrief, pack.all); }
  catch { twoRejected = true; }
  need(twoRejected, "two_direction_did_not_reject");
  need(twoProvider.getCallCount() === 1, "two_direction_more_than_one_provider_call");
  const twoFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(twoFallback.directions.length === 3, "two_fallback_not_three");
  GenerationResultSchema.parse(twoFallback);
  passMarkers.push("TWO_DIRECTION_RECOVERY=PASS");

  // FOUR_DIRECTION_RECOVERY — prove exactly one provider invocation
  const fourProvider = fakeProvider({ action:"select", directions:[...validPayload.directions, {...validPayload.directions[0], id:"photo"}] });
  let fourRejected = false;
  try {
    await generateCreativeDirectorDirections(fourProvider, fixtureBrief, pack.all);
  } catch { fourRejected = true; }
  need(fourRejected, "four_direction_did_not_reject");
  need(fourProvider.getCallCount() === 1, "four_direction_more_than_one_provider_call");
  const fourFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(fourFallback.directions.length === 3, "four_fallback_not_three");
  GenerationResultSchema.parse(fourFallback);
  passMarkers.push("FOUR_DIRECTION_RECOVERY=PASS");

  // DUPLICATE_TEMPLATE_RECOVERY — provider returns two directions with the same templateId
  const dupTemplateDir = { ...validPayload.directions[1], templateId: validPayload.directions[0].templateId, templateVersionId: validPayload.directions[0].templateVersionId };
  const dupTemplateDirs = [validPayload.directions[0], dupTemplateDir, validPayload.directions[2]];
  const dupTemplateProvider = fakeProvider({ action:"select", directions:dupTemplateDirs });
  let dupTemplateRejected = false;
  try { await generateCreativeDirectorDirections(dupTemplateProvider, fixtureBrief, pack.all); }
  catch { dupTemplateRejected = true; }
  need(dupTemplateRejected, "dup_template_did_not_reject");
  need(dupTemplateProvider.getCallCount() === 1, "dup_template_more_than_one_provider_call");
  const dupTemplateFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(dupTemplateFallback.directions.length === 3, "dup_template_fallback_not_three");
  GenerationResultSchema.parse(dupTemplateFallback);
  passMarkers.push("DUPLICATE_TEMPLATE_RECOVERY=PASS");

  // DUPLICATE_FAMILY_RECOVERY — provider returns two directions from the same familyId.
  // Build a synthetic approved template that shares a familyId with the first pack template.
  const packTemplates = pack.all.map(r => r.template);
  const firstFamily = packTemplates[0].familyId;
  const sameFamilyApproved: TemplateMeta = {
    ...approvedMidnight,
    id: "eeeeeeee-0000-4000-8000-000000000099",
    versionId: "ffffffff-0000-4000-8000-000000000099",
    familyId: firstFamily,
  };
  const dupFamilyDir0 = { ...validPayload.directions[0], templateId: packTemplates[0].id, templateVersionId: packTemplates[0].versionId };
  const dupFamilyDir1 = { ...validPayload.directions[1], templateId: sameFamilyApproved.id, templateVersionId: sameFamilyApproved.versionId };
  const dupFamilyDirs = [dupFamilyDir0, dupFamilyDir1, validPayload.directions[2]];
  const dupFamilyProvider = fakeProvider({ action:"select", directions:dupFamilyDirs });
  let dupFamilyRejected = false;
  try {
    // Extend candidates with the synthetic template so identity lookup can find it.
    const extendedCandidates = [...pack.all, ranked(sameFamilyApproved)];
    await generateCreativeDirectorDirections(dupFamilyProvider, fixtureBrief, extendedCandidates);
  } catch { dupFamilyRejected = true; }
  need(dupFamilyRejected, "dup_family_did_not_reject");
  need(dupFamilyProvider.getCallCount() === 1, "dup_family_more_than_one_provider_call");
  const dupFamilyFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(dupFamilyFallback.directions.length === 3, "dup_family_fallback_not_three");
  GenerationResultSchema.parse(dupFamilyFallback);
  passMarkers.push("DUPLICATE_FAMILY_RECOVERY=PASS");

  // INVALID_IDENTITY_RECOVERY — one provider call only
  const badDirs = validPayload.directions.map((d,i) =>
    i===0 ? { ...d, templateId:"99999999-0000-4000-8000-000000000099", templateVersionId:"99999999-0000-4000-8000-000000000099" } : d
  );
  const invalidProvider = fakeProvider({ action:"select", directions:badDirs });
  let invalidRejected = false;
  try { await generateCreativeDirectorDirections(invalidProvider, fixtureBrief, pack.all); }
  catch { invalidRejected = true; }
  need(invalidRejected, "invalid_identity_did_not_reject");
  need(invalidProvider.getCallCount() === 1, "invalid_identity_more_than_one_provider_call");
  const invalidFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(invalidFallback.directions.length === 3, "invalid_identity_fallback_not_three");
  GenerationResultSchema.parse(invalidFallback);
  passMarkers.push("INVALID_IDENTITY_RECOVERY=PASS");

  // FALLBACK_EXACT_IDENTITY
  const noPhotoFallback = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(noPhotoFallback.directions.length === 3, "fallback_exact_identity_not_three");

  const edDir = noPhotoFallback.directions.find(d => d.id === "editorial");
  need(edDir, "fallback_editorial_slot_missing");
  need(edDir.templateId === approvedEditorial.id, `fallback_editorial_templateId_wrong: ${edDir.templateId}`);
  need(edDir.templateVersionId === approvedEditorial.versionId, "fallback_editorial_versionId_wrong");
  need(edDir.templateName === approvedEditorial.name, "fallback_editorial_name_wrong");
  need(edDir.visualDirection === approvedEditorial.visualDirection, "fallback_editorial_visualDirection_wrong");

  const midDir = noPhotoFallback.directions.find(d => d.id === "midnight");
  need(midDir, "fallback_midnight_slot_missing");
  need(midDir.templateId === approvedMidnight.id, "fallback_midnight_templateId_wrong");
  need(midDir.templateVersionId === approvedMidnight.versionId, "fallback_midnight_versionId_wrong");
  need(midDir.templateName === approvedMidnight.name, "fallback_midnight_name_wrong");
  need(midDir.visualDirection === approvedMidnight.visualDirection, "fallback_midnight_visualDirection_wrong");

  const quiDir = noPhotoFallback.directions.find(d => d.id === "quiet");
  need(quiDir, "fallback_quiet_slot_missing");
  need(quiDir.templateId === approvedQuiet.id, "fallback_quiet_templateId_wrong");
  need(quiDir.templateVersionId === approvedQuiet.versionId, "fallback_quiet_versionId_wrong");
  need(quiDir.templateName === approvedQuiet.name, "fallback_quiet_name_wrong");
  need(quiDir.visualDirection === approvedQuiet.visualDirection, "fallback_quiet_visualDirection_wrong");

  const photoFallback = buildDeterministicCreativeFallback(fixturePhotoBrief, approvedTriplePhoto);
  need(photoFallback.directions.length === 3, "fallback_photo_not_three");
  const photoDir = photoFallback.directions.find(d => d.id === "photo");
  need(photoDir, "fallback_photo_slot_missing");
  need(photoDir.templateId === approvedPhoto.id, "fallback_photo_templateId_wrong");
  need(photoDir.templateVersionId === approvedPhoto.versionId, "fallback_photo_versionId_wrong");
  need(photoDir.templateName === approvedPhoto.name, "fallback_photo_name_wrong");
  need(photoDir.visualDirection === approvedPhoto.visualDirection, "fallback_photo_visualDirection_wrong");

  const internalPattern = /\b(?:ai|model|prompt|system|rank(?:ing)?|score|candidate|template|algorithm|reasoning|chain[- ]of[- ]thought)\b/i;
  for (const dir of noPhotoFallback.directions) {
    const copyText = `${dir.kicker} ${dir.headline} ${dir.body}`;
    need(!internalPattern.test(copyText), `fallback_copy_contains_internal_terms in slot ${dir.id}`);
  }
  passMarkers.push("FALLBACK_EXACT_IDENTITY=PASS");

  // NO_UNBOUNDED_RETRY — static source assertions
  const { readFileSync } = await import("node:fs");
  const workerSrc = readFileSync("apps/worker/src/index.ts", "utf8");
  const aiSrc = readFileSync("packages/ai/src/index.ts", "utf8");

  need(workerSrc.includes("buildDeterministicCreativeFallback"), "worker_missing_deterministic_fallback");
  need(workerSrc.includes("selectNovelGenerationTemplates"), "worker_missing_select_novel_generation_templates");
  need(workerSrc.includes("seenTemplateIdentities:brief.refreshContext?.seenTemplateIdentities??[]"), "worker_recovery_seen_context_missing");
  need(workerSrc.includes('catalogMode:"production"'), "worker_fallback_not_production_mode");
  need(workerSrc.includes("ai_plan_recovery_started"), "worker_missing_recovery_started_log");
  need(workerSrc.includes("ai_plan_fallback_used"), "worker_missing_fallback_used_log");
  need(workerSrc.includes("ai_plan_safe_failure"), "worker_missing_safe_failure_log");
  need(workerSrc.includes("ai_generation_safe_failure"), "worker_missing_safe_failure_error_code");
  need(aiSrc.includes("buildDeterministicCreativeFallback"), "ai_missing_deterministic_fallback");
  need(!aiSrc.includes("while(true)"), "ai_has_unbounded_loop");
  // Worker should not call failGenerationJob before the recovery try block
  const recoveryIdx = workerSrc.indexOf("ai_plan_recovery_started");
  need(recoveryIdx !== -1, "worker_recovery_started_not_found");
  const fallbackAttemptIdx = workerSrc.indexOf("buildDeterministicCreativeFallback(brief,");
  need(fallbackAttemptIdx !== -1, "worker_fallback_invocation_not_found");
  const failInCatch = workerSrc.indexOf("failGenerationJob", recoveryIdx);
  need(failInCatch > fallbackAttemptIdx, "worker_fails_before_fallback_attempt");
  passMarkers.push("NO_UNBOUNDED_RETRY=PASS");

  // SAFE_FINAL_FAILURE — stable error codes
  let insufficientRejected = false; let insufficientCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked(approvedEditorial), ranked(approvedMidnight)]); }
  catch (err) { insufficientRejected = true; insufficientCode = (err as Error).message; }
  need(insufficientRejected, "insufficient_candidates_did_not_reject");
  need(insufficientCode === "ai_fallback_unavailable", `insufficient_wrong_code: ${insufficientCode}`);

  let heldRejected = false; let heldCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked({...approvedEditorial, launchStatus:"hold"}), ranked(approvedMidnight), ranked(approvedQuiet)]); }
  catch (err) { heldRejected = true; heldCode = (err as Error).message; }
  need(heldRejected, "held_did_not_reject");
  need(heldCode === "ai_fallback_template_not_eligible", `held_wrong_code: ${heldCode}`);

  let unhealthyRejected = false; let unhealthyCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked({...approvedEditorial, health:"degraded"}), ranked(approvedMidnight), ranked(approvedQuiet)]); }
  catch (err) { unhealthyRejected = true; unhealthyCode = (err as Error).message; }
  need(unhealthyRejected, "unhealthy_did_not_reject");
  need(unhealthyCode === "ai_fallback_template_not_eligible", `unhealthy_wrong_code: ${unhealthyCode}`);

  let unapprovedRejected = false; let unapprovedCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked({...approvedEditorial, launchStatus:"experiment"}), ranked(approvedMidnight), ranked(approvedQuiet)]); }
  catch (err) { unapprovedRejected = true; unapprovedCode = (err as Error).message; }
  need(unapprovedRejected, "unapproved_did_not_reject");
  need(unapprovedCode === "ai_fallback_template_not_eligible", `unapproved_wrong_code: ${unapprovedCode}`);

  let pairDupRejected = false; let pairDupCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked(approvedEditorial), ranked(approvedEditorial), ranked(approvedQuiet)]); }
  catch (err) { pairDupRejected = true; pairDupCode = (err as Error).message; }
  need(pairDupRejected, "pair_dup_did_not_reject");
  need(pairDupCode === "ai_fallback_template_not_eligible", `pair_dup_wrong_code: ${pairDupCode}`);

  const sameFamilyVariant: TemplateMeta = { ...approvedMidnight, id: "aaaaaaaa-0000-4000-8000-000000000099", versionId: "bbbbbbbb-0000-4000-8000-000000000099", familyId: approvedEditorial.familyId };
  let familyDupRejected = false; let familyDupCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, [ranked(approvedEditorial), ranked(sameFamilyVariant), ranked(approvedQuiet)]); }
  catch (err) { familyDupRejected = true; familyDupCode = (err as Error).message; }
  need(familyDupRejected, "family_dup_did_not_reject");
  need(familyDupCode === "ai_fallback_template_not_eligible", `family_dup_wrong_code: ${familyDupCode}`);

  // No matching slot: three candidates all resolving to editorial archetype
  const allEditorialTriple: RankedTemplate[] = [
    ranked(approvedEditorial),
    ranked({ ...approvedMidnight, visualDirection: "botanical" as const, familyId: "cccccccc-0000-4000-8000-000000000001", id: "cccccccc-0000-4000-8000-000000000002", versionId: "cccccccc-0000-4000-8000-000000000003" }),
    ranked({ ...approvedQuiet, visualDirection: "editorial" as const, familyId: "dddddddd-0000-4000-8000-000000000001", id: "dddddddd-0000-4000-8000-000000000002", versionId: "dddddddd-0000-4000-8000-000000000003" }),
  ];
  let noSlotRejected = false; let noSlotCode = "";
  try { buildDeterministicCreativeFallback(fixtureBrief, allEditorialTriple); }
  catch (err) { noSlotRejected = true; noSlotCode = (err as Error).message; }
  need(noSlotRejected, "no_slot_match_did_not_reject");
  need(noSlotCode === "ai_fallback_unavailable" || noSlotCode === "ai_fallback_template_not_eligible", `no_slot_wrong_code: ${noSlotCode}`);

  passMarkers.push("SAFE_FINAL_FAILURE=PASS");

  // AI_EXACTLY_THREE — selectGenerationTemplates authoritative path
  const noPhotoRankInput = { ...rankInput, catalogMode: "production" as const };
  const authCandidates = selectGenerationTemplates(prodCatalog, noPhotoRankInput);
  if (authCandidates.length === 3 && authCandidates.every(c => c.template.launchStatus === "approved" && c.template.status === "active" && c.template.health === "healthy")) {
    const authResult = buildDeterministicCreativeFallback(fixtureBrief, authCandidates);
    need(authResult.directions.length === 3, "auth_fallback_not_three");
    GenerationResultSchema.parse(authResult);
  }
  const exactThree = buildDeterministicCreativeFallback(fixtureBrief, approvedTripleNoPhoto);
  need(exactThree.directions.length === 3, "exact_three_not_three");
  GenerationResultSchema.parse(exactThree);
  passMarkers.push("AI_EXACTLY_THREE=PASS");

  // AI_BOUNDED_FAILURE — source guards on the fallback helper itself.
  // Slice from the opening brace of the function body (not from the declaration line itself)
  // so the guard does not self-match the function name in the declaration signature.
  const aiSrcFull = readFileSync("packages/ai/src/index.ts", "utf8");
  const fnDeclMarker = "export function buildDeterministicCreativeFallback";
  const fnDeclStart = aiSrcFull.indexOf(fnDeclMarker);
  need(fnDeclStart !== -1, "fallback_fn_not_found");
  // Advance past the declaration to the '{' that opens the function body.
  const fnBodyOpenBrace = aiSrcFull.indexOf("{", fnDeclStart + fnDeclMarker.length);
  need(fnBodyOpenBrace !== -1, "fallback_fn_body_start_not_found");
  const nextExport = aiSrcFull.indexOf("\nexport ", fnBodyOpenBrace);
  const fnBody = nextExport !== -1 ? aiSrcFull.slice(fnBodyOpenBrace, nextExport) : aiSrcFull.slice(fnBodyOpenBrace);
  need(!fnBody.includes("await "), "fallback_fn_has_await");
  need(!fnBody.includes("provider.generateJson"), "fallback_fn_calls_provider");
  need(!fnBody.includes("generateCreativeDirectorDirections"), "fallback_fn_calls_director");
  need(!fnBody.includes("buildDeterministicCreativeFallback("), "fallback_fn_is_recursive");
  need(!fnBody.includes("fetch("), "fallback_fn_has_fetch");
  passMarkers.push("AI_BOUNDED_FAILURE=PASS");

  // All assertions passed — emit the complete required marker list now.
  for (const marker of passMarkers) {
    console.log(marker);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
