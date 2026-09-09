import assert from "node:assert/strict";
import {
  CheckoutCardSnapshotSchema,
  type CheckoutCardSnapshot
} from "../packages/card-schema/src/index.ts";
import {
  bootstrapTemplates,
  resolveCanonicalPresentation,
  type CanonicalPresentation,
  type TemplateMeta
} from "../packages/templates/src/index.ts";
import { buildCheckoutCardDocument } from "../apps/web/lib/checkout-card-core.ts";

const luxury = bootstrapTemplates.find((template) => template.slug === "luxury-editorial")!;
const midnight = bootstrapTemplates.find((template) => template.slug === "midnight-lume")!;
const classic = bootstrapTemplates.find((template) => template.slug === "classic-letterpress")!;
const photo = bootstrapTemplates.find((template) => template.slug === "photo-story")!;

function mustThrow(fn: () => unknown, expected: string, label: string) {
  assert.throws(fn, (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    assert.ok(message.includes(expected), `${label}: expected '${expected}', got '${message}'`);
    return true;
  }, label);
}

function managed(template: TemplateMeta, presentation?: CanonicalPresentation) {
  return {
    templateId: template.id,
    rendererTemplateKey: template.rendererTemplateKey,
    version: template.version,
    templateVersionId: template.versionId,
    photoMode: template.photoMode,
    ...(presentation ? { presentation } : {})
  } as never;
}

function snapshot(template: TemplateMeta, overrides: Partial<CheckoutCardSnapshot> = {}): CheckoutCardSnapshot {
  return CheckoutCardSnapshotSchema.parse({
    locale: "en",
    format: "portrait-5x7",
    direction: "midnight",
    templateId: template.id,
    templateVersionId: template.versionId,
    occasion: "Birthday",
    relationship: "Friend",
    feeling: "Warm",
    kicker: "FOR YOU",
    headline: "A deliberate headline",
    body: "A user-edited body that must survive server-owned presentation resolution.",
    accentMode: "original",
    ...overrides
  });
}

function build(template: TemplateMeta, input: Partial<CheckoutCardSnapshot> = {}, presentation?: CanonicalPresentation) {
  return buildCheckoutCardDocument({
    versionId: "90000000-0000-4000-8000-000000000001",
    snapshot: snapshot(template, input),
    managedTemplate: managed(template, presentation)
  });
}

