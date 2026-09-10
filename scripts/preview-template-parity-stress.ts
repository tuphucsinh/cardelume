import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
import {
  CardDocumentSchema,
  CanonicalPresentationSchema,
  CheckoutCardSnapshotSchema,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CheckoutCardSnapshot,
  type CanonicalPresentation,
  type PresentationLayoutProfile
} from "../packages/card-schema/src/index.ts";
import {
  portfolioV2AllTemplates,
  bootstrapTemplates,
  curatedFallbackPresentations,
  resolveCuratedFallbackPresentation,
  resolveCanonicalPresentation,
  resolveCanonicalPresentationFromTemplate,
  findManagedTemplateByIdAndVersion,
  templateLayoutProfile,
  type TemplateMeta
} from "../packages/templates/src/index.ts";
import {
  CURRENT_RENDERER_VERSION,
  renderProductionFinal,
  renderProductionPreview,
  renderFinalSvg,
  renderPreviewSvg,
  assertRendererTemplateId,
  type ProductionRenderMetadata
} from "../packages/renderer/src/index.ts";
import { buildCheckoutCardDocument } from "../apps/web/lib/checkout-card-core.ts";
import { CardVisual } from "../apps/web/components/card-visual.tsx";

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

function read(relativePath: string): string {
  if (fs.existsSync(relativePath)) {
    return fs.readFileSync(relativePath, "utf8");
  }
  const fromScript = new URL(`../${relativePath}`, import.meta.url).pathname;
  if (fs.existsSync(fromScript)) {
    return fs.readFileSync(fromScript, "utf8");
  }
  return fs.readFileSync(relativePath, "utf8");
}

let cachedPhotoBytes: Uint8Array | null = null;
async function getTestPhotoBytes(): Promise<Uint8Array> {
  if (!cachedPhotoBytes) {
    const buf = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 120, g: 140, b: 130 }
      }
    }).jpeg({ quality: 85 }).toBuffer();
    cachedPhotoBytes = new Uint8Array(buf);
  }
  return cachedPhotoBytes;
}

