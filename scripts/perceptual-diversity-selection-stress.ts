import { readFileSync } from "node:fs";
import {
  buildCreativeCandidatePack,
  rankTemplates,
  selectGenerationTemplates,
  perceptualSimilarity,
  selectQualityAwareDiversifiedCandidates,
  portfolioV2AllTemplates,
  type RankedTemplate,
  type TemplateMeta,
} from "../packages/templates/src/index.ts";
import { buildDeterministicCreativeFallback } from "../packages/ai/src/index.ts";
import { GenerationResultSchema, type GenerationBrief } from "../packages/card-schema/src/index.ts";

function need(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const source = portfolioV2AllTemplates.find(t => t.slug === "luxury-editorial")!;
need(source, "source_template_missing");

const brief: GenerationBrief = {
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

function fixtureTemplate(
  id: string,
  name: string,
  visualDirection: TemplateMeta["visualDirection"],
  editorialScore: number,
  perceptual: Pick<TemplateMeta, "materialWorld" | "colorWorld" | "energy" | "motionProfile">
): TemplateMeta {
  const rendererTemplateKey: Record<TemplateMeta["visualDirection"], string> = {
    editorial: "luxury-editorial",
    midnight: "night-ledger",
    botanical: "botanical-poise",
    washi: "washi-elegance",
    seoul: "soft-seoul",
    deco: "art-deco-noir",
    photo: "photo-story",
    minimal: "quiet-minimal",
    watercolor: "watercolor-bloom",
    golden: "golden-hour",
    quietnoir: "quiet-noir",
    boldpop: "type-celebration",
    kawaii: "kawaii-joy",
    letterpress: "classic-letterpress",
    celestial: "celestial-night",
    gouache: "little-wonders",
    whispered: "whispered-type",
    museum: "museum-note",
    orbit: "monogram-orbit",
    ribbon: "ribbon-line",
    memory: "memory-window",
    typecelebration: "type-celebration",
    seal: "quiet-seal",
    pressed: "pressed-shadow",
    ink: "ink-pause",
    petal: "petal-geometry",
    ledger: "night-ledger",
    softfold: "soft-fold",
  };
  return {
    ...source,
    id: `aaaaaaaa-0000-4000-8000-${id.padStart(12, "0")}`,
    familyId: `bbbbbbbb-0000-4000-8000-${id.padStart(12, "0")}`,
    versionId: `cccccccc-0000-4000-8000-${id.padStart(12, "0")}`,
    version: 1,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    visualDirection,
    rendererTemplateKey: rendererTemplateKey[visualDirection],
    editorialScore,
    status: "active",
    health: "healthy",
    launchStatus: "approved",
    photoMode: "none",
    feelings: [{ key: "Warm", score: 1 }],
    occasions: [{ key: "Birthday", score: 1 }],
    markets: [{ key: "US", score: 1 }],
    excludedMarkets: [],
    materialCues: [
      ...(visualDirection === "editorial" || visualDirection === "midnight" || visualDirection === "minimal"
        ? ["hairline frame", "small ornament", "large whitespace"]
        : []),
      ...(visualDirection === "celestial" ? ["constellation foil", "night paper"] : []),
      ...(visualDirection === "orbit" || visualDirection === "museum" ? ["personal seal", "metallic point"] : []),
      ...(visualDirection === "boldpop" ? ["oversized type", "color field"] : []),
    ],
    ...perceptual,
  };
}

const nearCloneWorld = {
  materialWorld: "editorial_luxury" as const,
  colorWorld: "ivory" as const,
  energy: "warm" as const,
  motionProfile: "static_paper" as const,
};

const nearClones = [
  fixtureTemplate("1", "Ivory Editorial A", "editorial", 99, nearCloneWorld),
  fixtureTemplate("2", "Ivory Midnight B", "midnight", 98, nearCloneWorld),
  fixtureTemplate("3", "Ivory Minimal C", "minimal", 97, nearCloneWorld),
];

const distinctAlternatives = [
  fixtureTemplate("4", "Deep Navy Orbit", "celestial", 96, {
    materialWorld: "nocturne_foil",
    colorWorld: "navy",
    energy: "cinematic",
    motionProfile: "foil_light",
  }),
  fixtureTemplate("5", "Sage Museum Note", "museum", 95, {
    materialWorld: "personal_mark",
    colorWorld: "sage",
    energy: "personal",
    motionProfile: "personal_mark",
  }),
  fixtureTemplate("6", "Graphic Celebration", "boldpop", 94, {
    materialWorld: "celebration_energy",
    colorWorld: "soft_color",
    energy: "bold",
    motionProfile: "quiet_plane",
  }),
];

const catalog = [...nearClones, ...distinctAlternatives];
const rankInput = {
  market: brief.market,
  locale: brief.locale,
  format: brief.format,
  feeling: brief.feeling,
  occasion: brief.occasion,
  hasPhoto: brief.hasPhoto,
  catalogMode: "production" as const,
};

function ids(items: Array<{ template: TemplateMeta }>) {
  return items.map(item => item.template.id);
}

function names(items: Array<{ template: TemplateMeta }>) {
  return items.map(item => item.template.name);
}

function rankedAt(template: TemplateMeta, score: number): RankedTemplate {
  return {
    template,
    score,
    baseScore: score,
    marketScore: score,
    reasons: ["fixture"],
    components: {
      relevance: score,
      market: score,
      editorial: score,
      performance: score,
      textFit: 1,
      freshness: 1,
      photoFit: 1,
      noveltyPenalty: 0,
    },
  };
}

function isNearClone(id: string) {
  return nearClones.some(template => template.id === id);
}

async function main() {
  const ranked = rankTemplates(catalog, rankInput);
  need(ranked.length === 6, `candidate_pool_ranked_${ranked.length}`);
  const pack = buildCreativeCandidatePack(catalog, rankInput);
  need(pack.all.length === 6, `candidate_pack_${pack.all.length}`);
  need(pack.all.slice(0, 3).every(item => isNearClone(item.template.id)), "near_clone_fixture_not_top_ranked");
  console.log(`CANDIDATE_POOL=PASS count=${pack.all.length} top=${names(pack.all.slice(0, 3)).join(",")}`);

  // Test 1 — three near-clone top scores must not survive final selection together.
  const diversified = selectGenerationTemplates(catalog, rankInput);
  need(diversified.length === 3, `diversified_selection_count_${diversified.length}`);
  const selectedIds = ids(diversified);
  need(selectedIds.filter(isNearClone).length <= 1, `near_clone_trio_selected:${names(diversified).join(",")}`);
  need(new Set(selectedIds).size === 3, "diversified_selection_duplicate");
  need(new Set(diversified.map(item => item.template.familyId)).size === 3, "diversified_family_duplicate");
  console.log(`TEST1_NEAR_CLONE_TOP_SCORES=PASS selected=${names(diversified).join(",")}`);

  // Test 2 — clearly inferior alternatives must not be chosen only for visual contrast.
  const lowQualityAlternatives = distinctAlternatives.map((template, index) => ({
    ...template,
    editorialScore: 54 - index,
  }));
  const qualityProtected = selectGenerationTemplates([...nearClones, ...lowQualityAlternatives], rankInput);
  need(qualityProtected.length === 3, "quality_protected_selection_count");
  need(qualityProtected.every(item => !lowQualityAlternatives.some(t => t.id === item.template.id)), `quality_protection_failed:${names(qualityProtected).join(",")}`);
  console.log(`TEST2_QUALITY_PROTECTION=PASS selected=${names(qualityProtected).join(",")}`);

  // A materially better near-similar candidate must beat a clearly worse distant one.
  const qualityPrimary = selectQualityAwareDiversifiedCandidates([
    rankedAt(nearClones[0], .99),
    rankedAt(nearClones[1], .98),
    rankedAt(distinctAlternatives[0], .63),
  ], 2);
  need(qualityPrimary[1]?.template.id === nearClones[1].id, "quality_primary_overridden_by_diversity");
  console.log("TEST2B_QUALITY_PRIMARY=PASS");

  // Missing/partial metadata is neutral and must never produce NaN or an accidental extreme.
  const sparseA = { ...nearClones[0] } as Partial<TemplateMeta>;
  const sparseB = { ...nearClones[1] } as Partial<TemplateMeta>;
  delete sparseA.materialWorld;
  delete sparseA.materialCues;
  delete sparseA.colorWorld;
  delete sparseA.energy;
  delete sparseA.motionProfile;
  delete sparseB.materialWorld;
  delete sparseB.materialCues;
  delete sparseB.colorWorld;
  delete sparseB.energy;
  delete sparseB.motionProfile;
  const sparseSimilarity = perceptualSimilarity(rankedAt(sparseA as TemplateMeta, .9), rankedAt(sparseB as TemplateMeta, .89));
  need(Number.isFinite(sparseSimilarity) && sparseSimilarity >= 0 && sparseSimilarity <= 1, `sparse_similarity_out_of_bounds:${sparseSimilarity}`);
  need(sparseSimilarity > 0 && sparseSimilarity < 1, `sparse_similarity_not_neutral:${sparseSimilarity}`);
  console.log(`TEST2C_MISSING_METADATA=PASS similarity=${sparseSimilarity.toFixed(3)}`);

  // Test 3 — deterministic fallback must consume the same perceptually diversified trio.
  const fallback = buildDeterministicCreativeFallback(brief, diversified);
  GenerationResultSchema.parse(fallback);
  need(fallback.directions.length === 3, "fallback_direction_count");
  need(fallback.directions.filter(direction => isNearClone(direction.templateId)).length < 3, "fallback_near_clone_trio");
  for (const direction of fallback.directions) {
    const candidate = diversified.find(item => item.template.id === direction.templateId);
    need(candidate, `fallback_identity_missing:${direction.templateId}`);
    need(direction.templateVersionId === candidate.template.versionId, `fallback_version_mismatch:${direction.templateId}`);
    need(direction.templateName === candidate.template.name, `fallback_name_mismatch:${direction.templateId}`);
    need(direction.visualDirection === candidate.template.visualDirection, `fallback_visual_mismatch:${direction.templateId}`);
  }
  console.log(`TEST3_FALLBACK_PERCEPTUAL_DIVERSITY=PASS selected=${fallback.directions.map(direction => direction.templateName).join(",")}`);

  // Test 4 — same input and metadata must remain stable without random tie-breaking.
  const repeatA = selectGenerationTemplates(catalog, rankInput);
  const repeatB = selectGenerationTemplates(catalog, rankInput);
  need(JSON.stringify(ids(repeatA)) === JSON.stringify(ids(repeatB)), "selection_not_deterministic");
  need(JSON.stringify(names(repeatA)) === JSON.stringify(names(repeatB)), "selection_name_order_not_deterministic");
  console.log("TEST4_DETERMINISTIC_STABILITY=PASS");

  // Production seam wiring guard: the worker must invoke the shared final selector before AI.
  const worker = readFileSync(new URL("../apps/worker/src/index.ts", import.meta.url), "utf8");
  const initialSelectorIndex = worker.search(/selectQualityAwareDiversifiedCandidates\s*\(\s*pack\.all\s*,\s*3\s*,/);
  const initialDirectorIndex = worker.search(/generateCreativeDirectorDirections\s*\(\s*provider/);
  need(initialSelectorIndex >= 0, "worker_initial_final_selector_not_wired");
  need(initialDirectorIndex >= 0 && initialSelectorIndex < initialDirectorIndex, "worker_ai_before_final_selector");
  console.log("PRODUCTION_SELECTION_WIRING=PASS");

  console.log("INITIAL_GENERATE_PERCEPTUAL_DIVERSITY=PASS");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
