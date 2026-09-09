import {
  CardDocumentSchema,
  CheckoutCardSnapshotSchema,
  cardCopyMetrics,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CheckoutCardSnapshot
} from "@cardelume/card-schema";
import { resolveManagedTemplatePresentation, type CanonicalPresentation } from "@cardelume/templates";

const ACCENT_PALETTE: Partial<Record<CheckoutCardSnapshot["accentMode"], string>> = {
  navy: "midnight-navy",
  sage: "soft-sage",
  rose: "soft-rose"
};

function defaultPaletteForTemplate(rendererTemplateKey: string): string {
  if (
    rendererTemplateKey === "midnight-lume" ||
    rendererTemplateKey === "celestial-night" ||
    rendererTemplateKey === "art-deco-noir" ||
    rendererTemplateKey === "night-ledger"
  ) {
    return "midnight-navy";
  }
  return "editorial-ivory";
}

export function buildCheckoutCardDocument(input: {
  versionId: string;
  snapshot: unknown;
  managedTemplate?: {
    templateId?: string;
    rendererTemplateKey: string;
    version: number;
    templateVersionId: string;
    photoMode: "none" | "optional" | "required";
    name?: string;
    material?: string;
    visualDirection?: import("@cardelume/templates").VisualDirection;
    familyId?: string;
    supportedFormats?: string[];
    scriptSupport?: import("@cardelume/templates").TemplateScript[];
    headlineCapacity?: import("@cardelume/templates").TextCapacity;
    bodyCapacity?: import("@cardelume/templates").TextCapacity;
    materialWorld?: import("@cardelume/templates").TemplateMaterialWorld;
    colorWorld?: import("@cardelume/templates").TemplateColorWorld;
    motionProfile?: import("@cardelume/templates").TemplateMotionProfile;
    energy?: import("@cardelume/templates").TemplateEnergy;
    presentation?: CanonicalPresentation;
  };
}): CardDocument {
  const snapshot = CheckoutCardSnapshotSchema.parse(input.snapshot);
  if (!input.managedTemplate) {
    throw new Error("template_identity_required: managedTemplate is mandatory; slot ID or visualDirection cannot derive template identity");
  }
  assertCanonicalPresentationIdentity({
    templateId: snapshot.templateId,
    templateVersionId: snapshot.templateVersionId,
    visualDirection: (snapshot as { visualDirection?: string }).visualDirection
  });
  if (input.managedTemplate.templateId && input.managedTemplate.templateId !== snapshot.templateId) {
    throw new Error("template_identity_mismatch: snapshot.templateId does not match managedTemplate.templateId");
  }
  if (snapshot.templateVersionId !== input.managedTemplate.templateVersionId) {
    throw new Error("template_version_mismatch: snapshot.templateVersionId does not match managedTemplate.templateVersionId");
  }
  if (snapshot.accentMode === "photo" && !snapshot.photoAssetId) throw new Error("photo_accent_requires_asset");
  if (snapshot.photoAssetId && !snapshot.photoPalette) throw new Error("photo_palette_required");
  const copy = cardCopyMetrics(snapshot.headline, snapshot.body, snapshot.locale, snapshot.format);
  if (copy.hardOverflow) throw new Error("typography_copy_too_dense");

  if (input.managedTemplate.photoMode === "required" && !snapshot.photoAssetId) throw new Error("template_photo_required");
  if (input.managedTemplate.photoMode === "none" && snapshot.photoAssetId) throw new Error("template_photo_not_supported");

  const rendererTemplateKey = input.managedTemplate.rendererTemplateKey;
  const paletteId = ACCENT_PALETTE[snapshot.accentMode]
    ?? defaultPaletteForTemplate(rendererTemplateKey);

  const resolvedPresentation = resolveManagedTemplatePresentation({
    templateId: snapshot.templateId!,
    templateVersionId: input.managedTemplate.templateVersionId,
    rendererTemplateKey: input.managedTemplate.rendererTemplateKey,
    version: input.managedTemplate.version,
    photoMode: input.managedTemplate.photoMode,
    name: input.managedTemplate.name,
    material: input.managedTemplate.material,
    visualDirection: input.managedTemplate.visualDirection,
    familyId: input.managedTemplate.familyId,
    supportedFormats: input.managedTemplate.supportedFormats,
    scriptSupport: input.managedTemplate.scriptSupport,
    headlineCapacity: input.managedTemplate.headlineCapacity,
    bodyCapacity: input.managedTemplate.bodyCapacity,
    materialWorld: input.managedTemplate.materialWorld,
    colorWorld: input.managedTemplate.colorWorld,
    motionProfile: input.managedTemplate.motionProfile,
    energy: input.managedTemplate.energy,
    hasPhoto: Boolean(snapshot.photoAssetId),
    locale: snapshot.locale,
    format: snapshot.format
  });
  if (input.managedTemplate.presentation && JSON.stringify(input.managedTemplate.presentation) !== JSON.stringify(resolvedPresentation)) {
    throw new Error("managed_presentation_authority_mismatch: supplied managed presentation is not the exact pair resolution");
  }
  const presentation = resolvedPresentation;

  if (presentation.templateId !== snapshot.templateId || presentation.templateVersionId !== input.managedTemplate.templateVersionId) {
    throw new Error("presentation_authority_mismatch: managed presentation identity does not match exact checkout pair");
  }
  if (presentation.rendererTemplateKey !== input.managedTemplate.rendererTemplateKey) {
    throw new Error("managed_renderer_mismatch: managed presentation renderer does not match managed template");
  }
  if (presentation.version !== input.managedTemplate.version || presentation.photoMode !== input.managedTemplate.photoMode) {
    throw new Error("managed_presentation_metadata_mismatch: managed presentation metadata does not match managed template");
  }
  if (snapshot.presentation && JSON.stringify(snapshot.presentation) !== JSON.stringify(presentation)) {
    throw new Error("presentation_authority_mismatch: client presentation cannot redefine server-owned presentation");
  }

  return CardDocumentSchema.parse({
    schemaVersion: 1,
    templateVersion: `managed-${input.managedTemplate.templateVersionId}-v${input.managedTemplate.version}`,
    rendererVersion: "0.4.3-step.5",
    marketPackVersion: "2026.08",
    id: input.versionId,
    locale: snapshot.locale,
    format: snapshot.format,
    templateId: rendererTemplateKey,
    paletteId,
    typographyId: "editorial-serif",
    artworkAssetIds: snapshot.photoAssetId ? [snapshot.photoAssetId] : [],
    photoPalette: snapshot.photoAssetId ? snapshot.photoPalette : undefined,
    photoTreatment: rendererTemplateKey === "photo-story" ? "editorial" : undefined,
    textBlocks: [
      { id: "kicker", role: "kicker", align: "center", text: snapshot.kicker },
      { id: "headline", role: "headline", align: "center", text: snapshot.headline },
      { id: "body", role: "body", align: "center", text: snapshot.body }
    ],
    metadata: {
      occasion: snapshot.occasion,
      relationship: snapshot.relationship,
      feeling: snapshot.feeling
    },
    presentation
  });
}
