import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CardDocumentSchema,
  CheckoutCardSnapshotSchema,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CheckoutCardSnapshot
} from "../packages/card-schema/src/index.ts";
import {
  portfolioV2AllTemplates,
  bootstrapTemplates,
  curatedFallbackPresentations,
  resolveCuratedFallbackPresentation,
  resolveCanonicalPresentation,
  findManagedTemplateByIdAndVersion,
  type TemplateMeta
} from "../packages/templates/src/index.ts";
import { resolveCustomerStyleDisplay } from "../apps/web/i18n/display-copy.ts";
import { buildCheckoutCardDocument } from "../apps/web/lib/checkout-card-core.ts";

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
  console.log("Running TEMPLATE_LABEL_IDENTITY stress suite (P21R1T02)...");

  // ============================================================================
  // 1. Slot ID Separation from Style Identity (Adversarial Mismatch Tests)
  // ============================================================================
  const luxury = bootstrapTemplates.find(t => t.slug === "luxury-editorial")!;
  const midnight = bootstrapTemplates.find(t => t.slug === "midnight-lume")!;
  const museum = portfolioV2AllTemplates.find(t => t.slug === "museum-note")!;
  const letterpress = bootstrapTemplates.find(t => t.slug === "classic-letterpress")!;

  assert.ok(luxury, "luxury-editorial must exist");
  assert.ok(midnight, "midnight-lume must exist");
  assert.ok(museum, "museum-note must exist");
  assert.ok(letterpress, "classic-letterpress must exist");

  // Case 1A: Slot 'midnight' paired with 'Museum Note' (non-midnight template)
  const museumDisplay = resolveCustomerStyleDisplay({
    locale: "en",
    templateName: museum.name,
    material: museum.material,
    slotIndex: 1 // slot 1 corresponds to midnight routing slot
  });
  assert.equal(museumDisplay.name, "Museum Note", "slot 'midnight' with Museum Note must display 'Museum Note'");
  assert.equal(museumDisplay.material, "Editorial · Rule grid", "slot 'midnight' with Museum Note must display Museum Note material");
  assert.notEqual(museumDisplay.name, "Midnight Lume", "slot 'midnight' must NEVER force 'Midnight Lume'");
  assert.notEqual(museumDisplay.material, "Navy · Foil", "slot 'midnight' must NEVER force 'Navy · Foil'");

  // Case 1B: Slot 'midnight' paired with 'Luxury Editorial'
  const luxuryInMidnightSlot = resolveCustomerStyleDisplay({
    locale: "en",
    templateName: luxury.name,
    material: luxury.material,
    slotIndex: 1
  });
  assert.equal(luxuryInMidnightSlot.name, "Luxury Editorial");
  assert.equal(luxuryInMidnightSlot.material, "Cotton · Foil");
  assert.notEqual(luxuryInMidnightSlot.name, "Midnight Lume");

  // Case 1C: Japanese locale localization of non-midnight template in midnight slot
  const luxuryJaInMidnightSlot = resolveCustomerStyleDisplay({
    locale: "ja",
    templateName: luxury.name,
    material: luxury.material,
    slotIndex: 1
  });
  assert.equal(luxuryJaInMidnightSlot.name, "上質なエディトリアル", "Japanese display must localize Luxury Editorial");
  assert.notEqual(luxuryJaInMidnightSlot.name, "ミッドナイト・リューム", "must not show Japanese Midnight Lume");

  // Case 1D: Slot 'midnight' genuinely paired with 'Midnight Lume'
  const genuineMidnight = resolveCustomerStyleDisplay({
    locale: "en",
    templateName: midnight.name,
    material: midnight.material,
    slotIndex: 1
  });
  assert.equal(genuineMidnight.name, "Midnight Lume");
  assert.equal(genuineMidnight.material, "Navy · Foil");

  // Case 1E: Slot 'editorial' paired with 'Midnight Lume'
  const midnightInEditorialSlot = resolveCustomerStyleDisplay({
    locale: "en",
    templateName: midnight.name,
    material: midnight.material,
    slotIndex: 0 // slot 0 corresponds to editorial routing slot
  });
  assert.equal(midnightInEditorialSlot.name, "Midnight Lume");
  assert.equal(midnightInEditorialSlot.material, "Navy · Foil");
  assert.notEqual(midnightInEditorialSlot.name, "Luxury Editorial");
  assert.notEqual(midnightInEditorialSlot.name, "Elegant Editorial");

  // Case 1F: Neutral fallback when no template identity exists (NEVER infer from slot)
  const neutralDisplay = resolveCustomerStyleDisplay({
    locale: "en",
    slotIndex: 1 // slot 1
  });
  assert.equal(neutralDisplay.name, "Direction 02", "empty template identity must produce neutral non-style label");
  assert.notEqual(neutralDisplay.name, "Midnight Lume", "empty identity in slot 1 must NEVER infer 'Midnight Lume'");

  // ============================================================================
  // 2. Rejection of Missing or Partial Identity Before Final Beta Render
  // ============================================================================
  const validSnapshotBase = {
    locale: "en",
    format: "portrait-5x7" as const,
    direction: "midnight" as const,
    occasion: "Birthday",
    relationship: "Friend",
    feeling: "Warm",
    kicker: "A MOMENT FOR YOU",
    headline: "Happy Birthday",
    body: "Wishing you a calm and joyful year ahead.",
    accentMode: "original" as const
  };

  // 2A. buildCheckoutCardDocument rejects call without managedTemplate
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "a0000000-0000-4000-8000-000000000001",
      snapshot: {
        ...validSnapshotBase,
        templateId: luxury.id,
        templateVersionId: luxury.versionId
      },
      managedTemplate: undefined
    }),
    "template_identity_required",
    "buildCheckoutCardDocument must throw when managedTemplate is missing"
  );

  // 2B. buildCheckoutCardDocument rejects snapshot without templateId / templateVersionId
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "a0000000-0000-4000-8000-000000000002",
      snapshot: validSnapshotBase, // completely missing templateId and templateVersionId
      managedTemplate: {
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: luxury.version,
        templateVersionId: luxury.versionId,
        photoMode: luxury.photoMode
      }
    }),
    "missing_template_identity",
    "buildCheckoutCardDocument must throw when snapshot lacks managed templateId"
  );

  // 2C. buildCheckoutCardDocument rejects partial template identity (templateId without templateVersionId)
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "a0000000-0000-4000-8000-000000000003",
      snapshot: {
        ...validSnapshotBase,
        templateId: luxury.id
      },
      managedTemplate: {
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: luxury.version,
        templateVersionId: luxury.versionId,
        photoMode: luxury.photoMode
      }
    }),
    "template_identity_incomplete",
    "buildCheckoutCardDocument must reject partial templateId without templateVersionId"
  );

  // 2D. buildCheckoutCardDocument rejects version mismatch between snapshot and managedTemplate
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "a0000000-0000-4000-8000-000000000004",
      snapshot: {
        ...validSnapshotBase,
        templateId: luxury.id,
        templateVersionId: luxury.versionId
      },
      managedTemplate: {
        rendererTemplateKey: midnight.rendererTemplateKey,
        version: midnight.version,
        templateVersionId: midnight.versionId, // version mismatch!
        photoMode: midnight.photoMode
      }
    }),
    "template_version_mismatch",
    "buildCheckoutCardDocument must reject version mismatch between snapshot and managedTemplate"
  );

  // 2E. Direct assertCanonicalPresentationIdentity rejections
  mustThrow(
    () => assertCanonicalPresentationIdentity({}),
    "missing_template_identity",
    "assertCanonicalPresentationIdentity must reject empty identity"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ templateId: luxury.id }),
    "partial_template_identity_rejected",
    "assertCanonicalPresentationIdentity must reject templateId without templateVersionId"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ templateVersionId: luxury.versionId }),
    "partial_template_identity_rejected",
    "assertCanonicalPresentationIdentity must reject templateVersionId without templateId"
  );

  // ============================================================================
  // 3. Rejection of visualDirection Alone
  // ============================================================================
  mustThrow(
    () => assertCanonicalPresentationIdentity({ visualDirection: "midnight" }),
    "invalid_presentation_identity",
    "assertCanonicalPresentationIdentity must reject visualDirection='midnight' alone"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ visualDirection: "editorial" }),
    "invalid_presentation_identity",
    "assertCanonicalPresentationIdentity must reject visualDirection='editorial' alone"
  );
  mustThrow(
    () => assertCanonicalPresentationIdentity({ visualDirection: "photo" }),
    "invalid_presentation_identity",
    "assertCanonicalPresentationIdentity must reject visualDirection='photo' alone"
  );

  // Snapshot schema rejects visualDirection without templateId + templateVersionId
  mustThrow(
    () => CheckoutCardSnapshotSchema.parse({
      ...validSnapshotBase,
      visualDirection: "midnight"
    }),
    "invalid_presentation_identity",
    "CheckoutCardSnapshotSchema must reject visualDirection alone"
  );

  // buildCheckoutCardDocument rejects visualDirection alone
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "a0000000-0000-4000-8000-000000000005",
      snapshot: {
        ...validSnapshotBase,
        visualDirection: "midnight"
      },
      managedTemplate: {
        rendererTemplateKey: "midnight-lume",
        version: 1,
        templateVersionId: midnight.versionId,
        photoMode: "none"
      }
    }),
    "invalid_presentation_identity",
    "buildCheckoutCardDocument must reject snapshot with visualDirection alone"
  );

  // ============================================================================
  // 4. Curated / Fallback Directions Carry Approved Exact Identity
  // ============================================================================
  const slots = ["editorial", "midnight", "photo", "quiet"] as const;
  for (const slot of slots) {
    const fallback = curatedFallbackPresentations[slot];
    assert.ok(fallback, `curated fallback for slot '${slot}' must exist`);
    assert.ok(fallback.templateId, `fallback '${slot}' must have templateId`);
    assert.ok(fallback.templateVersionId, `fallback '${slot}' must have templateVersionId`);
    assert.match(
      fallback.templateId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      `fallback '${slot}' templateId must be UUID`
    );
    assert.match(
      fallback.templateVersionId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      `fallback '${slot}' templateVersionId must be UUID`
    );

    // Verify resolveCanonicalPresentation accepts the fallback identity
    const resolved = resolveCanonicalPresentation({
      templateId: fallback.templateId,
      templateVersionId: fallback.templateVersionId,
      hasPhoto: slot === "photo" ? true : undefined
    });
    assert.equal(resolved.templateId, fallback.templateId);
    assert.equal(resolved.templateVersionId, fallback.templateVersionId);

    // Verify helper function resolveCuratedFallbackPresentation
    const resolvedFromHelper = resolveCuratedFallbackPresentation(slot);
    assert.equal(resolvedFromHelper.templateId, fallback.templateId);
    assert.equal(resolvedFromHelper.templateVersionId, fallback.templateVersionId);
  }

  // ============================================================================
  // 5. Slot ID Independence in Document Building (Never Derive from Slot)
  // ============================================================================
  // 5A: Slot is 'midnight', but customer selected 'Luxury Editorial' (editorial template)
  const docLuxuryInMidnightSlot = buildCheckoutCardDocument({
    versionId: "a0000000-0000-4000-8000-000000000010",
    snapshot: {
      ...validSnapshotBase,
      direction: "midnight", // slot is midnight!
      templateId: luxury.id,
      templateVersionId: luxury.versionId
    },
    managedTemplate: {
      rendererTemplateKey: luxury.rendererTemplateKey,
      version: luxury.version,
      templateVersionId: luxury.versionId,
      photoMode: luxury.photoMode
    }
  });
  assert.equal(
    docLuxuryInMidnightSlot.templateId,
    "luxury-editorial",
    "document templateId must come from managedTemplate, NOT slot 'midnight'"
  );
  assert.equal(
    docLuxuryInMidnightSlot.paletteId,
    "editorial-ivory",
    "default palette must come from template, NOT slot 'midnight'"
  );
  assert.equal(
    docLuxuryInMidnightSlot.templateVersion,
    `managed-${luxury.versionId}-v${luxury.version}`,
    "templateVersion must record exact managed templateVersionId"
  );

  // 5B: Slot is 'editorial', but customer selected 'Midnight Lume' (midnight template)
  const docMidnightInEditorialSlot = buildCheckoutCardDocument({
    versionId: "a0000000-0000-4000-8000-000000000011",
    snapshot: {
      ...validSnapshotBase,
      direction: "editorial", // slot is editorial!
      templateId: midnight.id,
      templateVersionId: midnight.versionId
    },
    managedTemplate: {
      rendererTemplateKey: midnight.rendererTemplateKey,
      version: midnight.version,
      templateVersionId: midnight.versionId,
      photoMode: midnight.photoMode
    }
  });
  assert.equal(
    docMidnightInEditorialSlot.templateId,
    "midnight-lume",
    "document templateId must come from managedTemplate, NOT slot 'editorial'"
  );
  assert.equal(
    docMidnightInEditorialSlot.paletteId,
    "midnight-navy",
    "midnight template must default to midnight-navy palette regardless of slot 'editorial'"
  );

  // ============================================================================
  // 6. Static Source Code Invariant Audits
  // ============================================================================
  const checkoutServerSource = fs.readFileSync("apps/web/lib/checkout-card.server.ts", "utf8");
  const studioSource = fs.readFileSync("apps/web/components/card-studio.tsx", "utf8");
  const betaExportRouteSource = fs.readFileSync("apps/web/app/api/beta/export/route.ts", "utf8");
  const generateRouteSource = fs.readFileSync("apps/web/app/api/generate/[jobId]/route.ts", "utf8");

  // 6A. TEMPLATE_BY_DIRECTION table must NOT exist in checkout-card.server.ts or checkout-card-core.ts
  assert.ok(
    !checkoutServerSource.includes("TEMPLATE_BY_DIRECTION"),
    "TEMPLATE_BY_DIRECTION must be completely removed from checkout-card.server.ts"
  );
  assert.ok(
    !checkoutServerSource.includes("DEFAULT_PALETTE_BY_DIRECTION"),
    "DEFAULT_PALETTE_BY_DIRECTION must be completely removed from checkout-card.server.ts"
  );
  const checkoutCoreSource = fs.readFileSync("apps/web/lib/checkout-card-core.ts", "utf8");
  assert.ok(
    !checkoutCoreSource.includes("TEMPLATE_BY_DIRECTION"),
    "TEMPLATE_BY_DIRECTION must be completely removed from checkout-card-core.ts"
  );
  assert.ok(
    !checkoutCoreSource.includes("DEFAULT_PALETTE_BY_DIRECTION"),
    "DEFAULT_PALETTE_BY_DIRECTION must be completely removed from checkout-card-core.ts"
  );
  assert.ok(
    checkoutServerSource.includes("checkout-card-core"),
    "checkout-card.server.ts must re-export pure logic from checkout-card-core"
  );

  // 6B. card-studio.tsx must not call directionDisplay for result label display
  assert.ok(
    !studioSource.includes("directionDisplay(locale,d.id"),
    "card-studio.tsx must not call directionDisplay with slot ID to label results"
  );
  assert.ok(
    studioSource.includes("resolveCustomerStyleDisplay"),
    "card-studio.tsx must use resolveCustomerStyleDisplay for result metadata"
  );
  assert.ok(
    studioSource.includes("curatedFallbackPresentations"),
    "card-studio.tsx must initialize fallback directions with curatedFallbackPresentations"
  );

  // 6C. beta export route asserts canonical presentation identity
  assert.ok(
    betaExportRouteSource.includes("assertCanonicalPresentationIdentity"),
    "beta export route must assert canonical presentation identity"
  );
  assert.ok(
    betaExportRouteSource.includes("missing_template_identity"),
    "beta export route must handle missing_template_identity"
  );
  assert.ok(
    betaExportRouteSource.includes("partial_template_identity_rejected"),
    "beta export route must handle partial_template_identity_rejected"
  );

  // 6D. generate [jobId] route establishes canonical presentation
  assert.ok(
    generateRouteSource.includes("resolveCanonicalPresentation"),
    "generate [jobId] route must resolve canonical presentation"
  );

  // 6E. Confirm critical invariants from previous tasks are preserved
  assert.ok(
    studioSource.includes("templateVersionId:selected.templateVersionId"),
    "card-studio.tsx must preserve templateVersionId in checkout"
  );
  assert.ok(
    studioSource.includes("templateSource:selected.templateSource"),
    "card-studio.tsx must preserve templateSource in checkout"
  );
  assert.ok(
    studioSource.includes("setUsedCuratedFallback(true)"),
    "card-studio.tsx must preserve setUsedCuratedFallback"
  );
  assert.ok(
    generateRouteSource.includes("issueTemplateEventToken") &&
    generateRouteSource.includes('source:"ai_direction"'),
    "generate route must preserve issueTemplateEventToken with source:ai_direction"
  );

  // ============================================================================
  // 7. Status Completion
  // ============================================================================
  console.log("TEMPLATE_LABEL_IDENTITY=PASS");
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
