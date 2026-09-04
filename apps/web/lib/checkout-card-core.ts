import {
  CardDocumentSchema,
  CheckoutCardSnapshotSchema,
  cardCopyMetrics,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CheckoutCardSnapshot
} from "@cardelume/card-schema";
import { resolveCanonicalPresentation, type CanonicalPresentation } from "@cardelume/templates";

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
    rendererTemplateKey: string;
    version: number;
    templateVersionId: string;
    photoMode: "none" | "optional" | "required";
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

  let presentation = snapshot.presentation ?? input.managedTemplate.presentation;
  if (!presentation && snapshot.templateId && input.managedTemplate.templateVersionId) {
    try {
      presentation = resolveCanonicalPresentation({
        templateId: snapshot.templateId,
        templateVersionId: input.managedTemplate.templateVersionId,
        hasPhoto: Boolean(snapshot.photoAssetId),
        locale: snapshot.locale,
        format: snapshot.format
      });
    } catch {
      presentation = undefined;
    }
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