export function assertCanonicalParity(
  a: CanonicalPresentation,
  b: CanonicalPresentation,
  context = "Canonical parity"
): void {
  // 1. Identity
  if (a.templateId !== b.templateId) {
    throw new Error(`${context}: templateId mismatch: '${a.templateId}' !== '${b.templateId}'`);
  }
  if (a.templateVersionId !== b.templateVersionId) {
    throw new Error(`${context}: templateVersionId mismatch: '${a.templateVersionId}' !== '${b.templateVersionId}'`);
  }
  if (a.rendererTemplateKey !== b.rendererTemplateKey) {
    throw new Error(`${context}: rendererTemplateKey mismatch: '${a.rendererTemplateKey}' !== '${b.rendererTemplateKey}'`);
  }

  // 2. Archetype, visual direction, materials & aesthetics
  if (a.name !== b.name) {
    throw new Error(`${context}: name mismatch: '${a.name}' !== '${b.name}'`);
  }
  if (a.archetype !== b.archetype) {
    throw new Error(`${context}: archetype mismatch: '${a.archetype}' !== '${b.archetype}'`);
  }
  if (a.visualDirection !== b.visualDirection) {
    throw new Error(`${context}: visualDirection mismatch: '${a.visualDirection}' !== '${b.visualDirection}'`);
  }
  if (a.material !== b.material) {
    throw new Error(`${context}: material mismatch: '${a.material}' !== '${b.material}'`);
  }
  if (a.colorWorld !== b.colorWorld) {
    throw new Error(`${context}: colorWorld mismatch: '${String(a.colorWorld)}' !== '${String(b.colorWorld)}'`);
  }
  if (a.motionProfile !== b.motionProfile) {
    throw new Error(`${context}: motionProfile mismatch: '${String(a.motionProfile)}' !== '${String(b.motionProfile)}'`);
  }
  if (a.energy !== b.energy) {
    throw new Error(`${context}: energy mismatch: '${String(a.energy)}' !== '${String(b.energy)}'`);
  }
  if (a.materialWorld !== b.materialWorld) {
    throw new Error(`${context}: materialWorld mismatch: '${String(a.materialWorld)}' !== '${String(b.materialWorld)}'`);
  }
  if (a.version !== b.version) {
    throw new Error(`${context}: version mismatch: ${a.version} !== ${b.version}`);
  }
  if (a.familyId !== b.familyId) {
    throw new Error(`${context}: familyId mismatch: '${String(a.familyId)}' !== '${String(b.familyId)}'`);
  }

  // 3. Typography & Capacity & Script
  if (a.typographyId !== b.typographyId) {
    throw new Error(`${context}: typographyId mismatch: '${a.typographyId}' !== '${b.typographyId}'`);
  }
  if (a.headlineCapacity !== b.headlineCapacity) {
    throw new Error(`${context}: headlineCapacity mismatch: '${a.headlineCapacity}' !== '${b.headlineCapacity}'`);
  }
  if (a.bodyCapacity !== b.bodyCapacity) {
    throw new Error(`${context}: bodyCapacity mismatch: '${a.bodyCapacity}' !== '${b.bodyCapacity}'`);
  }
  assert.deepEqual(a.scriptSupport, b.scriptSupport, `${context}: scriptSupport mismatch`);

  // 4. Photo modes
  if (a.photoMode !== b.photoMode) {
    throw new Error(`${context}: photoMode mismatch: '${a.photoMode}' !== '${b.photoMode}'`);
  }
  if (a.photoSupported !== b.photoSupported) {
    throw new Error(`${context}: photoSupported mismatch: ${String(a.photoSupported)} !== ${String(b.photoSupported)}`);
  }
  if (a.photoRequired !== b.photoRequired) {
    throw new Error(`${context}: photoRequired mismatch: ${String(a.photoRequired)} !== ${String(b.photoRequired)}`);
  }

  // 5. Layout & Composition profile
  if (a.layout.anchor !== b.layout.anchor) {
    throw new Error(`${context}: layout.anchor mismatch: '${a.layout.anchor}' !== '${b.layout.anchor}'`);
  }
  if (a.layout.xPct !== b.layout.xPct) {
    throw new Error(`${context}: layout.xPct mismatch: ${a.layout.xPct} !== ${b.layout.xPct}`);
  }
  if (a.layout.kickerYPct !== b.layout.kickerYPct) {
    throw new Error(`${context}: layout.kickerYPct mismatch: ${a.layout.kickerYPct} !== ${b.layout.kickerYPct}`);
  }
  if (a.layout.headlineYPct !== b.layout.headlineYPct) {
    throw new Error(`${context}: layout.headlineYPct mismatch: ${a.layout.headlineYPct} !== ${b.layout.headlineYPct}`);
  }
  if (a.layout.bodyYPct !== b.layout.bodyYPct) {
    throw new Error(`${context}: layout.bodyYPct mismatch: ${a.layout.bodyYPct} !== ${b.layout.bodyYPct}`);
  }
  if (a.layout.signatureYPct !== b.layout.signatureYPct) {
    throw new Error(`${context}: layout.signatureYPct mismatch: ${a.layout.signatureYPct} !== ${b.layout.signatureYPct}`);
  }
  if (a.layout.headlineWidthPct !== b.layout.headlineWidthPct) {
    throw new Error(`${context}: layout.headlineWidthPct mismatch: ${a.layout.headlineWidthPct} !== ${b.layout.headlineWidthPct}`);
  }
  if (a.layout.bodyWidthPct !== b.layout.bodyWidthPct) {
    throw new Error(`${context}: layout.bodyWidthPct mismatch: ${a.layout.bodyWidthPct} !== ${b.layout.bodyWidthPct}`);
  }
  if (a.layout.headlineScale !== b.layout.headlineScale) {
    throw new Error(`${context}: layout.headlineScale mismatch: ${a.layout.headlineScale} !== ${b.layout.headlineScale}`);
  }
  if (a.layout.bodyScale !== b.layout.bodyScale) {
    throw new Error(`${context}: layout.bodyScale mismatch: ${a.layout.bodyScale} !== ${b.layout.bodyScale}`);
  }
  if (a.layout.showBorder !== b.layout.showBorder) {
    throw new Error(`${context}: layout.showBorder mismatch: ${String(a.layout.showBorder)} !== ${String(b.layout.showBorder)}`);
  }
  if (a.layout.showSignatureMark !== b.layout.showSignatureMark) {
    throw new Error(`${context}: layout.showSignatureMark mismatch: ${String(a.layout.showSignatureMark)} !== ${String(b.layout.showSignatureMark)}`);
  }
  if (Boolean(a.layout.darkSurface) !== Boolean(b.layout.darkSurface)) {
    throw new Error(`${context}: layout.darkSurface mismatch: ${String(a.layout.darkSurface)} !== ${String(b.layout.darkSurface)}`);
  }
  assert.deepEqual(a.layout.photoWindow, b.layout.photoWindow, `${context}: layout.photoWindow mismatch`);
}

export interface PreviewObservation {
  presentation: CanonicalPresentation;
  props: Record<string, unknown>;
  photoArtRendered: boolean;
  signatureSparkRendered: boolean;
  headlineWidthStyle?: string;
  bodyWidthStyle?: string;
  colorStyle?: string;
}

export interface FinalObservation {
  presentation: CanonicalPresentation;
  document: CardDocument;
  metadata: ProductionRenderMetadata;
  svgHasSignatureMark: boolean;
  svgHasWatermark: boolean;
}

function isPreviewObservation(val: unknown): val is PreviewObservation {
  return typeof val === "object" && val !== null && "photoArtRendered" in val && "props" in val;
}

function isFinalObservation(val: unknown): val is FinalObservation {
  return typeof val === "object" && val !== null && "document" in val && "metadata" in val;
}

