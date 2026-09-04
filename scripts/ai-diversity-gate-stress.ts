import { readFileSync } from "node:fs";
import {
  validateThreeDirectionDiversity,
  creativeQualityRisks,
  criticRepairDirections,
  generateCreativeDirectorDirections,
  resolveCandidateDiversityTargets,
  isVisualSiblingTrio,
  hasMateriallyDifferentAlternatives,
  type AIProvider,
  type AIProviderResponse,
} from "../packages/ai/src/index.ts";
import {
  portfolioV2AllTemplates,
  templateArchetype,
  templateCreativeRecipe,
  type RankedTemplate,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import { GenerationResultSchema, type GenerationBrief, type GenerationResult } from "../packages/card-schema/src/index.ts";

function need(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}

const briefNoPhoto: GenerationBrief = {
  locale: "en-US",
  format: "portrait-5x7",
  hasPhoto: false,
  market: "US",
  feeling: "Warm",
  occasion: "Birthday",
  relationship: "Friend",
  recipient: "Alex",
  detail: "",
};

function makeApprovedClone(src: TemplateMeta, overrides: Partial<TemplateMeta> = {}): TemplateMeta {
  return { ...src, status: "active", health: "healthy", launchStatus: "approved", ...overrides };
}

function ranked(t: TemplateMeta, score = 0.9): RankedTemplate {
  return {
    template: t,
    score,
    baseScore: score,
    marketScore: 0.8,
    reasons: ["fixture"],
    components: { relevance: 0.9, market: 0.8, editorial: 0.9, performance: 0.8, textFit: 1, freshness: 0.7, photoFit: 1, noveltyPenalty: 0 },
  };
}

function makeFakeProvider(data: unknown, providerName = "fake", modelName = "fake-model"): AIProvider {
  return {
    providerName,
    modelName,
    async generateJson(_input: { system: string; prompt: string; timeoutMs?: number }): Promise<AIProviderResponse> {
      return { data, provider: providerName, model: modelName, usage: { inputTokens: 10, outputTokens: 10 }, latencyMs: 1 };
    },
  };
}

// Canonical fixture templates from production portfolio
const srcEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial")!;
const srcMidnight = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume")!;
const srcLetterpress = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress")!;
const srcPhoto = portfolioV2AllTemplates.find(t => t.slug === "photo-story")!;
need(srcEditorial && srcMidnight && srcLetterpress && srcPhoto, "core_portfolio_templates_missing");

const approvedEditorial = makeApprovedClone(srcEditorial);
const approvedMidnight = makeApprovedClone(srcMidnight);
const approvedLetterpress = makeApprovedClone(srcLetterpress);
const approvedPhoto = makeApprovedClone(srcPhoto);

// Sibling templates: distinct IDs and families, but identical materialWorld ("editorial_luxury"), colorWorld ("ivory"), energy ("warm")
const siblingA = makeApprovedClone(srcEditorial, {
  id: "aaaaaaaa-0001-4000-8000-000000000001",
  versionId: "aaaaaaaa-0002-4000-8000-000000000001",
  familyId: "aaaaaaaa-0003-4000-8000-000000000001",
  name: "Ivory Luxury A",
  visualDirection: "editorial",
  materialWorld: "editorial_luxury",
  colorWorld: "ivory",
  energy: "warm",
});

const siblingB = makeApprovedClone(srcEditorial, {
  id: "bbbbbbbb-0001-4000-8000-000000000001",
  versionId: "bbbbbbbb-0002-4000-8000-000000000001",
  familyId: "bbbbbbbb-0003-4000-8000-000000000001",
  name: "Ivory Luxury B",
  visualDirection: "whispered",
  materialWorld: "editorial_luxury",
  colorWorld: "ivory",
  energy: "warm",
});

const siblingC = makeApprovedClone(srcEditorial, {
  id: "cccccccc-0001-4000-8000-000000000001",
  versionId: "cccccccc-0002-4000-8000-000000000001",
  familyId: "cccccccc-0003-4000-8000-000000000001",
  name: "Ivory Luxury C",
  visualDirection: "museum",
  materialWorld: "editorial_luxury",
  colorWorld: "ivory",
  energy: "warm",
});

// Editorial archetype variants: botanical and washi both resolve to archetype "editorial"
const editorialArchetypeB = makeApprovedClone(srcEditorial, {
  id: "dddddddd-0001-4000-8000-000000000001",
  versionId: "dddddddd-0002-4000-8000-000000000001",
  familyId: "dddddddd-0003-4000-8000-000000000001",
  name: "Botanical Editorial",
  visualDirection: "botanical",
  materialWorld: "letterpress_tactile",
  colorWorld: "sage",
  energy: "warm",
});

const editorialArchetypeC = makeApprovedClone(srcEditorial, {
  id: "eeeeeeee-0001-4000-8000-000000000001",
  versionId: "eeeeeeee-0002-4000-8000-000000000001",
  familyId: "eeeeeeee-0003-4000-8000-000000000001",
  name: "Washi Editorial",
  visualDirection: "washi",
  materialWorld: "quiet_modern",
  colorWorld: "warm",
  energy: "quiet",
});

// Full candidate pool with diversity alternatives
const fullCandidates: RankedTemplate[] = [
  ranked(approvedEditorial, 0.95),
  ranked(approvedMidnight, 0.92),
  ranked(approvedLetterpress, 0.89),
  ranked(siblingA, 0.88),
  ranked(siblingB, 0.87),
  ranked(siblingC, 0.86),
  ranked(editorialArchetypeB, 0.85),
  ranked(editorialArchetypeC, 0.84),
];

function makeDirection(
  slot: "editorial" | "midnight" | "quiet",
  t: TemplateMeta,
  thesis: string,
  sig = "recipient_anchor",
  kicker = "FOR THIS MOMENT",
  headline = "Something beautiful, just for you.",
  body = "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."
) {
  const recipe = templateCreativeRecipe(t);
  const signatureMove = recipe.signatureMoves.includes(sig as any) ? sig : recipe.signatureMoves[0];
  const accentMode = recipe.preferredAccents[0] ?? "original";
  return {
    id: slot,
    templateId: t.id,
    templateVersionId: t.versionId,
    templateName: t.name,
    visualDirection: t.visualDirection,
    photoMode: t.photoMode,
    creativeThesis: thesis,
    customerRationale: "A quiet, considered fit for this day.",
    signatureMove,
    accentMode,
    kicker,
    headline,
    body,
    confidence: 0.92,
    noveltyScore: 0.84,
    wowScore: 0.86,
    riskCodes: [] as any[],
  };
}

async function main() {
  // Static source guard assertions
  const aiSrc = readFileSync("packages/ai/src/index.ts", "utf8");
  need(aiSrc.includes("validateThreeDirectionDiversity"), "validateThreeDirectionDiversity_missing");
  need(aiSrc.includes("hasMateriallyDifferentAlternatives"), "hasMateriallyDifferentAlternatives_missing");
  need(aiSrc.includes("isVisualSiblingTrio"), "isVisualSiblingTrio_missing");
  need(aiSrc.includes("ai_template_exact_duplicate"), "ai_template_exact_duplicate_guard_missing");
  need(aiSrc.includes("ai_invalid_photo_direction"), "ai_invalid_photo_direction_guard_missing");
  need(!aiSrc.includes("while(true)"), "ai_has_unbounded_loop");
  need(aiSrc.includes("validateThreeDirectionDiversity(resolvedTargets)"), "anchor_resolvedTargets_missing");
  need(aiSrc.includes("validateThreeDirectionDiversity(resolvedInitial)"), "anchor_resolvedInitial_missing");
  need(aiSrc.includes("validateThreeDirectionDiversity(resolvedRepairs)"), "anchor_resolvedRepairs_missing");

  // ── CASE A: DUPLICATE_EXACT_IDENTITY=REJECTED ─────────────────────────────
  // 1. Direct contract validator rejects duplicate exact template identity
  let exactDupContractRejected = false;
  try {
    validateThreeDirectionDiversity([
      { templateId: "10000000-0000-4000-8000-000000000001", templateVersionId: "30000000-0000-4000-8000-000000000001", familyId: "fam-1", visualDirection: "editorial", photoMode: "none" },
      { templateId: "10000000-0000-4000-8000-000000000001", templateVersionId: "30000000-0000-4000-8000-000000000001", familyId: "fam-2", visualDirection: "midnight", photoMode: "none" },
      { templateId: "10000000-0000-4000-8000-000000000003", templateVersionId: "30000000-0000-4000-8000-000000000003", familyId: "fam-3", visualDirection: "quiet", photoMode: "none" },
    ]);
  } catch (err) {
    exactDupContractRejected = true;
    need((err as Error).message === "ai_template_exact_duplicate", `exact_dup_contract_wrong_error: ${(err as Error).message}`);
  }
  need(exactDupContractRejected, "exact_dup_contract_did_not_reject");

  // 2. Director selection parser rejects duplicate exact template identity
  let providerDupRejected = false;
  try {
    const dupDirs = [
      makeDirection("editorial", approvedEditorial, "A refined expression crafted with precision for this exact moment.", "recipient_anchor", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
      makeDirection("midnight", approvedEditorial, "A second direction with the identical template ID and version.", "recipient_anchor", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
      makeDirection("quiet", approvedLetterpress, "A contrasting tactile keepsake direction for this quiet day.", "recipient_anchor", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
    ];
    await generateCreativeDirectorDirections(
      makeFakeProvider({ action: "select", directions: dupDirs }),
      briefNoPhoto,
      fullCandidates
    );
  } catch (err) {
    providerDupRejected = true;
    need(
      (err as Error).message === "ai_template_exact_duplicate" || (err as Error).message === "ai_template_family_duplicate",
      `provider_dup_wrong_error: ${(err as Error).message}`
    );
  }
  need(providerDupRejected, "provider_dup_identity_did_not_reject");

  // 3. Critic repair rejects duplicate visual direction under legacy candidate context via legacy anchor
  let legacyMalformedRejected = false;
  try {
    const legacyMockCandidates: any[] = [
      { template: { id: "10000000-0000-4000-8000-000000000001", versionId: "30000000-0000-4000-8000-000000000001", familyId: "fam-1", visualDirection: "editorial", photoMode: "none", name: "T1" } },
      { template: { id: "10000000-0000-4000-8000-000000000002", versionId: "30000000-0000-4000-8000-000000000002", familyId: "fam-2", visualDirection: "editorial", photoMode: "none", name: "T2" } },
      { template: { id: "10000000-0000-4000-8000-000000000003", versionId: "30000000-0000-4000-8000-000000000003", familyId: "fam-3", visualDirection: "midnight", photoMode: "none", name: "T3" } },
    ];
    const legacyDirsResult: any = {
      directions: [
        { id: "editorial", templateId: "10000000-0000-4000-8000-000000000001", templateVersionId: "30000000-0000-4000-8000-000000000001", headline: "H1", body: "B1", kicker: "K1", confidence: 0.95, wowScore: 0.95, noveltyScore: 0.95, riskCodes: [] },
        { id: "midnight", templateId: "10000000-0000-4000-8000-000000000002", templateVersionId: "30000000-0000-4000-8000-000000000002", headline: "H2", body: "B2", kicker: "K2", confidence: 0.95, wowScore: 0.95, noveltyScore: 0.95, riskCodes: [] },
        { id: "quiet", templateId: "10000000-0000-4000-8000-000000000003", templateVersionId: "30000000-0000-4000-8000-000000000003", headline: "H3", body: "B3", kicker: "K3", confidence: 0.95, wowScore: 0.95, noveltyScore: 0.95, riskCodes: [] },
      ],
    };
    await criticRepairDirections(makeFakeProvider({}), briefNoPhoto, legacyDirsResult, legacyMockCandidates as any, []);
  } catch (err) {
    legacyMalformedRejected = true;
    need((err as Error).message === "ai_visual_direction_duplicate", `legacy_malformed_wrong_error: ${(err as Error).message}`);
  }
  need(legacyMalformedRejected, "legacy_malformed_did_not_reject");

  console.log("DUPLICATE_EXACT_IDENTITY=REJECTED");

  // ── CASE B: VISUAL_SIBLING_TRIO=DETECTED_OR_REPAIRED ──────────────────────
  // Sibling trio: SiblingA, SiblingB, SiblingC share materialWorld ("editorial_luxury"), colorWorld ("ivory"), energy ("warm"), signatureMove ("recipient_anchor")
  const siblingDirs = [
    makeDirection("editorial", siblingA, "A refined ivory expression crafted with quiet precision for this exact moment.", "recipient_anchor", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
    makeDirection("midnight", siblingB, "A whispered ivory interpretation holding space for warmth and gentle memories.", "recipient_anchor", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
    makeDirection("quiet", siblingC, "An archival ivory keepsake honoring the meaningful details and feelings that endure.", "recipient_anchor", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
  ];
  const siblingResult: GenerationResult = GenerationResultSchema.parse({ directions: siblingDirs });

  // 1. Detect sibling trio when alternatives exist in full candidate pool
  const targets = resolveCandidateDiversityTargets(siblingResult.directions, fullCandidates);
  need(isVisualSiblingTrio(targets), "isVisualSiblingTrio_failed_to_detect");
  need(hasMateriallyDifferentAlternatives(targets, fullCandidates, briefNoPhoto), "hasMateriallyDifferentAlternatives_should_be_true");

  const siblingRisks = creativeQualityRisks(siblingResult, briefNoPhoto, undefined, fullCandidates);
  need(siblingRisks.includes("creative_range"), "sibling_trio_did_not_add_creative_range_risk");

  // 2. Repair sibling trio via critic template swap
  // Critic swaps siblingC (slot quiet) for approvedMidnight (nocturne_foil, navy, cinematic)
  const criticRepairPayload = {
    repairs: [
      {
        id: "quiet",
        templateId: approvedMidnight.id,
        templateVersionId: approvedMidnight.versionId,
        creativeThesis: "A deep nocturne foil interpretation bringing cinematic contrast and gravitas.",
        customerRationale: "A richer, cinematic contrast for celebration.",
        signatureMove: "editorial_contrast",
        accentMode: "navy",
        kicker: "INTO THE NIGHT",
        headline: "A moment illuminated by stars.",
        body: "For everything this day brings and all the luminous beauty waiting ahead.",
        confidence: 0.94,
        noveltyScore: 0.88,
        wowScore: 0.90,
      },
    ],
  };

  const criticProvider = makeFakeProvider(criticRepairPayload);
  const repaired = await criticRepairDirections(criticProvider, briefNoPhoto, siblingResult, fullCandidates, siblingRisks);
  need(repaired.result.directions.length === 3, "repaired_direction_count_invalid");

  // Verify repaired trio no longer has creative_range
  const repairedRisks = creativeQualityRisks(repaired.result, briefNoPhoto, undefined, fullCandidates);
  need(!repairedRisks.includes("creative_range"), "repaired_result_still_has_creative_range");
  console.log("VISUAL_SIBLING_TRIO=DETECTED_OR_REPAIRED");

  // ── CASE C: SAME_ARCHETYPE_WEAK_RANGE=DETECTED_WHEN_FEASIBLE ───────────────
  // Three templates all resolving to archetype "editorial" (siblingA=editorial, editorialArchetypeB=botanical, editorialArchetypeC=washi)
  need(templateArchetype(siblingA) === "editorial", "siblingA_must_be_editorial");
  need(templateArchetype(editorialArchetypeB) === "editorial", "editorialArchetypeB_must_be_editorial");
  need(templateArchetype(editorialArchetypeC) === "editorial", "editorialArchetypeC_must_be_editorial");

  const sameArchDirs = [
    makeDirection("editorial", siblingA, "A refined editorial expression with personal warmth for this day.", "quiet_opening", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
    makeDirection("midnight", editorialArchetypeB, "A botanical editorial expression bringing organic grace and poise.", "recipient_anchor", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
    makeDirection("quiet", editorialArchetypeC, "A washi editorial expression honoring subtle texture and paper depth.", "editorial_contrast", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
  ];
  const sameArchResult: GenerationResult = GenerationResultSchema.parse({ directions: sameArchDirs });

  // Full candidate pool has alternatives with different archetypes (approvedMidnight = midnight, approvedLetterpress = quiet)
  const sameArchRisks = creativeQualityRisks(sameArchResult, briefNoPhoto, undefined, fullCandidates);
  need(sameArchRisks.includes("creative_range"), "same_archetype_weak_range_not_detected_when_feasible");
  console.log("SAME_ARCHETYPE_WEAK_RANGE=DETECTED_WHEN_FEASIBLE");

  // ── CASE D: INVALID_PHOTO_DIRECTION=REJECTED ──────────────────────────────
  // When brief has no photo, selecting a template with photoMode="required" or visualDirection="photo" is hard vetoed
  let invalidPhotoRejected = false;
  try {
    const photoDirs = [
      makeDirection("editorial", approvedEditorial, "A refined expression crafted with precision for this moment.", "recipient_anchor", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
      makeDirection("midnight", approvedMidnight, "A contrasting nocturne foil interpretation with warmth.", "editorial_contrast", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
      makeDirection("quiet", approvedPhoto, "An invalid photo requirement in a non-photo brief.", "keepsake_memory", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
    ];
    await generateCreativeDirectorDirections(
      makeFakeProvider({ action: "select", directions: photoDirs }),
      briefNoPhoto,
      [...fullCandidates, ranked(approvedPhoto)]
    );
  } catch (err) {
    invalidPhotoRejected = true;
    need((err as Error).message === "ai_invalid_photo_direction", `invalid_photo_wrong_error: ${(err as Error).message}`);
  }
  need(invalidPhotoRejected, "invalid_photo_direction_did_not_reject");
  console.log("INVALID_PHOTO_DIRECTION=REJECTED");

  // ── CASE E: SMALL_POOL_FEASIBILITY=PASS ────────────────────────────────────
  // When candidate pool is constrained (e.g. exactly 3 eligible templates that share one archetype),
  // no alternative exists. The real selection path (generateCreativeDirectorDirections) must respect
  // small pool feasibility instead of hard-failing with ai_direction_diversity_insufficient.
  const sameArchSmallPool: RankedTemplate[] = [
    ranked(siblingA, 0.95),
    ranked(editorialArchetypeB, 0.90),
    ranked(editorialArchetypeC, 0.85),
  ];
  need(templateArchetype(siblingA) === "editorial", "siblingA_must_be_editorial");
  need(templateArchetype(editorialArchetypeB) === "editorial", "editorialArchetypeB_must_be_editorial");
  need(templateArchetype(editorialArchetypeC) === "editorial", "editorialArchetypeC_must_be_editorial");

  const smallPoolOutcome = await generateCreativeDirectorDirections(
    makeFakeProvider({ action: "select", directions: sameArchDirs }),
    briefNoPhoto,
    sameArchSmallPool
  );
  need(smallPoolOutcome.kind === "ready", "small_pool_outcome_not_ready");
  need(smallPoolOutcome.result.directions.length === 3, "small_pool_not_three_directions");

  const smallPoolTargets = resolveCandidateDiversityTargets(smallPoolOutcome.result.directions, sameArchSmallPool);
  need(!hasMateriallyDifferentAlternatives(smallPoolTargets, sameArchSmallPool, briefNoPhoto), "small_pool_should_have_no_alternatives");

  const smallPoolRisks = creativeQualityRisks(smallPoolOutcome.result, briefNoPhoto, undefined, sameArchSmallPool);
  need(!smallPoolRisks.includes("creative_range"), "small_pool_falsely_penalized_with_creative_range");

  // Also ensure a one-visual-direction trio exercises selection and cannot be penalized when no alternative exists
  const oneVisualA = makeApprovedClone(srcEditorial, {
    id: "11111111-0001-4000-8000-000000000001",
    versionId: "11111111-0002-4000-8000-000000000001",
    familyId: "11111111-0003-4000-8000-000000000001",
    visualDirection: "editorial",
  });
  const oneVisualB = makeApprovedClone(srcEditorial, {
    id: "22222222-0001-4000-8000-000000000001",
    versionId: "22222222-0002-4000-8000-000000000001",
    familyId: "22222222-0003-4000-8000-000000000001",
    visualDirection: "editorial",
  });
  const oneVisualC = makeApprovedClone(srcEditorial, {
    id: "33333333-0001-4000-8000-000000000001",
    versionId: "33333333-0002-4000-8000-000000000001",
    familyId: "33333333-0003-4000-8000-000000000001",
    visualDirection: "editorial",
  });
  const oneVisualPool: RankedTemplate[] = [
    ranked(oneVisualA, 0.95),
    ranked(oneVisualB, 0.90),
    ranked(oneVisualC, 0.85),
  ];
  const oneVisualDirs = [
    makeDirection("editorial", oneVisualA, "A refined editorial expression crafted with quiet precision for this exact moment.", "recipient_anchor", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
    makeDirection("midnight", oneVisualB, "A second distinct editorial interpretation holding space for warmth and gentle memories.", "recipient_anchor", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
    makeDirection("quiet", oneVisualC, "A third distinct editorial keepsake honoring the meaningful details and feelings that endure.", "recipient_anchor", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
  ];
  const oneVisualOutcome = await generateCreativeDirectorDirections(
    makeFakeProvider({ action: "select", directions: oneVisualDirs }),
    briefNoPhoto,
    oneVisualPool
  );
  need(oneVisualOutcome.kind === "ready", "one_visual_outcome_not_ready");
  need(oneVisualOutcome.result.directions.length === 3, "one_visual_not_three_directions");
  const oneVisualRisks = creativeQualityRisks(oneVisualOutcome.result, briefNoPhoto, undefined, oneVisualPool);
  need(!oneVisualRisks.includes("creative_range"), "one_visual_trio_falsely_penalized_without_alternatives");

  console.log("SMALL_POOL_FEASIBILITY=PASS");

  // ── CASE F: STRONG_RELATED_TRIO=PASS ───────────────────────────────────────
  // A related trio sharing mood / energy ("warm") across all 3, but differing in presentation,
  // materialWorld ("editorial_luxury" vs "nocturne_foil" vs "letterpress_tactile"),
  // colorWorld ("ivory" vs "navy" vs "sage"), signatureMove and thesis.
  // This must PASS without being flagged for creative_range.
  const warmMidnight = makeApprovedClone(approvedMidnight, { energy: "warm", colorWorld: "navy" });
  const warmLetterpress = makeApprovedClone(approvedLetterpress, { energy: "warm", colorWorld: "sage" });
  const strongRelatedPool: RankedTemplate[] = [
    ranked(approvedEditorial),
    ranked(warmMidnight),
    ranked(warmLetterpress),
    ranked(siblingA),
    ranked(siblingB),
  ];

  const strongRelatedDirs = [
    makeDirection("editorial", approvedEditorial, "A refined ivory cotton expression with restrained foil illumination.", "editorial_contrast", "FOR THIS MOMENT", "Something beautiful, just for you.", "May this day feel as thoughtful, warm, and entirely yours as it truly deserves to be."),
    makeDirection("midnight", warmMidnight, "A warm nocturne foil interpretation bringing deep midnight presence.", "isolated_closing_line", "A LITTLE LIGHT", "Here is to what comes next.", "For everything this moment holds and all the good still waiting just ahead."),
    makeDirection("quiet", warmLetterpress, "A tactile debossed keepsake capturing the quiet human warmth of this day.", "quiet_opening", "MADE TO REMEMBER", "A moment worth keeping.", "A small keepsake for the details, feelings, and memories that make this day yours."),
  ];
  const strongRelatedResult: GenerationResult = GenerationResultSchema.parse({ directions: strongRelatedDirs });
  const strongTargets = resolveCandidateDiversityTargets(strongRelatedResult.directions, strongRelatedPool);
  need(!isVisualSiblingTrio(strongTargets), "strong_related_trio_falsely_classified_as_sibling");

  const strongRisks = creativeQualityRisks(strongRelatedResult, briefNoPhoto, undefined, strongRelatedPool);
  need(!strongRisks.includes("creative_range"), `strong_related_trio_flagged_with_risks: ${strongRisks.join(",")}`);
  console.log("STRONG_RELATED_TRIO=PASS");

  // ── FINAL GATE PASS ────────────────────────────────────────────────────────
  console.log("CUSTOMER_DIRECTION_DIVERSITY=PASS");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
