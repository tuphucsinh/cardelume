import assert from "node:assert/strict";
import {
  CardDocumentSchema,
  CanonicalPresentationSchema,
  PresentationLayoutProfileSchema,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CanonicalPresentation
} from "../packages/card-schema/src/index.ts";
import {
  portfolioV2AllTemplates,
  bootstrapTemplates,
  resolveCanonicalPresentation,
  resolveCanonicalPresentationFromTemplate,
  findManagedTemplateByIdAndVersion,
  assertCanonicalTemplateIdentity,
  templateLayoutProfile,
  type TemplateMeta
} from "../packages/templates/src/index.ts";
import {
  CURRENT_RENDERER_VERSION,
  renderSafeSvg,
  renderPreviewSvg,
  renderFinalSvg,
  renderProductionFinal
} from "../packages/renderer/src/index.ts";

function mustThrow(fn: () => unknown, expectedSubstring: string, msg: string) {
  let threw = false;
  try {
    fn();
  } catch (err: unknown) {
    threw = true;
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert.ok(
      errorMsg.includes(expectedSubstring),
      `${msg}: expected error to include '${expectedSubstring}', got '${errorMsg}'`
    );
  }
  assert.ok(threw, `${msg}: expected function to throw but it succeeded`);
}

async function main() {
  console.log("Running CANONICAL_PRESENTATION_CONTRACT stress suite...");

  // ============================================================================
  // 1. Schema Definition & Export Surface Verification
  // ============================================================================
  assert.ok(CanonicalPresentationSchema, "CanonicalPresentationSchema must be exported");
  assert.ok(PresentationLayoutProfileSchema, "PresentationLayoutProfileSchema must be exported");
  assert.equal(typeof assertCanonicalPresentationIdentity, "function");
  assert.equal(typeof assertCanonicalTemplateIdentity, "function");
  assert.equal(typeof resolveCanonicalPresentation, "function");
  assert.equal(typeof findManagedTemplateByIdAndVersion, "function");

  // ============================================================================
  // 2. Canonical Presentation Resolution & Exact Pair Preservation
  // ============================================================================
  const luxury = bootstrapTemplates.find(t => t.slug === "luxury-editorial");
  assert.ok(luxury, "luxury-editorial template must exist in catalog");

  const resolvedLuxury = resolveCanonicalPresentation({
    templateId: luxury.id,
    templateVersionId: luxury.versionId
  });

  // Mandatory exact pair
  assert.equal(resolvedLuxury.templateId, luxury.id, "templateId must match exact catalog id");
  assert.equal(resolvedLuxury.templateVersionId, luxury.versionId, "templateVersionId must match exact catalog versionId");
  assert.equal(resolvedLuxury.rendererTemplateKey, "luxury-editorial");
  assert.equal(resolvedLuxury.name, "Luxury Editorial");
  assert.equal(resolvedLuxury.material, "Cotton · Foil");
  assert.equal(resolvedLuxury.visualDirection, "editorial");
  assert.equal(resolvedLuxury.archetype, "editorial");
  assert.equal(resolvedLuxury.typographyId, "editorial-serif");
  assert.equal(resolvedLuxury.photoMode, "none");
  assert.equal(resolvedLuxury.photoSupported, false);
  assert.equal(resolvedLuxury.photoRequired, false);
  assert.ok(resolvedLuxury.layout, "layout profile must be present");
  assert.equal(resolvedLuxury.layout.anchor, "middle");

  // Schema round-trip preservation
  const luxuryParsed = CanonicalPresentationSchema.parse(resolvedLuxury);
  assert.deepEqual(luxuryParsed, resolvedLuxury, "direct schema parse must match resolved contract");

  const luxuryJson = JSON.stringify(resolvedLuxury);
  const luxuryRoundTrip = CanonicalPresentationSchema.parse(JSON.parse(luxuryJson));
  assert.equal(luxuryRoundTrip.templateId, luxury.id, "round-trip must preserve exact templateId");
  assert.equal(luxuryRoundTrip.templateVersionId, luxury.versionId, "round-trip must preserve exact templateVersionId");
  assert.deepEqual(luxuryRoundTrip, resolvedLuxury, "JSON serialization round-trip must preserve exact contract");

  // Verify across multiple archetypes in the portfolio
  const samples = [
    { slug: "midnight-lume", expectedArchetype: "midnight", expectedKey: "midnight-lume" },
    { slug: "photo-story", expectedArchetype: "photo", expectedKey: "photo-story" },
    { slug: "classic-letterpress", expectedArchetype: "quiet", expectedKey: "classic-letterpress" },
    { slug: "whispered-type", expectedArchetype: "quiet", expectedKey: "whispered-type" },
    { slug: "memory-window", expectedArchetype: "editorial", expectedKey: "memory-window" },
    { slug: "monogram-orbit", expectedArchetype: "editorial", expectedKey: "monogram-orbit" }
  ];

  for (const s of samples) {
    const tmpl = portfolioV2AllTemplates.find(t => t.slug === s.slug);
    assert.ok(tmpl, `sample template ${s.slug} must exist`);
    const resolved = resolveCanonicalPresentation({
      templateId: tmpl.id,
      templateVersionId: tmpl.versionId,
      hasPhoto: tmpl.photoMode === "required" ? true : undefined
    });
    assert.equal(resolved.templateId, tmpl.id);
    assert.equal(resolved.templateVersionId, tmpl.versionId);
    assert.equal(resolved.rendererTemplateKey, s.expectedKey);
    assert.equal(resolved.archetype, s.expectedArchetype);

    // Round-trip verification
    const rt = CanonicalPresentationSchema.parse(JSON.parse(JSON.stringify(resolved)));
    assert.equal(rt.templateId, tmpl.id);
    assert.equal(rt.templateVersionId, tmpl.versionId);
    assert.deepEqual(rt, resolved);
  }

  // ============================================================================
  // 3. Rejection of visualDirection Alone
  // ============================================================================
  mustThrow(
    () => resolveCanonicalPresentation({ visualDirection: "editorial" }),
    "invalid_presentation_identity",
    "visualDirection alone ('editorial') must be rejected"
  );
  mustThrow(
    () => resolveCanonicalPresentation({ visualDirection: "midnight" }),
    "invalid_presentation_identity",
    "visualDirection alone ('midnight') must be rejected"
  );
  mustThrow(
    () => resolveCanonicalPresentation({ visualDirection: "photo" }),
    "invalid_presentation_identity",
    "visualDirection alone ('photo') must be rejected"
  );
  mustThrow(
    () => resolveCanonicalPresentation({ visualDirection: "quiet" }),
    "invalid_presentation_identity",
    "visualDirection alone ('quiet') must be rejected"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ visualDirection: "editorial" }),
    "invalid_presentation_identity",
    "assertCanonicalPresentationIdentity must reject visualDirection alone"
  );
  mustThrow(
    () => assertCanonicalTemplateIdentity({ visualDirection: "editorial" }),
    "invalid_presentation_identity",
    "assertCanonicalTemplateIdentity must reject visualDirection alone"
  );

  // ============================================================================
  // 4. Rejection of Partial Identity
  // ============================================================================
  // Missing versionId
  mustThrow(
    () => resolveCanonicalPresentation({ templateId: luxury.id }),
    "partial_template_identity_rejected",
    "templateId without templateVersionId must be rejected"
  );
  // Missing templateId
  mustThrow(
    () => resolveCanonicalPresentation({ templateVersionId: luxury.versionId }),
    "partial_template_identity_rejected",
    "templateVersionId without templateId must be rejected"
  );
  // Neither
  mustThrow(
    () => resolveCanonicalPresentation({}),
    "missing_template_identity",
    "empty input must be rejected"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ templateId: luxury.id }),
    "partial_template_identity_rejected",
    "assertCanonicalPresentationIdentity partial templateId must be rejected"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ templateVersionId: luxury.versionId }),
    "partial_template_identity_rejected",
    "assertCanonicalPresentationIdentity partial templateVersionId must be rejected"
  );
  // Schema missing mandatory fields
  mustThrow(
    () => CanonicalPresentationSchema.parse({ ...resolvedLuxury, templateId: undefined }),
    "",
    "CanonicalPresentationSchema must reject missing templateId"
  );
  mustThrow(
    () => CanonicalPresentationSchema.parse({ ...resolvedLuxury, templateVersionId: undefined }),
    "",
    "CanonicalPresentationSchema must reject missing templateVersionId"
  );
  mustThrow(
    () => CanonicalPresentationSchema.parse({ ...resolvedLuxury, templateId: "not-a-uuid" }),
    "",
    "CanonicalPresentationSchema must reject non-UUID templateId"
  );

  // ============================================================================
  // 5. Rejection of Incompatible Template/Version Pair
  // ============================================================================
  const midnight = bootstrapTemplates.find(t => t.slug === "midnight-lume")!;
  assert.ok(midnight, "midnight-lume must exist");

  // Pair luxury templateId with midnight versionId
  mustThrow(
    () => resolveCanonicalPresentation({
      templateId: luxury.id,
      templateVersionId: midnight.versionId
    }),
    "incompatible_template_version_rejected",
    "mismatched templateId and templateVersionId must be rejected"
  );

  // Valid templateId with arbitrary non-existent version UUID
  mustThrow(
    () => resolveCanonicalPresentation({
      templateId: luxury.id,
      templateVersionId: "ffffffff-ffff-4fff-8fff-ffffffffffff"
    }),
    "incompatible_template_version_rejected",
    "templateId with unknown version UUID must be rejected"
  );

  // Unknown templateId UUID
  mustThrow(
    () => resolveCanonicalPresentation({
      templateId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      templateVersionId: luxury.versionId
    }),
    "template_not_found",
    "unknown templateId must be rejected"
  );

  // ============================================================================
  // 6. Photo Compatibility / State Validation
  // ============================================================================
  const photoStory = bootstrapTemplates.find(t => t.slug === "photo-story")!;
  assert.ok(photoStory, "photo-story must exist");

  // photo-story requires photo; rejecting if hasPhoto is explicitly false
  mustThrow(
    () => resolveCanonicalPresentation({
      templateId: photoStory.id,
      templateVersionId: photoStory.versionId,
      hasPhoto: false
    }),
    "template_photo_required",
    "photo-required template without photo must be rejected"
  );

  // photo-story with hasPhoto: true succeeds
  const resolvedPhotoStory = resolveCanonicalPresentation({
    templateId: photoStory.id,
    templateVersionId: photoStory.versionId,
    hasPhoto: true
  });
  assert.equal(resolvedPhotoStory.photoRequired, true);
  assert.equal(resolvedPhotoStory.photoSupported, true);

  // luxury-editorial does not support photo; rejecting if hasPhoto is true
  mustThrow(
    () => resolveCanonicalPresentation({
      templateId: luxury.id,
      templateVersionId: luxury.versionId,
      hasPhoto: true
    }),
    "template_photo_not_supported",
    "photo-none template with photo must be rejected"
  );

  // ============================================================================
  // 7. CardDocument Schema Round-Trip with CanonicalPresentation
  // ============================================================================
  const baseDoc: CardDocument = {
    schemaVersion: 1,
    templateVersion: `managed-${luxury.versionId}-v${luxury.version}`,
    rendererVersion: CURRENT_RENDERER_VERSION,
    marketPackVersion: "2026.08",
    id: "90000000-0000-4000-8000-000000000001",
    locale: "en",
    format: "portrait-5x7",
    templateId: "luxury-editorial",
    paletteId: "editorial-ivory",
    typographyId: "editorial-serif",
    artworkAssetIds: [],
    textBlocks: [
      { id: "kicker", role: "kicker", text: "TO SOMEONE SPECIAL", align: "center" },
      { id: "headline", role: "headline", text: "Happy Birthday", align: "center" },
      { id: "body", role: "body", text: "Wishing you a calm and wonderful day ahead.", align: "center" }
    ],
    metadata: { occasion: "Birthday", relationship: "Friend", feeling: "Warm" },
    presentation: resolvedLuxury
  };

  // Parsing doc with presentation
  const parsedDoc = CardDocumentSchema.parse(baseDoc);
  assert.ok(parsedDoc.presentation, "presentation must be preserved on CardDocument");
  assert.equal(parsedDoc.presentation.templateId, luxury.id);
  assert.equal(parsedDoc.presentation.templateVersionId, luxury.versionId);

  // JSON round-trip
  const docJson = JSON.stringify(baseDoc);
  const docRoundTrip = CardDocumentSchema.parse(JSON.parse(docJson));
  assert.ok(docRoundTrip.presentation, "presentation must survive JSON serialization round-trip");
  assert.equal(docRoundTrip.presentation.templateId, luxury.id);
  assert.equal(docRoundTrip.presentation.templateVersionId, luxury.versionId);
  assert.equal(docRoundTrip.presentation.rendererTemplateKey, "luxury-editorial");
  assert.deepEqual(docRoundTrip.presentation, resolvedLuxury);

  // Backward compatibility: CardDocument without presentation parses fine
  const legacyDoc: CardDocument = {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    rendererVersion: CURRENT_RENDERER_VERSION,
    marketPackVersion: "2026.08",
    id: "90000000-0000-4000-8000-000000000002",
    locale: "en",
    format: "portrait-5x7",
    templateId: "luxury-editorial",
    paletteId: "editorial-ivory",
    typographyId: "editorial-serif",
    artworkAssetIds: [],
    textBlocks: [
      { id: "kicker", role: "kicker", text: "FOR YOU", align: "center" },
      { id: "headline", role: "headline", text: "Thinking of You", align: "center" },
      { id: "body", role: "body", text: "Warmest thoughts on this quiet afternoon.", align: "center" }
    ],
    metadata: { occasion: "Other", relationship: "Friend", feeling: "Warm" }
  };
  const parsedLegacy = CardDocumentSchema.parse(legacyDoc);
  assert.equal(parsedLegacy.presentation, undefined, "legacy document without presentation remains valid");

  // Rejection if presentation template key does not match CardDocument templateId
  const badMismatchDoc = {
    ...baseDoc,
    templateId: "midnight-lume",
    presentation: resolvedLuxury // rendererTemplateKey is luxury-editorial
  };
  mustThrow(
    () => CardDocumentSchema.parse(badMismatchDoc),
    "presentation_template_key_mismatch",
    "mismatched presentation rendererTemplateKey and doc.templateId must fail refinement"
  );

  // ============================================================================
  // 8. Renderer Integration & Presentation Preservation
  // ============================================================================
  // 8a. renderSafeSvg with canonical presentation
  const svg = renderSafeSvg(baseDoc);
  assert.ok(svg.includes("<svg"), "renderSafeSvg must return valid SVG markup");
  assert.ok(svg.includes("Happy Birthday"), "rendered SVG must contain card copy");

  // 8b. Mismatched presentation in render options must fail
  mustThrow(
    () => renderSafeSvg(legacyDoc, { presentation: { ...resolvedLuxury, rendererTemplateKey: "midnight-lume" } }),
    "presentation_template_mismatch",
    "renderSafeSvg must reject mismatched presentation in options"
  );

  // 8c. renderProductionFinal with presentation preserves metadata & deterministic key
  const rasterizeStub = (svgContent: string, dims: { width: number; height: number; locale: string }) => {
    // 1x1 dummy PNG bytes sufficient for contract stress without running Resvg native bin
    const pngHeader = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196,
      137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0,
      5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68,
      174, 66, 96, 130
    ]);
    return pngHeader;
  };

  const finalResult = await renderProductionFinal(baseDoc, { rasterize: rasterizeStub });
  assert.ok(finalResult.metadata, "production metadata must be present");
  assert.ok(finalResult.metadata.presentation, "metadata must preserve canonical presentation");
  assert.equal(finalResult.metadata.presentation.templateId, luxury.id);
  assert.equal(finalResult.metadata.presentation.templateVersionId, luxury.versionId);
  assert.ok(
    finalResult.metadata.deterministicKey.includes(luxury.id),
    "deterministicKey must include templateId"
  );
  assert.ok(
    finalResult.metadata.deterministicKey.includes(luxury.versionId),
    "deterministicKey must include templateVersionId"
  );

  // 8d. Legacy doc without presentation still renders in production final
  const legacyFinal = await renderProductionFinal(legacyDoc, { rasterize: rasterizeStub });
  assert.equal(legacyFinal.metadata.presentation, undefined);
  assert.ok(legacyFinal.metadata.deterministicKey);

  // ============================================================================
  // 9. Status Completion
  // ============================================================================
  console.log("CANONICAL_PRESENTATION_CONTRACT=PASS");
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