export function assertPreviewFinalParity(
  first: CanonicalPresentation,
  second: CanonicalPresentation | PreviewObservation,
  third?: FinalObservation | string,
  fourth = "Preview ↔ Final Parity"
): void {
  if (isPreviewObservation(second) && isFinalObservation(third)) {
    const canonical = first;
    const preview = second;
    const final = third;
    const label = fourth;

    // 1. Cross-check authoritative canonical presentation identity
    assertCanonicalParity(preview.presentation, canonical, `${label}: preview.presentation vs canonical`);
    assertCanonicalParity(final.presentation, canonical, `${label}: final.presentation vs canonical`);
    assertCanonicalParity(preview.presentation, final.presentation, `${label}: preview vs final presentation`);

    // 2. Preview data identity
    assert.equal(preview.props["data-template-id"], canonical.templateId, `${label}: data-template-id`);
    assert.equal(preview.props["data-template-version-id"], canonical.templateVersionId, `${label}: data-template-version-id`);
    assert.equal(preview.props["data-renderer-template-key"], canonical.rendererTemplateKey, `${label}: data-renderer-template-key`);
    assert.equal(preview.props["data-archetype"], canonical.archetype, `${label}: data-archetype`);
    assert.equal(preview.props["data-visual-direction"], canonical.visualDirection, `${label}: data-visual-direction`);

    // 3. Preview class propagation
    const className = String(preview.props.className ?? "");
    assert.ok(className.includes(`card-${canonical.visualDirection}`), `${label}: class card-${canonical.visualDirection}`);
    assert.ok(className.includes(`template-${canonical.rendererTemplateKey}`), `${label}: class template-${canonical.rendererTemplateKey}`);
    assert.ok(className.includes(`archetype-${canonical.archetype}`), `${label}: class archetype-${canonical.archetype}`);

    // 4. Photo behavior parity
    if (canonical.photoRequired) {
      assert.equal(preview.photoArtRendered, true, `${label}: photo-required preview must render photo-art`);
      assert.ok(final.document.artworkAssetIds.length > 0, `${label}: photo-required final doc must carry artwork asset`);
    } else if (!canonical.photoSupported) {
      assert.equal(preview.photoArtRendered, false, `${label}: photo-unsupported preview must NOT render photo-art`);
      assert.equal(final.document.artworkAssetIds.length, 0, `${label}: photo-unsupported final doc must not carry photo asset`);
    }

    // 5. Final document & metadata identity
    assert.equal(final.document.templateId, canonical.rendererTemplateKey, `${label}: doc templateId must match rendererTemplateKey`);
    assert.equal(final.document.presentation?.templateId, canonical.templateId, `${label}: doc presentation templateId`);
    assert.equal(final.document.presentation?.templateVersionId, canonical.templateVersionId, `${label}: doc presentation templateVersionId`);
    assert.equal(final.metadata.format, final.document.format, `${label}: metadata format`);
    assert.ok(
      final.metadata.deterministicKey.includes(canonical.templateId),
      `${label}: deterministicKey must contain canonical templateId`
    );
    assert.ok(
      final.metadata.deterministicKey.includes(canonical.templateVersionId),
      `${label}: deterministicKey must contain canonical templateVersionId`
    );

    // 6. Layout spark parity
    assert.equal(
      preview.signatureSparkRendered,
      canonical.layout.showSignatureMark,
      `${label}: preview spark must match layout.showSignatureMark`
    );
    return;
  }

  // Canonical presentation direct comparison
  if (!isPreviewObservation(second)) {
    const context = typeof third === "string" ? third : fourth;
    assertCanonicalParity(first, second, context);
  }
}

function extractPreviewObservation(
  previewEl: ReturnType<typeof CardVisual>,
  presentation: CanonicalPresentation
): PreviewObservation {
  const props = previewEl.props;
  const children = Array.isArray(props.children) ? props.children : [];

  const cardArt = children.find((c: unknown) => {
    if (typeof c !== "object" || c === null || !("props" in c)) return false;
    const p = (c as { props?: unknown }).props;
    return typeof p === "object" && p !== null && "className" in p && (p as { className?: unknown }).className === "card-art";
  });
  const cardArtChildrenRaw = cardArt && typeof cardArt === "object" && "props" in cardArt
    ? (cardArt as { props?: { children?: unknown } }).props?.children
    : undefined;
  const cardArtChildren = Array.isArray(cardArtChildrenRaw)
    ? cardArtChildrenRaw
    : cardArtChildrenRaw ? [cardArtChildrenRaw] : [];
  const photoArtSpan = cardArtChildren.find((c: unknown) => {
    if (typeof c !== "object" || c === null || !("props" in c)) return false;
    const p = (c as { props?: unknown }).props;
    return typeof p === "object" && p !== null && "className" in p && (p as { className?: unknown }).className === "photo-art";
  });

  const cardCopy = children.find((c: unknown) => {
    if (typeof c !== "object" || c === null || !("props" in c)) return false;
    const p = (c as { props?: unknown }).props;
    return typeof p === "object" && p !== null && "className" in p && (p as { className?: unknown }).className === "card-copy";
  });
  const cardCopyChildrenRaw = cardCopy && typeof cardCopy === "object" && "props" in cardCopy
    ? (cardCopy as { props?: { children?: unknown } }).props?.children
    : undefined;
  const cardCopyChildren = Array.isArray(cardCopyChildrenRaw)
    ? cardCopyChildrenRaw
    : cardCopyChildrenRaw ? [cardCopyChildrenRaw] : [];
  const sparkSpan = cardCopyChildren.find((c: unknown) => {
    if (typeof c !== "object" || c === null || !("props" in c)) return false;
    const p = (c as { props?: unknown }).props;
    return typeof p === "object" && p !== null && "className" in p && (p as { className?: unknown }).className === "card-spark";
  });

  const styleObj = (typeof props.style === "object" && props.style !== null)
    ? (props.style as Record<string, string | number | undefined>)
    : {};

  return {
    presentation,
    props: props as Record<string, unknown>,
    photoArtRendered: photoArtSpan !== undefined,
    signatureSparkRendered: sparkSpan !== undefined,
    headlineWidthStyle: typeof styleObj["--magic-headline-width"] === "string" ? styleObj["--magic-headline-width"] : undefined,
    bodyWidthStyle: typeof styleObj["--magic-body-width"] === "string" ? styleObj["--magic-body-width"] : undefined,
    colorStyle: typeof styleObj.color === "string" ? styleObj.color : undefined
  };
}