async function main() {
  const luxuryPresentation = resolveCanonicalPresentation({
    templateId: luxury.id,
    templateVersionId: luxury.versionId,
    format: "portrait-5x7",
    locale: "en"
  });
  const classicPresentation = resolveCanonicalPresentation({
    templateId: classic.id,
    templateVersionId: classic.versionId,
    format: "portrait-5x7",
    locale: "en"
  });

  // Client may carry a canonical snapshot for compatibility, but a protected
  // layout mutation must never become the final document presentation.
  const forgedPresentation: CanonicalPresentation = {
    ...luxuryPresentation,
    layout: { ...luxuryPresentation.layout, showBorder: !luxuryPresentation.layout.showBorder },
    typographyId: "modern-sans"
  };
  mustThrow(
    () => build(luxury, { presentation: forgedPresentation }, luxuryPresentation),
    "presentation_authority_mismatch",
    "client presentation tampering"
  );
  mustThrow(
    () => build(luxury, {}, forgedPresentation),
    "managed_presentation_authority_mismatch",
    "managed presentation tampering"
  );

  // The exact managed pair is restored by the server-side builder, not by the
  // direction slot or a client presentation payload.
  const authoritative = build(luxury, { presentation: undefined, direction: "quiet" });
  const authoritativeFromManagedPresentation = build(luxury, { presentation: undefined, direction: "quiet" }, luxuryPresentation);
  assert.equal(authoritative.templateId, luxury.rendererTemplateKey);
  assert.equal(authoritative.presentation?.templateId, luxury.id);
  assert.equal(authoritative.presentation?.templateVersionId, luxury.versionId);
  assert.equal(authoritative.presentation?.rendererTemplateKey, luxury.rendererTemplateKey);
  assert.deepEqual(authoritative.presentation, authoritativeFromManagedPresentation.presentation);

  // A validated DB variant may use an approved renderer without being present
  // in the bootstrap template-ID catalog. Its exact IDs/version still survive.
  const dynamicTemplateId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const dynamicVersionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const dynamic = buildCheckoutCardDocument({
    versionId: "90000000-0000-4000-8000-000000000005",
    snapshot: snapshot(luxury, { templateId: dynamicTemplateId, templateVersionId: dynamicVersionId }),
    managedTemplate: {
      templateId: dynamicTemplateId,
      rendererTemplateKey: luxury.rendererTemplateKey,
      version: 2,
      templateVersionId: dynamicVersionId,
      photoMode: "none"
    } as never
  });
  assert.equal(dynamic.presentation?.templateId, dynamicTemplateId);
  assert.equal(dynamic.presentation?.templateVersionId, dynamicVersionId);
  assert.equal(dynamic.presentation?.version, 2);
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000007",
      snapshot: snapshot(luxury, { templateId: dynamicTemplateId, templateVersionId: dynamicVersionId }),
      managedTemplate: {
        templateId: dynamicTemplateId,
        rendererTemplateKey: luxury.rendererTemplateKey,
        visualDirection: "midnight",
        version: 2,
        templateVersionId: dynamicVersionId,
        photoMode: "none"
      } as never
    }),
    "managed_visual_direction_mismatch",
    "known renderer with wrong visual contract must fail"
  );
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000008",
      snapshot: snapshot(luxury, {
        templateId: dynamicTemplateId,
        templateVersionId: dynamicVersionId,
        photoAssetId: "70000000-0000-4000-8000-000000000002",
        photoPalette: { primary: "#112233", secondary: "#445566", accent: "#778899", temperature: "balanced", luminance: 0.4 }
      }),
      managedTemplate: {
        templateId: dynamicTemplateId,
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: 2,
        templateVersionId: dynamicVersionId,
        photoMode: "required"
      } as never
    }),
    "managed_photo_mode_mismatch",
    "known renderer with wrong photo contract must fail"
  );
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000009",
      snapshot: snapshot(luxury, { templateId: dynamicTemplateId, templateVersionId: dynamicVersionId }),
      managedTemplate: {
        templateId: dynamicTemplateId,
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: 2,
        templateVersionId: dynamicVersionId,
        photoMode: "none",
        headlineCapacity: "short"
      } as never
    }),
    "managed_headline_capacity_mismatch",
    "known renderer with wrong headline capacity must fail"
  );
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000010",
      snapshot: snapshot(luxury, { templateId: dynamicTemplateId, templateVersionId: dynamicVersionId }),
      managedTemplate: {
        templateId: dynamicTemplateId,
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: 2,
        templateVersionId: dynamicVersionId,
        photoMode: "none",
        bodyCapacity: "short"
      } as never
    }),
    "managed_body_capacity_mismatch",
    "known renderer with wrong body capacity must fail"
  );
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000006",
      snapshot: snapshot(luxury, { templateId: dynamicTemplateId, templateVersionId: dynamicVersionId }),
      managedTemplate: {
        templateId: dynamicTemplateId,
        rendererTemplateKey: "unapproved-renderer",
        version: 2,
        templateVersionId: dynamicVersionId,
        photoMode: "none"
      } as never
    }),
    "managed_renderer_not_registered",
    "unknown renderer must not use centered fallback"
  );

  // Legitimate content edits remain intact while protected presentation is fixed.
  assert.deepEqual(
    authoritative.textBlocks.map((block) => block.text),
    ["FOR YOU", "A deliberate headline", "A user-edited body that must survive server-owned presentation resolution."]
  );

  // A managed identity mismatch is explicit and cannot be hidden by the slot.
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000004",
      snapshot: snapshot(luxury),
      managedTemplate: {
        templateId: luxury.id,
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: luxury.version,
        templateVersionId: midnight.versionId,
        photoMode: luxury.photoMode
      } as never
    }),
    "template_version_mismatch",
    "managed version mismatch"
  );

  // If the managed server row identifies a different template, reject the
  // client/server pair instead of letting rendererTemplateKey silently win.
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000002",
      snapshot: snapshot(luxury),
      managedTemplate: {
        templateId: midnight.id,
        rendererTemplateKey: luxury.rendererTemplateKey,
        version: luxury.version,
        templateVersionId: luxury.versionId,
        photoMode: luxury.photoMode
      } as never
    }),
    "template_identity_mismatch",
    "managed template identity mismatch"
  );

  // An unregistered renderer fails explicitly; it must not degrade to a
  // centered document or substitute a curated catalog direction.
  const unknownId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  mustThrow(
    () => buildCheckoutCardDocument({
      versionId: "90000000-0000-4000-8000-000000000003",
      snapshot: snapshot(luxury, { templateId: unknownId, templateVersionId: unknownId }),
      managedTemplate: {
        templateId: unknownId,
        rendererTemplateKey: "unregistered-renderer",
        version: luxury.version,
        templateVersionId: unknownId,
        photoMode: luxury.photoMode
      } as never
    }),
    "managed_renderer_not_registered",
    "unknown renderer must not silently substitute"
  );

  // Slot identity is presentation-irrelevant: Choose → Finish → Export keeps
  // the selected exact managed identity.
  const selected = build(classic, { direction: "midnight", presentation: classicPresentation }, classicPresentation);
  assert.equal(selected.templateId, classic.rendererTemplateKey);
  assert.equal(selected.presentation?.templateId, classic.id);
  assert.equal(selected.presentation?.templateVersionId, classic.versionId);

  // Photo compatibility remains fail-closed in both directions.
  mustThrow(
    () => build(photo, { photoAssetId: undefined, photoPalette: undefined }),
    "template_photo_required",
    "required photo without asset"
  );
  mustThrow(
    () => build(luxury, {
      photoAssetId: "70000000-0000-4000-8000-000000000001",
      photoPalette: { primary: "#112233", secondary: "#445566", accent: "#778899", temperature: "balanced", luminance: 0.4 }
    }),
    "template_photo_not_supported",
    "photo on no-photo template"
  );

  console.log("CORRECTIVE_AUTHORITY=PASS");
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
