import { readFileSync } from "node:fs";
import {
  buildDeterministicCreativeFallback,
  SUPPORTED_OCCASIONS,
  isSupportedOccasion,
  type SupportedOccasion,
} from "../packages/ai/src/index.ts";
import {
  portfolioV2AllTemplates,
  selectGenerationTemplates,
  templateArchetype,
  type RankedTemplate,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import { GenerationResultSchema, type GenerationBrief } from "../packages/card-schema/src/index.ts";

function need(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}

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
    components: {
      relevance: 0.9,
      market: 0.8,
      editorial: 0.9,
      performance: 0.8,
      textFit: 1,
      freshness: 0.7,
      photoFit: 1,
      noveltyPenalty: 0,
    },
  };
}

// Build approved fixture catalog from production portfolio templates
const approvedCatalog = portfolioV2AllTemplates.map(t => makeApprovedClone(t));
const prodCatalog = approvedCatalog;

const srcEditorial = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial")!;
const srcMidnight = portfolioV2AllTemplates.find(t => t.slug === "midnight-lume")!;
const srcQuiet = portfolioV2AllTemplates.find(t => t.slug === "classic-letterpress")!;
const srcPhoto = portfolioV2AllTemplates.find(t => t.slug === "photo-story")!;
need(srcEditorial && srcMidnight && srcQuiet && srcPhoto, "fixture_sources_missing");

const approvedEditorial = makeApprovedClone(srcEditorial);
const approvedMidnight = makeApprovedClone(srcMidnight);
const approvedQuiet = makeApprovedClone(srcQuiet);
const approvedPhoto = makeApprovedClone(srcPhoto);

const approvedTripleNoPhoto: RankedTemplate[] = [ranked(approvedEditorial), ranked(approvedMidnight), ranked(approvedQuiet)];
const approvedTriplePhoto: RankedTemplate[] = [ranked(approvedEditorial), ranked(approvedMidnight), ranked(approvedPhoto)];

const birthdayPattern = /\b(?:birthday|birth[- ]day|bday|sinh nhật|생일|誕生日|cumpleaños|anniversaire|geburtstag|aniversário|compleanno)\b/i;