async function main() {
  console.log("Running PREVIEW_TEMPLATE_PARITY stress suite (P21R2T03)...");

  const photoBytes = await getTestPhotoBytes();
  const testPhotoAssetId = "11111111-1111-4111-8111-111111111111";
  const testAssets = {
    [testPhotoAssetId]: {
      bytes: photoBytes,
      contentType: "image/jpeg" as const
    }
  };

  // ============================================================================
  // 1. Representative Portfolio Set Verification (Preview ↔ Final Parity)
  // ============================================================================
  // Representative managed fixtures: light editorial, dark, tactile, photo
  const representatives = [
    { slug: "luxury-editorial", expectedArchetype: "editorial", category: "editorial" },
    { slug: "midnight-lume", expectedArchetype: "midnight", category: "dark" },
    { slug: "night-ledger", expectedArchetype: "midnight", category: "dark" },
    { slug: "classic-letterpress", expectedArchetype: "quiet", category: "tactile" },
    { slug: "pressed-shadow", expectedArchetype: "editorial", category: "tactile" },
    { slug: "photo-story", expectedArchetype: "photo", category: "photo" },
    { slug: "memory-window", expectedArchetype: "editorial", category: "photo" }
  ];

  for (const rep of representatives) {
    const tmpl = portfolioV2AllTemplates.find(t => t.slug === rep.slug);
    assert.ok(tmpl, `representative template '${rep.slug}' must exist in catalog`);

    // 1A. Authoritative server-owned canonical presentation resolution
    const presentation = resolveCanonicalPresentation({
      templateId: tmpl.id,
      templateVersionId: tmpl.versionId,
      hasPhoto: tmpl.photoMode === "required" ? true : undefined
    });

    assert.equal(presentation.templateId, tmpl.id, `${rep.slug}: templateId must match managed catalog`);
    assert.equal(presentation.templateVersionId, tmpl.versionId, `${rep.slug}: templateVersionId must match managed catalog`);
    assert.equal(presentation.rendererTemplateKey, tmpl.rendererTemplateKey, `${rep.slug}: rendererTemplateKey must match`);
    assert.equal(presentation.archetype, rep.expectedArchetype, `${rep.slug}: archetype must match`);
    assert.equal(presentation.visualDirection, tmpl.visualDirection, `${rep.slug}: visualDirection must match`);
    assert.equal(presentation.material, tmpl.material, `${rep.slug}: material must match`);
    assert.equal(presentation.colorWorld, tmpl.colorWorld, `${rep.slug}: colorWorld must match`);
    assert.equal(presentation.motionProfile, tmpl.motionProfile, `${rep.slug}: motionProfile must match`);
    assert.equal(presentation.energy, tmpl.energy, `${rep.slug}: energy must match`);
    assert.ok(presentation.layout, `${rep.slug}: layout profile must exist`);
    assert.equal(typeof presentation.layout.headlineScale, "number");
    assert.equal(typeof presentation.layout.bodyScale, "number");
    assert.equal(typeof presentation.layout.showSignatureMark, "boolean");

    // Schema conformance
    const parsedPres = CanonicalPresentationSchema.parse(presentation);
    assert.deepEqual(parsedPres, presentation);

    // ============================================================================
    // 1B. Preview Component Parity: CardVisual Consumes CanonicalPresentation
    // ============================================================================
    const previewEl = CardVisual({
      presentation,
      direction: tmpl.visualDirection,
      kicker: "FOR YOUR DAY",
      headline: "A Celebrated Year",
      body: "Wishing you peace, joy and beautiful moments.",
      photoUrl: presentation.photoSupported ? "blob:cardelume/test-photo" : null,
      photoPalette: presentation.photoSupported ? {
        primary: "#112233", secondary: "#445566", accent: "#778899",
        temperature: "warm", luminance: 0.5, note: "Warm tone", confidence: 0.9, softened: false
      } : null,
      requirePresentation: true
    });

    assert.ok(previewEl, `${rep.slug}: CardVisual must render a valid element`);
    const previewObs = extractPreviewObservation(previewEl, presentation);
    const props = previewObs.props;

    // Check exact identity attributes
    assert.equal(props["data-template-id"], tmpl.id, `${rep.slug}: data-template-id must match exact templateId`);
    assert.equal(props["data-template-version-id"], tmpl.versionId, `${rep.slug}: data-template-version-id must match exact versionId`);
    assert.equal(props["data-renderer-template-key"], tmpl.rendererTemplateKey, `${rep.slug}: data-renderer-template-key must match`);
    assert.equal(props["data-archetype"], rep.expectedArchetype, `${rep.slug}: data-archetype must match`);
    assert.equal(props["data-visual-direction"], tmpl.visualDirection, `${rep.slug}: data-visual-direction must match`);

    // Check class names
    assert.ok(String(props.className).includes(`card-${tmpl.visualDirection}`), `${rep.slug}: className must include card-${tmpl.visualDirection}`);
    assert.ok(String(props.className).includes(`template-${tmpl.rendererTemplateKey}`), `${rep.slug}: className must include template-${tmpl.rendererTemplateKey}`);
    assert.ok(String(props.className).includes(`archetype-${rep.expectedArchetype}`), `${rep.slug}: className must include archetype-${rep.expectedArchetype}`);

    // Check layout and typography profile propagation into inline styles
    assert.ok(props.style, `${rep.slug}: props.style must exist`);
    const styleMap = props.style as Record<string, string | number | undefined>;
    assert.ok(styleMap["--magic-headline"], `${rep.slug}: --magic-headline must be set`);
    assert.ok(styleMap["--magic-body"], `${rep.slug}: --magic-body must be set`);
    assert.ok(styleMap["--magic-headline-width"], `${rep.slug}: --magic-headline-width must be set`);
    assert.ok(styleMap["--magic-body-width"], `${rep.slug}: --magic-body-width must be set`);

    // Dark surface check
    if (presentation.layout.darkSurface) {
      assert.ok(
        styleMap.color === "#f4ead9",
        `${rep.slug}: dark surface layout must set dark color style`
      );
    }

    // Photo compatibility check in CardVisual
    if (!presentation.photoSupported) {
      assert.equal(previewObs.photoArtRendered, false, `${rep.slug}: photo-none template must NOT render photo-art`);
    } else if (presentation.photoMode === "required") {
      assert.equal(previewObs.photoArtRendered, true, `${rep.slug}: photo-required template with photoUrl MUST render photo-art`);
    }

    // ============================================================================
    // 1C. Final Document Assembly & Production Renderer Seam Parity
    // ============================================================================
    const hasPhoto = presentation.photoRequired;
    const snapshot: CheckoutCardSnapshot = {
      locale: "en",
      format: "portrait-5x7",
      direction: rep.expectedArchetype as "editorial" | "midnight" | "photo" | "quiet",
      templateId: tmpl.id,
      templateVersionId: tmpl.versionId,
      presentation,
      templateSource: "ai_direction",
      occasion: "Birthday",
      relationship: "Friend",
      feeling: "Warm",
      kicker: "FOR YOUR DAY",
      headline: "A Celebrated Year",
      body: "Wishing you peace, joy and beautiful moments.",
      accentMode: hasPhoto ? "photo" : "original",
      photoAssetId: hasPhoto ? testPhotoAssetId : undefined,
      photoPalette: hasPhoto ? {
        primary: "#112233", secondary: "#445566", accent: "#778899",
        temperature: "warm", luminance: 0.5
      } : undefined,
      visualDirection: presentation.visualDirection
    };

    const parsedSnapshot = CheckoutCardSnapshotSchema.parse(snapshot);
    assert.ok(parsedSnapshot.presentation, `${rep.slug}: snapshot must carry canonical presentation`);
    assert.equal(parsedSnapshot.presentation.templateId, tmpl.id);
    assert.equal(parsedSnapshot.presentation.templateVersionId, tmpl.versionId);
    assert.equal(parsedSnapshot.presentation.rendererTemplateKey, tmpl.rendererTemplateKey);

    const exportDoc: CardDocument = buildCheckoutCardDocument({
      versionId: "22222222-2222-4222-8222-222222222222",
      snapshot,
      managedTemplate: {
        rendererTemplateKey: tmpl.rendererTemplateKey,
        version: tmpl.version,
        templateVersionId: tmpl.versionId,
        photoMode: tmpl.photoMode,
        presentation
      }
    });

    const parsedDoc = CardDocumentSchema.parse(exportDoc);
    assert.ok(parsedDoc.presentation, `${rep.slug}: exported CardDocument must preserve canonical presentation`);
    assert.equal(parsedDoc.presentation.templateId, tmpl.id, `${rep.slug}: doc presentation templateId must match`);
    assert.equal(parsedDoc.presentation.templateVersionId, tmpl.versionId, `${rep.slug}: doc presentation templateVersionId must match`);
    assert.equal(parsedDoc.presentation.rendererTemplateKey, tmpl.rendererTemplateKey, `${rep.slug}: doc presentation rendererTemplateKey must match`);
    assert.equal(parsedDoc.templateId, tmpl.rendererTemplateKey, `${rep.slug}: doc templateId must match rendererTemplateKey`);

    // Invoke production final renderer resolver
    const finalResult = await renderProductionFinal(exportDoc, {
      assets: hasPhoto ? testAssets : undefined,
      presentation
    });
    assert.ok(finalResult.jpg.length > 0, `${rep.slug}: final jpg must be generated`);
    assert.ok(finalResult.pdf.length > 0, `${rep.slug}: final pdf must be generated`);

    // Invoke production SVG renderers
    const finalSvg = renderFinalSvg(
      exportDoc,
      hasPhoto ? testAssets : undefined,
      presentation
    );
    assert.ok(finalSvg.length > 0, `${rep.slug}: final SVG must be generated`);
    assert.ok(!finalSvg.includes("preview-watermark"), `${rep.slug}: final SVG must not contain watermark`);

    const previewSvg = renderPreviewSvg(
      exportDoc,
      hasPhoto ? testAssets : undefined,
      presentation
    );
    assert.ok(previewSvg.includes("preview-watermark"), `${rep.slug}: preview SVG must contain watermark`);

    // Returned metadata and renderer identity checks against the same canonical presentation
    assert.ok(finalResult.metadata.presentation, `${rep.slug}: metadata presentation must exist`);
    assert.equal(finalResult.metadata.presentation.templateId, tmpl.id);
    assert.equal(finalResult.metadata.presentation.templateVersionId, tmpl.versionId);
    assert.equal(finalResult.metadata.presentation.rendererTemplateKey, tmpl.rendererTemplateKey);
    assert.equal(finalResult.metadata.format, exportDoc.format);
    assert.equal(finalResult.metadata.rendererVersion, CURRENT_RENDERER_VERSION);
    assert.ok(finalResult.metadata.deterministicKey.includes(tmpl.id));
    assert.ok(finalResult.metadata.deterministicKey.includes(tmpl.versionId));

    // Exercise paired Preview ↔ Final parity assertion across all authoritative fields
    const finalObs: FinalObservation = {
      presentation: finalResult.metadata.presentation,
      document: exportDoc,
      metadata: finalResult.metadata,
      svgHasSignatureMark: finalSvg.includes("✦"),
      svgHasWatermark: false
    };

    assertPreviewFinalParity(presentation, previewObs, finalObs, `${rep.slug} preview ↔ final parity`);
  }

  console.log("GOOD_PARITY_FIXTURES=PASS");

  // ============================================================================
  // 2. Deliberate Mismatch Negatives (Authoritative Parity Rejection Proof)
  // ============================================================================
  const luxuryTmpl = bootstrapTemplates.find(t => t.slug === "luxury-editorial");
  const midnightTmpl = bootstrapTemplates.find(t => t.slug === "midnight-lume");
  const classicTmpl = bootstrapTemplates.find(t => t.slug === "classic-letterpress");
  assert.ok(luxuryTmpl && midnightTmpl && classicTmpl, "bootstrap templates must exist");

  const luxuryPres = resolveCanonicalPresentation({
    templateId: luxuryTmpl.id,
    templateVersionId: luxuryTmpl.versionId
  });
  const midnightPres = resolveCanonicalPresentation({
    templateId: midnightTmpl.id,
    templateVersionId: midnightTmpl.versionId
  });
  const classicPres = resolveCanonicalPresentation({
    templateId: classicTmpl.id,
    templateVersionId: classicTmpl.versionId
  });

  // 2A. Wrong template ID pair: two existing resolved canonical presentations
  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, midnightPres),
    "templateId mismatch",
    "two distinct resolved canonical presentations must be rejected on templateId mismatch"
  );

  // 2B. Wrong version ID pair
  const wrongVersionPres: CanonicalPresentation = {
    ...luxuryPres,
    templateVersionId: "00000000-0000-4000-8000-999999999999"
  };
  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, wrongVersionPres),
    "templateVersionId mismatch",
    "mismatched templateVersionId must be rejected"
  );

  // 2C. Wrong renderer key pair
  const wrongRendererPres: CanonicalPresentation = {
    ...luxuryPres,
    rendererTemplateKey: "classic-letterpress"
  };
  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, wrongRendererPres),
    "rendererTemplateKey mismatch",
    "mismatched rendererTemplateKey must be rejected"
  );

  // 2D. In-memory layout shift negative (anchor, headlineScale, showSignatureMark)
  const shiftedLayoutPres: CanonicalPresentation = {
    ...luxuryPres,
    layout: {
      ...luxuryPres.layout,
      anchor: "start",
      headlineScale: 1.35,
      showSignatureMark: false
    }
  };
  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, shiftedLayoutPres),
    "layout.anchor mismatch",
    "shifted layout anchor must be rejected by parity assertion"
  );

  // 2E. In-memory typography shift negative (typographyId, capacity)
  const shiftedTypographyPres: CanonicalPresentation = {
    ...luxuryPres,
    typographyId: "modern-sans",
    headlineCapacity: "short"
  };
  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, shiftedTypographyPres),
    "typographyId mismatch",
    "shifted typographyId must be rejected by parity assertion"
  );

  // 2F. Cross Preview ↔ Final pipeline mismatch
  const luxuryPreviewEl = CardVisual({
    presentation: luxuryPres,
    direction: luxuryPres.visualDirection,
    kicker: "FOR YOUR DAY",
    headline: "Luxury Editorial",
    body: "Deliberate mismatch verification.",
    requirePresentation: true
  });
  const luxuryPreviewObs = extractPreviewObservation(luxuryPreviewEl, luxuryPres);

  const mismatchedFinalDoc = buildCheckoutCardDocument({
    versionId: "44444444-4444-4444-8444-444444444444",
    snapshot: {
      locale: "en",
      format: "portrait-5x7",
      direction: "quiet",
      templateId: classicTmpl.id,
      templateVersionId: classicTmpl.versionId,
      presentation: classicPres,
      occasion: "Birthday",
      relationship: "Friend",
      feeling: "Warm",
      kicker: "FOR YOUR DAY",
      headline: "Classic Letterpress",
      body: "Deliberate mismatch verification.",
      accentMode: "original",
      visualDirection: classicPres.visualDirection
    },
    managedTemplate: {
      rendererTemplateKey: classicTmpl.rendererTemplateKey,
      version: classicTmpl.version,
      templateVersionId: classicTmpl.versionId,
      photoMode: classicTmpl.photoMode,
      presentation: classicPres
    }
  });

  const mismatchedFinalObs: FinalObservation = {
    presentation: classicPres,
    document: mismatchedFinalDoc,
    metadata: {
      format: "portrait-5x7",
      rendererVersion: CURRENT_RENDERER_VERSION,
      deterministicKey: `test:${CURRENT_RENDERER_VERSION}:1:${classicTmpl.id}:${classicTmpl.versionId}:portrait-5x7`,
      presentation: classicPres,
      jpg: { widthPx: 1500, heightPx: 2100, dpi: 300, contentType: "image/jpeg" },
      pdf: { widthIn: 5, heightIn: 7, pageCount: 1, contentType: "application/pdf", layout: "single-page" }
    },
    svgHasSignatureMark: classicPres.layout.showSignatureMark,
    svgHasWatermark: false
  };

  mustThrow(
    () => assertPreviewFinalParity(luxuryPres, luxuryPreviewObs, mismatchedFinalObs, "cross pipeline mismatch"),
    "templateId mismatch",
    "cross paired preview luxury and final classic must be rejected on templateId mismatch"
  );

  console.log("WRONG_TEMPLATE_NEGATIVE=FAIL_AS_EXPECTED");

  // ============================================================================
  // 4. Adversarial Invariants & Fail-Safe Verification
  // ============================================================================
  // 4A. Fail-safe: CardVisual must NOT silently substitute a generic visualDirection
  // when requirePresentation is true and presentation is missing
  const failSafeEl = CardVisual({
    requirePresentation: true,
    direction: "editorial",
    headline: "Secret Card",
    body: "Should not silently render generic direction"
  });
  assert.ok(failSafeEl.props.className.includes("paper-card-unavailable"), "CardVisual must fail safe when presentation is missing");
  assert.ok(
    JSON.stringify(failSafeEl.props).includes("Preview unavailable"),
    "CardVisual fail safe element must render preview unavailable message"
  );

  // 4B. Fail-safe when both presentation and direction are omitted
  const emptyEl = CardVisual({
    headline: "No Direction",
    body: "No Presentation"
  });
  assert.ok(emptyEl.props.className.includes("paper-card-unavailable"), "CardVisual must fail safe when both presentation and direction are missing");

  // 4C. Adversarial Slot Drift: Non-midnight template selected in slot 'midnight'
  // Preview and export must consume the selected template's presentation, NOT midnight-lume
  const classic = bootstrapTemplates.find(t => t.slug === "classic-letterpress")!;
  assert.ok(classic, "classic-letterpress must exist");
  const slotClassicPres = resolveCanonicalPresentation({
    templateId: classic.id,
    templateVersionId: classic.versionId
  });

  // Render in Studio preview with slot = "midnight", but presentation = classic-letterpress
  const mismatchedSlotPreview = CardVisual({
    presentation: slotClassicPres,
    direction: slotClassicPres.visualDirection,
    requirePresentation: true,
    headline: "Quiet Moment",
    body: "Sent with warmth"
  });
  assert.equal(
    mismatchedSlotPreview.props["data-template-id"],
    classic.id,
    "slot 'midnight' preview must bind exact classic-letterpress templateId"
  );
  assert.equal(
    mismatchedSlotPreview.props["data-renderer-template-key"],
    "classic-letterpress",
    "slot 'midnight' preview must bind classic-letterpress renderer key, never midnight-lume"
  );
  assert.notEqual(
    mismatchedSlotPreview.props["data-renderer-template-key"],
    "midnight-lume",
    "slot 'midnight' preview must NEVER drift into midnight-lume"
  );

  // Snapshot from mismatched slot: must preserve classic-letterpress presentation
  const mismatchedSnapshot: CheckoutCardSnapshot = {
    locale: "en",
    format: "portrait-5x7",
    direction: "midnight", // slot routing
    templateId: classic.id,
    templateVersionId: classic.versionId,
    presentation: slotClassicPres,
    occasion: "Birthday",
    relationship: "Friend",
    feeling: "Warm",
    kicker: "FOR YOU",
    headline: "Quiet Moment",
    body: "Sent with warmth",
    accentMode: "original",
    visualDirection: slotClassicPres.visualDirection
  };
  const docFromMismatchedSlot = buildCheckoutCardDocument({
    versionId: "33333333-3333-4333-8333-333333333333",
    snapshot: mismatchedSnapshot,
    managedTemplate: {
      rendererTemplateKey: classic.rendererTemplateKey,
      version: classic.version,
      templateVersionId: classic.versionId,
      photoMode: classic.photoMode,
      presentation: slotClassicPres
    }
  });
  assert.equal(docFromMismatchedSlot.templateId, "classic-letterpress", "doc must render classic-letterpress, not midnight-lume");
  assert.equal(docFromMismatchedSlot.presentation?.rendererTemplateKey, "classic-letterpress");

  // 4D. Rejection of visualDirection alone without managed identity
  mustThrow(
    () => assertCanonicalPresentationIdentity({ visualDirection: "editorial" }),
    "invalid_presentation_identity",
    "visualDirection alone must be rejected"
  );
  mustThrow(
    () => CheckoutCardSnapshotSchema.parse({
      locale: "en",
      format: "portrait-5x7",
      direction: "editorial",
      occasion: "Birthday",
      relationship: "Friend",
      feeling: "Warm",
      kicker: "K",
      headline: "H",
      body: "B",
      accentMode: "original",
      visualDirection: "editorial" // without templateId + templateVersionId
    }),
    "invalid_presentation_identity",
    "CheckoutCardSnapshotSchema must reject visualDirection alone without managed identity"
  );

  // 4E. Rejection of presentation templateId mismatch with snapshot templateId
  const luxury = bootstrapTemplates.find(t => t.slug === "luxury-editorial")!;
  assert.ok(luxury);
  const snapshotLuxuryPres = resolveCanonicalPresentation({
    templateId: luxury.id,
    templateVersionId: luxury.versionId
  });
  mustThrow(
    () => CheckoutCardSnapshotSchema.parse({
      locale: "en",
      format: "portrait-5x7",
      direction: "editorial",
      templateId: classic.id, // classic ID
      templateVersionId: classic.versionId,
      presentation: snapshotLuxuryPres, // luxury presentation (mismatch!)
      occasion: "Birthday",
      relationship: "Friend",
      feeling: "Warm",
      kicker: "K",
      headline: "H",
      body: "B",
      accentMode: "original"
    }),
    "presentation_template_id_mismatch",
    "CheckoutCardSnapshotSchema must reject presentation templateId mismatch"
  );

  // ============================================================================
  // 5. Static Source Audits (Component Wiring & Guards)
  // ============================================================================
  const visualSource = read("apps/web/components/card-visual.tsx");
  const studioSource = read("apps/web/components/card-studio.tsx");

  // CardVisual contract checks
  assert.ok(
    visualSource.includes("CanonicalPresentation"),
    "card-visual.tsx must import and type CanonicalPresentation"
  );
  assert.ok(
    visualSource.includes("requirePresentation"),
    "card-visual.tsx must support requirePresentation flag"
  );
  assert.ok(
    visualSource.includes("paper-card-unavailable"),
    "card-visual.tsx must include fail-safe paper-card-unavailable class"
  );
  assert.ok(
    visualSource.includes("data-template-id={presentation?.templateId}"),
    "card-visual.tsx must set data-template-id on root card"
  );
  assert.ok(
    visualSource.includes("data-template-version-id={presentation?.templateVersionId}"),
    "card-visual.tsx must set data-template-version-id on root card"
  );
  assert.ok(
    visualSource.includes("data-renderer-template-key={presentation?.rendererTemplateKey}"),
    "card-visual.tsx must set data-renderer-template-key on root card"
  );

  // CardStudio contract checks
  assert.ok(
    studioSource.includes("presentation={presentation}"),
    "card-studio.tsx must pass presentation to CardVisual in results"
  );
  assert.ok(
    studioSource.includes("presentation={selected.presentation}"),
    "card-studio.tsx must pass selected.presentation to CardVisual in finish and checkout"
  );
  assert.ok(
    studioSource.includes("requirePresentation"),
    "card-studio.tsx must pass requirePresentation to CardVisual"
  );
  assert.ok(
    studioSource.includes("!selected.presentation"),
    "card-studio.tsx must guard checkout/download against missing selected.presentation"
  );
  assert.ok(
    studioSource.includes("!direction.presentation"),
    "card-studio.tsx must guard choose against missing direction.presentation"
  );
  assert.ok(
    studioSource.includes("presentation:selected.presentation"),
    "card-studio.tsx must pass presentation in buildCardSnapshot"
  );

  // Critical regressions: must preserve existing handlers, copy, and checkout fields
  assert.ok(
    studioSource.includes("templateVersionId:selected.templateVersionId"),
    "card-studio.tsx must preserve templateVersionId in checkout snapshot"
  );
  assert.ok(
    studioSource.includes("templateSource:selected.templateSource"),
    "card-studio.tsx must preserve templateSource in checkout snapshot"
  );
  assert.ok(
    !studioSource.includes("setUsedCuratedFallback(true)"),
    "card-studio.tsx must not restore curated presentation identity after an error"
  );

  // ============================================================================
  // 6. Status Completion
  // ============================================================================
  console.log("PREVIEW_FINAL_PARITY=PASS");
  console.log("PREVIEW_TEMPLATE_PARITY=PASS");
}

main().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