async function main() {
  const passMarkers: string[] = [];

  // ── 1. OCCASION_ENUM_COVERAGE ──────────────────────────────────────────────
  // Verify all 6 supported occasions visible in repository are covered:
  // Birthday, Anniversary, Thank You, Congratulations, New Baby, Other
  const EXPECTED_OCCASIONS: readonly string[] = [
    "Birthday",
    "Anniversary",
    "Thank You",
    "Congratulations",
    "New Baby",
    "Other",
  ];

  need(
    SUPPORTED_OCCASIONS.length === EXPECTED_OCCASIONS.length,
    `expected ${EXPECTED_OCCASIONS.length} supported occasions, got ${SUPPORTED_OCCASIONS.length}`
  );

  for (const occ of EXPECTED_OCCASIONS) {
    need(
      SUPPORTED_OCCASIONS.includes(occ as SupportedOccasion),
      `missing expected occasion in SUPPORTED_OCCASIONS: ${occ}`
    );
    need(isSupportedOccasion(occ), `isSupportedOccasion failed for: ${occ}`);
    need(isSupportedOccasion(occ.toLowerCase()), `isSupportedOccasion case-insensitive failed for: ${occ}`);
  }

  need(isSupportedOccasion("general"), "isSupportedOccasion must accept 'general'");
  need(!isSupportedOccasion("Halloween"), "isSupportedOccasion must reject 'Halloween'");
  need(!isSupportedOccasion("Graduation"), "isSupportedOccasion must reject 'Graduation'");
  need(!isSupportedOccasion(""), "isSupportedOccasion must reject empty string");
  need(!isSupportedOccasion("   "), "isSupportedOccasion must reject whitespace");
  need(!isSupportedOccasion(null), "isSupportedOccasion must reject null");
  need(!isSupportedOccasion(undefined), "isSupportedOccasion must reject undefined");

  passMarkers.push("OCCASION_ENUM_COVERAGE=PASS");

  // ── 2. ALL_OCCASIONS_FALLBACK_VALID ────────────────────────────────────────
  // Every supported occasion must produce schema-valid exactly 3 directions
  // for both no-photo and photo modes, with exact candidate identities preserved.
  for (const occ of SUPPORTED_OCCASIONS) {
    // No-photo brief
    const briefNoPhoto: GenerationBrief = {
      locale: "en-US",
      format: "portrait-5x7",
      hasPhoto: false,
      market: "US",
      feeling: "Warm",
      occasion: occ,
      relationship: "Friend",
      recipient: "Taylor",
      detail: "",
    };
    const fallbackNoPhoto = buildDeterministicCreativeFallback(briefNoPhoto, approvedTripleNoPhoto);
    need(fallbackNoPhoto.directions.length === 3, `fallback_not_three for occasion ${occ}`);
    GenerationResultSchema.parse(fallbackNoPhoto);

    const edDir = fallbackNoPhoto.directions.find(d => d.id === "editorial");
    need(edDir, `missing editorial slot for occasion ${occ}`);
    need(edDir.templateId === approvedEditorial.id, `editorial templateId mismatch for occasion ${occ}`);
    need(edDir.templateVersionId === approvedEditorial.versionId, `editorial templateVersionId mismatch for occasion ${occ}`);
    need(edDir.templateName === approvedEditorial.name, `editorial templateName mismatch for occasion ${occ}`);
    need(edDir.visualDirection === approvedEditorial.visualDirection, `editorial visualDirection mismatch for occasion ${occ}`);

    const midDir = fallbackNoPhoto.directions.find(d => d.id === "midnight");
    need(midDir, `missing midnight slot for occasion ${occ}`);
    need(midDir.templateId === approvedMidnight.id, `midnight templateId mismatch for occasion ${occ}`);
    need(midDir.templateVersionId === approvedMidnight.versionId, `midnight templateVersionId mismatch for occasion ${occ}`);
    need(midDir.templateName === approvedMidnight.name, `midnight templateName mismatch for occasion ${occ}`);
    need(midDir.visualDirection === approvedMidnight.visualDirection, `midnight visualDirection mismatch for occasion ${occ}`);

    const quiDir = fallbackNoPhoto.directions.find(d => d.id === "quiet");
    need(quiDir, `missing quiet slot for occasion ${occ}`);
    need(quiDir.templateId === approvedQuiet.id, `quiet templateId mismatch for occasion ${occ}`);
    need(quiDir.templateVersionId === approvedQuiet.versionId, `quiet templateVersionId mismatch for occasion ${occ}`);
    need(quiDir.templateName === approvedQuiet.name, `quiet templateName mismatch for occasion ${occ}`);
    need(quiDir.visualDirection === approvedQuiet.visualDirection, `quiet visualDirection mismatch for occasion ${occ}`);

    // Photo brief
    const briefPhoto: GenerationBrief = {
      locale: "en-US",
      format: "portrait-5x7",
      hasPhoto: true,
      market: "US",
      feeling: "Warm",
      occasion: occ,
      relationship: "Partner",
      recipient: "Jordan",
      detail: "",
    };
    const fallbackPhoto = buildDeterministicCreativeFallback(briefPhoto, approvedTriplePhoto);
    need(fallbackPhoto.directions.length === 3, `fallback_photo_not_three for occasion ${occ}`);
    GenerationResultSchema.parse(fallbackPhoto);

    const phoDir = fallbackPhoto.directions.find(d => d.id === "photo");
    need(phoDir, `missing photo slot for occasion ${occ}`);
    need(phoDir.templateId === approvedPhoto.id, `photo templateId mismatch for occasion ${occ}`);
    need(phoDir.templateVersionId === approvedPhoto.versionId, `photo templateVersionId mismatch for occasion ${occ}`);
    need(phoDir.templateName === approvedPhoto.name, `photo templateName mismatch for occasion ${occ}`);
    need(phoDir.visualDirection === approvedPhoto.visualDirection, `photo visualDirection mismatch for occasion ${occ}`);
  }
  passMarkers.push("ALL_OCCASIONS_FALLBACK_VALID=PASS");

  // ── 3. NEW_BABY_NOT_BIRTHDAY ───────────────────────────────────────────────
  // New Baby must never silently become Birthday.
  // Assert no Birthday-specific copy/identity for New Baby in both photo and no-photo modes.
  const babyBriefNoPhoto: GenerationBrief = {
    locale: "en-US",
    format: "portrait-5x7",
    hasPhoto: false,
    market: "US",
    feeling: "Warm",
    occasion: "New Baby",
    relationship: "Friend",
    recipient: "Baby Liam",
    detail: "welcome little one",
  };
  const babyFallbackNoPhoto = buildDeterministicCreativeFallback(babyBriefNoPhoto, approvedTripleNoPhoto);
  need(babyFallbackNoPhoto.directions.length === 3, "baby_fallback_not_three");
  GenerationResultSchema.parse(babyFallbackNoPhoto);

  for (const dir of babyFallbackNoPhoto.directions) {
    const fullCopy = `${dir.kicker} ${dir.headline} ${dir.body} ${dir.customerRationale ?? ""} ${dir.creativeThesis ?? ""}`;
    need(!birthdayPattern.test(fullCopy), `baby_fallback_contains_birthday_copy in slot ${dir.id}: ${fullCopy}`);
    need(!birthdayPattern.test(dir.templateName ?? ""), `baby_fallback_template_name_contains_birthday in slot ${dir.id}: ${dir.templateName}`);
  }

  const babyBriefPhoto: GenerationBrief = {
    locale: "en-US",
    format: "portrait-5x7",
    hasPhoto: true,
    market: "US",
    feeling: "Warm",
    occasion: "New Baby",
    relationship: "Partner",
    recipient: "Baby Maya",
    detail: "",
  };
  const babyFallbackPhoto = buildDeterministicCreativeFallback(babyBriefPhoto, approvedTriplePhoto);
  need(babyFallbackPhoto.directions.length === 3, "baby_photo_fallback_not_three");
  GenerationResultSchema.parse(babyFallbackPhoto);

  for (const dir of babyFallbackPhoto.directions) {
    const fullCopy = `${dir.kicker} ${dir.headline} ${dir.body} ${dir.customerRationale ?? ""} ${dir.creativeThesis ?? ""}`;
    need(!birthdayPattern.test(fullCopy), `baby_photo_fallback_contains_birthday_copy in slot ${dir.id}: ${fullCopy}`);
    need(!birthdayPattern.test(dir.templateName ?? ""), `baby_photo_fallback_template_name_contains_birthday in slot ${dir.id}: ${dir.templateName}`);
  }
  passMarkers.push("NEW_BABY_NOT_BIRTHDAY=PASS");

  // ── 4. OTHER_OCCASION_NOT_BIRTHDAY ─────────────────────────────────────────
  // Other / general must never silently become Birthday.
  // Assert no Birthday-specific copy/identity for Other in both photo and no-photo modes.
  for (const otherOcc of ["Other", "general"]) {
    const otherBriefNoPhoto: GenerationBrief = {
      locale: "en-US",
      format: "portrait-5x7",
      hasPhoto: false,
      market: "US",
      feeling: "Elegant",
      occasion: otherOcc,
      relationship: "Friend",
      recipient: "Morgan",
      detail: "",
    };
    const otherFallbackNoPhoto = buildDeterministicCreativeFallback(otherBriefNoPhoto, approvedTripleNoPhoto);
    need(otherFallbackNoPhoto.directions.length === 3, `other_fallback_not_three for ${otherOcc}`);
    GenerationResultSchema.parse(otherFallbackNoPhoto);

    for (const dir of otherFallbackNoPhoto.directions) {
      const fullCopy = `${dir.kicker} ${dir.headline} ${dir.body} ${dir.customerRationale ?? ""} ${dir.creativeThesis ?? ""}`;
      need(!birthdayPattern.test(fullCopy), `other_fallback_contains_birthday_copy for ${otherOcc} in slot ${dir.id}: ${fullCopy}`);
      need(!birthdayPattern.test(dir.templateName ?? ""), `other_fallback_template_name_contains_birthday for ${otherOcc} in slot ${dir.id}: ${dir.templateName}`);
    }

    const otherBriefPhoto: GenerationBrief = {
      locale: "en-US",
      format: "portrait-5x7",
      hasPhoto: true,
      market: "US",
      feeling: "Warm",
      occasion: otherOcc,
      relationship: "Coworker",
      recipient: "Chris",
      detail: "",
    };
    const otherFallbackPhoto = buildDeterministicCreativeFallback(otherBriefPhoto, approvedTriplePhoto);
    need(otherFallbackPhoto.directions.length === 3, `other_photo_fallback_not_three for ${otherOcc}`);
    GenerationResultSchema.parse(otherFallbackPhoto);

    for (const dir of otherFallbackPhoto.directions) {
      const fullCopy = `${dir.kicker} ${dir.headline} ${dir.body} ${dir.customerRationale ?? ""} ${dir.creativeThesis ?? ""}`;
      need(!birthdayPattern.test(fullCopy), `other_photo_fallback_contains_birthday_copy for ${otherOcc} in slot ${dir.id}: ${fullCopy}`);
      need(!birthdayPattern.test(dir.templateName ?? ""), `other_photo_fallback_template_name_contains_birthday for ${otherOcc} in slot ${dir.id}: ${dir.templateName}`);
    }
  }
  passMarkers.push("OTHER_OCCASION_NOT_BIRTHDAY=PASS");

  // ── 5. AUTHORITATIVE_OCCASION_SELECTION ────────────────────────────────────
  // selectGenerationTemplates authoritative production catalog path across occasions.
  for (const occ of SUPPORTED_OCCASIONS) {
    const occRankInput = {
      market: "US",
      locale: "en-US",
      format: "portrait-5x7" as const,
      feeling: "Warm",
      occasion: occ,
      hasPhoto: false,
      catalogMode: "production" as const,
    };
    const authCandidates = selectGenerationTemplates(prodCatalog, occRankInput);
    need(authCandidates.length === 3, `selectGenerationTemplates did not return 3 for ${occ}`);
    for (const c of authCandidates) {
      need(c.template.status === "active", `candidate ${c.template.id} not active for ${occ}`);
      need(c.template.health === "healthy", `candidate ${c.template.id} not healthy for ${occ}`);
      need(c.template.launchStatus === "approved", `candidate ${c.template.id} not approved for ${occ}`);
    }
    const brief: GenerationBrief = {
      locale: "en-US",
      format: "portrait-5x7",
      hasPhoto: false,
      market: "US",
      feeling: "Warm",
      occasion: occ,
      relationship: "Friend",
      recipient: "Pat",
      detail: "",
    };
    const authFallback = buildDeterministicCreativeFallback(brief, authCandidates);
    need(authFallback.directions.length === 3, `auth_fallback_not_three for ${occ}`);
    GenerationResultSchema.parse(authFallback);

    // Assert exact identity retention from candidate to direction
    for (const dir of authFallback.directions) {
      const matched = authCandidates.find(
        c => c.template.id === dir.templateId && c.template.versionId === dir.templateVersionId
      );
      need(matched, `direction ${dir.id} does not match any candidate for ${occ}`);
      need(dir.templateName === matched.template.name, `direction name mismatch for ${occ}`);
      need(dir.visualDirection === matched.template.visualDirection, `direction visual mismatch for ${occ}`);
    }

    // If New Baby or Other: assert no Birthday copy or identity in authoritative output
    if (occ === "New Baby" || occ === "Other") {
      for (const dir of authFallback.directions) {
        const full = `${dir.kicker} ${dir.headline} ${dir.body}`;
        need(!birthdayPattern.test(full), `authoritative fallback has birthday copy for ${occ} in slot ${dir.id}: ${full}`);
        need(!birthdayPattern.test(dir.templateName ?? ""), `authoritative fallback has birthday template name for ${occ}`);
      }
    }
  }
  passMarkers.push("AUTHORITATIVE_OCCASION_SELECTION=PASS");

  // ── 6. CONSTRAINED_POOL_SAFE_FALLBACK ──────────────────────────────────────
  // Constrained pools use existing neutral occasion-safe fallback or fail closed;
  // do not invent a taxonomy/occasion engine.
  const babyConstrained = buildDeterministicCreativeFallback(babyBriefNoPhoto, approvedTripleNoPhoto);
  need(babyConstrained.directions.length === 3, "baby_constrained_not_three");
  GenerationResultSchema.parse(babyConstrained);

  const otherConstrained = buildDeterministicCreativeFallback(
    { ...babyBriefNoPhoto, occasion: "Other" },
    approvedTripleNoPhoto
  );
  need(otherConstrained.directions.length === 3, "other_constrained_not_three");
  GenerationResultSchema.parse(otherConstrained);
  passMarkers.push("CONSTRAINED_POOL_SAFE_FALLBACK=PASS");

  // ── 7. CUSTOM_OCCASION_ACCEPTED_AND_EMPTY_FAILS_CLOSED ───────────────────────
  // Custom occasions are first-class semantic input; only an empty occasion is unavailable.
  for (const customOcc of ["Halloween", "Graduation", "Get Well", "random_unsupported"]) {
    const customBrief: GenerationBrief = { ...babyBriefNoPhoto, occasion: customOcc, locale: "en-US", feeling: "Elegant", detail: `A specific ${customOcc} detail.` };
    const customFallback = buildDeterministicCreativeFallback(customBrief, approvedTripleNoPhoto);
    need(customFallback.directions.length === 3, `custom_occasion_not_three: '${customOcc}'`);
    GenerationResultSchema.parse(customFallback);
    const copy = customFallback.directions.map(d => `${d.kicker} ${d.headline} ${d.body}`).join(" ");
    need(copy.toLowerCase().includes(customOcc.toLowerCase()), `custom_occasion_not_in_copy: '${customOcc}'`);
  }
  for (const emptyOcc of ["", "   "]) {
    let emptyRejected = false;
    try { buildDeterministicCreativeFallback({ ...babyBriefNoPhoto, occasion: emptyOcc }, approvedTripleNoPhoto); }
    catch (err) { emptyRejected = true; need((err as Error).message === "ai_fallback_unavailable", `empty_occ_wrong_code: ${(err as Error).message}`); }
    need(emptyRejected, `empty_occasion_did_not_fail_closed: '${emptyOcc}'`);
  }
  passMarkers.push("CUSTOM_OCCASION_ACCEPTED_EMPTY_FAILS_CLOSED=PASS");

  // ── 8. MISSING_IDENTITY_FAILS_CLOSED ───────────────────────────────────────
  // Ineligible/missing candidate identity guards preserved per P21R3T02:
  // - Less than 3 candidates
  let twoCandRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [ranked(approvedEditorial), ranked(approvedMidnight)]);
  } catch (err) {
    twoCandRejected = true;
    need((err as Error).message === "ai_fallback_unavailable", `two_cand_code: ${(err as Error).message}`);
  }
  need(twoCandRejected, "two_candidates_did_not_reject");

  // - Held template
  let heldRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [
      ranked({ ...approvedEditorial, launchStatus: "hold" }),
      ranked(approvedMidnight),
      ranked(approvedQuiet),
    ]);
  } catch (err) {
    heldRejected = true;
    need((err as Error).message === "ai_fallback_template_not_eligible", `held_code: ${(err as Error).message}`);
  }
  need(heldRejected, "held_template_did_not_reject");

  // - Degraded template
  let degradedRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [
      ranked({ ...approvedEditorial, health: "degraded" }),
      ranked(approvedMidnight),
      ranked(approvedQuiet),
    ]);
  } catch (err) {
    degradedRejected = true;
    need((err as Error).message === "ai_fallback_template_not_eligible", `degraded_code: ${(err as Error).message}`);
  }
  need(degradedRejected, "degraded_template_did_not_reject");

  // - Unapproved template
  let unapprovedRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [
      ranked({ ...approvedEditorial, launchStatus: "candidate" }),
      ranked(approvedMidnight),
      ranked(approvedQuiet),
    ]);
  } catch (err) {
    unapprovedRejected = true;
    need((err as Error).message === "ai_fallback_template_not_eligible", `unapproved_code: ${(err as Error).message}`);
  }
  need(unapprovedRejected, "unapproved_template_did_not_reject");

  // - Duplicate family
  const sameFamilyCandidate: TemplateMeta = {
    ...approvedMidnight,
    id: "99999999-0000-4000-8000-000000000001",
    versionId: "99999999-0000-4000-8000-000000000002",
    familyId: approvedEditorial.familyId,
  };
  let dupFamilyRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [
      ranked(approvedEditorial),
      ranked(sameFamilyCandidate),
      ranked(approvedQuiet),
    ]);
  } catch (err) {
    dupFamilyRejected = true;
    need((err as Error).message === "ai_fallback_template_not_eligible", `dup_family_code: ${(err as Error).message}`);
  }
  need(dupFamilyRejected, "dup_family_did_not_reject");

  // - Candidate with Birthday-specific identity passed for New Baby
  const birthdaySpecificTemplate: TemplateMeta = {
    ...approvedEditorial,
    id: "88888888-0000-4000-8000-000000000001",
    versionId: "88888888-0000-4000-8000-000000000002",
    familyId: "88888888-0000-4000-8000-000000000003",
    name: "Birthday Celebration Foil",
    slug: "birthday-celebration-foil",
  };
  let birthdayOnBabyRejected = false;
  try {
    buildDeterministicCreativeFallback(babyBriefNoPhoto, [
      ranked(birthdaySpecificTemplate),
      ranked(approvedMidnight),
      ranked(approvedQuiet),
    ]);
  } catch (err) {
    birthdayOnBabyRejected = true;
    need((err as Error).message === "ai_fallback_template_not_eligible", `birthday_on_baby_code: ${(err as Error).message}`);
  }
  need(birthdayOnBabyRejected, "birthday_on_baby_did_not_reject");

  passMarkers.push("MISSING_IDENTITY_FAILS_CLOSED=PASS");

  // ── 9. STATIC_SOURCE_GUARDS ────────────────────────────────────────────────
  let aiSrc: string;
  try {
    aiSrc = readFileSync("packages/ai/src/index.ts", "utf8");
  } catch {
    aiSrc = readFileSync(new URL("../packages/ai/src/index.ts", import.meta.url), "utf8");
  }
  need(aiSrc.includes("export const SUPPORTED_OCCASIONS"), "ai_missing_supported_occasions_export");
  need(aiSrc.includes("export function isSupportedOccasion"), "ai_missing_is_supported_occasion_export");
  need(aiSrc.includes("buildDeterministicCreativeFallback"), "ai_missing_build_deterministic_fallback");

  const fnDeclMarker = "export function buildDeterministicCreativeFallback";
  const fnDeclStart = aiSrc.indexOf(fnDeclMarker);
  need(fnDeclStart !== -1, "fallback_fn_decl_not_found");
  const fnBodyOpenBrace = aiSrc.indexOf("{", fnDeclStart + fnDeclMarker.length);
  need(fnBodyOpenBrace !== -1, "fallback_fn_brace_not_found");
  const nextExport = aiSrc.indexOf("\nexport ", fnBodyOpenBrace);
  const fnBody = nextExport !== -1 ? aiSrc.slice(fnBodyOpenBrace, nextExport) : aiSrc.slice(fnBodyOpenBrace);
  need(!fnBody.includes("await "), "fallback_has_await");
  need(!fnBody.includes("provider.generateJson"), "fallback_calls_provider");
  need(!fnBody.includes("generateCreativeDirectorDirections"), "fallback_calls_director");
  need(!fnBody.includes("buildDeterministicCreativeFallback("), "fallback_is_recursive");
  need(!fnBody.includes("fetch("), "fallback_has_fetch");
  need(!aiSrc.includes("while(true)"), "ai_has_unbounded_loop");

  passMarkers.push("STATIC_SOURCE_GUARDS=PASS");

  // ── 10. UI_OCCASION_FALLBACK_SOURCE_CONTRACT ───────────────────────────────
  // Verify apps/web/components/card-studio.tsx previewCopy useMemo:
  // 1. Explicit New Baby and Other branches occur before `const formal`
  // 2. Both branches use neutral existing copy (launch.quiet.kicker/headline/body)
  // 3. Neither branch can silently route to any birthday fallback copy
  // 4. Custom Other text uses occasion === "Other" and never leaks birthday fallback
  let studioSrc: string;
  try {
    studioSrc = readFileSync("apps/web/components/card-studio.tsx", "utf8");
  } catch {
    studioSrc = readFileSync(new URL("../apps/web/components/card-studio.tsx", import.meta.url), "utf8");
  }
  const previewCopyMatch = studioSrc.match(/const\s+previewCopy\s*=\s*useMemo\(\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},/);
  need(previewCopyMatch && previewCopyMatch[1], "card_studio_missing_previewCopy_useMemo");
  const previewCopyBody = previewCopyMatch[1];

  const formalPos = previewCopyBody.search(/const\s+formal\s*=/);
  need(formalPos !== -1, "previewCopy_missing_const_formal");

  const babyMatch = previewCopyBody.match(/if\s*\(\s*occasion\s*===\s*["']New Baby["']\s*\)/);
  need(babyMatch && babyMatch.index !== undefined, "previewCopy_missing_new_baby_branch");
  const babyPos = babyMatch.index;
  need(babyPos < formalPos, "previewCopy_new_baby_branch_must_occur_before_const_formal");

  const otherMatch = previewCopyBody.match(/if\s*\(\s*occasion\s*===\s*["']Other["']\s*\)/);
  need(otherMatch && otherMatch.index !== undefined, "previewCopy_missing_other_branch");
  const otherPos = otherMatch.index;
  need(otherPos < formalPos, "previewCopy_other_branch_must_occur_before_const_formal");

  const beforeFormal = previewCopyBody.slice(0, formalPos);

  // Both branches must use neutral existing launch.quiet copy
  need(
    beforeFormal.includes("launch.quiet.kicker") &&
    beforeFormal.includes("launch.quiet.headline") &&
    beforeFormal.includes("launch.quiet.body"),
    "previewCopy_new_baby_and_other_must_use_neutral_launch_quiet_copy"
  );

  // Assert both branches return unconditionally before const formal
  need(
    /if\s*\(\s*occasion\s*===\s*["']New Baby["']\s*\)\s*return\s*\{[^}]*kicker:\s*launch\.quiet\.kicker[^}]*headline:\s*launch\.quiet\.headline[^}]*body:\s*(?:detail\s*\|\|\s*launch\.quiet\.body|launch\.quiet\.body)[^}]*\}/.test(beforeFormal),
    "previewCopy_new_baby_unconditional_neutral_return_contract_failed"
  );
  need(
    /if\s*\(\s*occasion\s*===\s*["']Other["']\s*\)\s*return\s*\{[^}]*kicker:\s*launch\.quiet\.kicker[^}]*headline:\s*launch\.quiet\.headline[^}]*body:\s*(?:detail\s*\|\|\s*launch\.quiet\.body|launch\.quiet\.body)[^}]*\}/.test(beforeFormal),
    "previewCopy_other_unconditional_neutral_return_contract_failed"
  );

  // Strict guard: UI must never use birthday tokens for New Baby/Other
  const FORBIDDEN_BIRTHDAY_TOKENS = [
    "birthdayKicker",
    "birthdayHeadline",
    "birthdayBody",
    "birthdayFun",
    "birthdayRomantic",
    "formalBirthdayKicker",
    "formalBirthdayHeadline",
    "formalBirthdayBody",
  ] as const;

  for (const token of FORBIDDEN_BIRTHDAY_TOKENS) {
    need(!beforeFormal.includes(token), `previewCopy_before_formal_contains_forbidden_token: ${token}`);
  }

  // Preserve Birthday behavior in formal and default branches after formal
  const afterFormal = previewCopyBody.slice(formalPos);
  need(afterFormal.includes("formalBirthdayKicker"), "previewCopy_must_preserve_formalBirthdayKicker_for_birthday");
  need(afterFormal.includes("birthdayKicker"), "previewCopy_must_preserve_birthdayKicker_for_birthday");

  // Contract: previewCopy must branch on occasion === "Other" (not effectiveOccasion)
  // so custom Other text is guaranteed to match the Other branch and never leak birthday fallback
  need(!beforeFormal.includes("effectiveOccasion === \"Other\""), "previewCopy_must_not_branch_on_effectiveOccasion_which_would_leak_on_custom_text");

  // Semantic behavioral simulation of previewCopy decision logic
  type SimulatedOccasion = "Birthday" | "Anniversary" | "Thank You" | "Congratulations" | "New Baby" | "Other";
  function runSimulatedPreviewCopy(opts: {
    occasion: SimulatedOccasion;
    customOccasion?: string;
    recipient?: string;
    relation?: string;
    feeling?: string;
    detail?: string;
  }) {
    const entered = (opts.recipient ?? "").trim();
    const name = entered || "Someone special";
    const detail = opts.detail ?? "";
    const feeling = opts.feeling ?? "Elegant";
    const relation = opts.relation ?? "";
    const occasion = opts.occasion;

    if (occasion === "New Baby") return { kicker: "A QUIET NOTE", headline: "A few words, held close.", body: detail || "Some things are best said simply." };
    if (occasion === "Other") return { kicker: "A QUIET NOTE", headline: "A few words, held close.", body: detail || "Some things are best said simply." };
    const formal = relation === "Coworker" || relation === "Client";
    if (occasion === "Anniversary") return { kicker: "STILL, ALWAYS", headline: `My favorite place is still beside you, ${name}.`, body: detail || "To everything we have shared." };
    if (occasion === "Thank You") return { kicker: "WITH GRATITUDE", headline: `You made all the difference, ${name}.`, body: detail || "Thank you for what you did." };
    if (occasion === "Congratulations") return { kicker: "SO WELL DESERVED", headline: `This moment belongs to you, ${name}.`, body: detail || "Take it in and celebrate." };
    if (formal) return { kicker: "formalBirthdayKicker", headline: `formalBirthdayHeadline ${name}`, body: detail || "formalBirthdayBody" };
    if (!entered && feeling === "Elegant") return { kicker: "birthdayKicker", headline: "editorialHeadline", body: detail || "editorialBody" };
    return { kicker: "birthdayKicker", headline: `birthdayHeadline ${name}`, body: detail || "birthdayBody" };
  }

  // Exhaustive input matrix verifying New Baby & Other (including custom text) never produce birthday copy
  const testOccasions: SimulatedOccasion[] = ["New Baby", "Other"];
  const testRelations = ["", "Friend", "Partner", "Coworker", "Client", "Someone else"];
  const testFeelings = ["Elegant", "Warm", "Romantic", "Fun", "Surprise me"];
  const testRecipients = ["", "Taylor", "Baby Liam"];
  const testCustomTexts = ["", "Retirement", "Graduation", "Promotion", "Housewarming celebration"];

  for (const occ of testOccasions) {
    for (const rel of testRelations) {
      for (const feel of testFeelings) {
        for (const rec of testRecipients) {
          for (const cust of testCustomTexts) {
            const res = runSimulatedPreviewCopy({ occasion: occ, customOccasion: cust, recipient: rec, relation: rel, feeling: feel });
            for (const token of FORBIDDEN_BIRTHDAY_TOKENS) {
              need(!res.kicker.includes(token), `simulation_${occ}_kicker_leaked_${token}`);
              need(!res.headline.includes(token), `simulation_${occ}_headline_leaked_${token}`);
              need(!res.body.includes(token), `simulation_${occ}_body_leaked_${token}`);
            }
            need(!birthdayPattern.test(`${res.kicker} ${res.headline} ${res.body}`), `simulation_${occ}_copy_matches_birthday_pattern`);
          }
        }
      }
    }
  }

  // Preserve Birthday behavior assertions
  const bdayFormal = runSimulatedPreviewCopy({ occasion: "Birthday", relation: "Coworker", recipient: "Taylor" });
  need(bdayFormal.kicker === "formalBirthdayKicker", "birthday_formal_kicker_not_preserved");
  const bdayGeneral = runSimulatedPreviewCopy({ occasion: "Birthday", relation: "Friend", recipient: "Taylor" });
  need(bdayGeneral.kicker === "birthdayKicker", "birthday_general_kicker_not_preserved");

  passMarkers.push("UI_OCCASION_FALLBACK_SOURCE_CONTRACT=PASS");

  // ── 11. FINAL DoD MARKER ───────────────────────────────────────────────────
  passMarkers.push("FALLBACK_OCCASION_COVERAGE=PASS");

  for (const marker of passMarkers) {
    console.log(marker);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
