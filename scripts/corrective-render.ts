import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_RENDERER_VERSION,
  fitTypography,
  getCardFormatSpec,
  rendererFontConfig,
  renderFinalSvg,
  renderPreviewSvg,
  renderProductionFinal,
  renderProductionPreview,
  type CardDocument,
  type CanonicalPresentation
} from "@cardelume/renderer";

function doc(input: Partial<CardDocument> = {}): CardDocument {
  return {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    rendererVersion: CURRENT_RENDERER_VERSION,
    marketPackVersion: "2026.08",
    id: "00000000-0000-4000-8000-000000000001",
    locale: "en",
    format: "portrait-5x7",
    templateId: "luxury-editorial",
    paletteId: "editorial-ivory",
    typographyId: "editorial-serif",
    artworkAssetIds: [],
    textBlocks: [
      { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
      { id: "headline", role: "headline", align: "center", text: "A beautiful year awaits." },
      { id: "body", role: "body", align: "center", text: "May it bring you more of what makes you feel most like yourself." }
    ],
    metadata: { occasion: "Birthday", relationship: "Friend", feeling: "Elegant" },
    ...input
  };
}

function text(doc: CardDocument, role: "headline" | "body") {
  return doc.textBlocks.find(block => block.role === role)?.text ?? "";
}

function withoutWatermark(svg: string) {
  return svg.replace(/\s*<g aria-label="preview-watermark"[\s\S]*?<\/g>/, "").replace(/\s+/g, " ").trim();
}

function renderedText(svg: string) {
  return [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(match => match[1] ?? "").join(" ").replace(/\s+/g, " ").trim();
}

function expectThrows(action: () => unknown, pattern: RegExp, label: string) {
  assert.throws(action, pattern, label);
}

async function main() {
// Preview and final use one renderer/layout/font contract; the only intentional
// difference is the preview watermark.
for (const templateId of ["luxury-editorial", "midnight-lume", "museum-note", "memory-window"] as const) {
  const input = doc({ templateId });
  assert.equal(
    withoutWatermark(renderPreviewSvg(input)),
    withoutWatermark(renderFinalSvg(input)),
    `${templateId} preview/final SVG parity`
  );
}

// All production scripts use the same renderer version and preserve edited copy
// exactly in the source SVG before raster/PDF encoding.
const edited = doc({
  locale: "vi",
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "DÀNH CHO BẠN" },
    { id: "headline", role: "headline", align: "center", text: "Một năm thật đẹp đang chờ phía trước." },
    { id: "body", role: "body", align: "center", text: "Mong những ngày tới giữ nguyên sự ấm áp và bình yên anh đã chọn." }
  ]
});
const editedSvg = renderFinalSvg(edited);
const editedText = renderedText(editedSvg);
assert.ok(editedText.includes("Một năm thật đẹp đang chờ phía trước."), "VI edited headline remains exact");
assert.ok(editedText.includes("Mong những ngày tới giữ nguyên sự ấm áp và bình yên anh đã chọn."), "VI edited body remains exact");

const production = await renderProductionFinal(edited);
const preview = await renderProductionPreview(edited);
const spec = getCardFormatSpec(edited.format);
assert.equal(production.metadata.rendererVersion, CURRENT_RENDERER_VERSION);
assert.equal(production.metadata.jpg.widthPx, spec.front.widthPx);
assert.equal(production.metadata.jpg.heightPx, spec.front.heightPx);
assert.equal(preview.width <= spec.front.widthPx, true, "preview is a downscaled production render");
assert.equal(preview.height <= spec.front.heightPx, true, "preview preserves production aspect bounds");

// A managed presentation must match the document's exact renderer identity;
// wrong template/version or missing copy fails closed instead of substituting.
const presentation = {
  templateId: "10000000-0000-4000-8000-000000000001",
  templateVersionId: "30000000-0000-4000-8000-000000000001",
  rendererTemplateKey: "luxury-editorial",
  visualDirection: "editorial",
  archetype: "editorial",
  name: "Luxury Editorial",
  material: "cotton paper",
  typographyId: "editorial-serif",
  headlineCapacity: "medium",
  bodyCapacity: "medium",
  scriptSupport: ["latin", "cjk", "hangul"],
  photoMode: "none",
  photoSupported: false,
  photoRequired: false,
  materialWorld: "editorial_luxury",
  colorWorld: "ivory",
  motionProfile: "foil_light",
  energy: "quiet",
  layout: {
    anchor: "middle", xPct: .5, kickerYPct: .267, headlineYPct: .43, bodyYPct: .59,
    signatureYPct: .755, headlineWidthPct: 88, bodyWidthPct: 90, headlineScale: 1,
    bodyScale: 1, showBorder: true, showSignatureMark: true
  }
} as CanonicalPresentation;
assert.ok(renderedText(renderFinalSvg(doc({ presentation }), undefined, presentation)).includes("A beautiful year awaits."));
expectThrows(
  () => renderFinalSvg(doc({ presentation: { ...presentation, rendererTemplateKey: "midnight-lume" } }), undefined, presentation),
  /presentation_(?:template_mismatch|template_key_mismatch)/,
  "wrong renderer template fails closed"
);
expectThrows(
  () => renderFinalSvg(doc({ textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "" },
    { id: "headline", role: "headline", align: "center", text: "" },
    { id: "body", role: "body", align: "center", text: "" }
  ] }), undefined),
  /typography_copy_missing/,
  "blank copy fails closed"
);

// Representative scripts must resolve deterministic font ownership rather than
// silently selecting a browser-only font.
for (const locale of ["en", "vi", "ja", "ko", "zh"]) {
  const config = rendererFontConfig(locale);
  assert.ok(config.defaultFontFamily.length > 0, `${locale} renderer font family`);
}

// Keep the browser's bounded typography contract visible in this gate as well.
for (const locale of ["en", "vi", "ja", "ko", "zh"]) {
  const fit = fitTypography(text(doc({ locale }), "headline"), text(doc({ locale }), "body"), locale);
  assert.ok(fit.bodyPx > 0 && fit.bodyCssPx > 0, `${locale} typography contract`);
}

// The parity harness must not reintroduce the removed curated identity fallback.
const studioSource = readFileSync("apps/web/components/card-studio.tsx", "utf8");
assert.ok(!studioSource.includes("setUsedCuratedFallback(true)"), "renderer gate must not restore curated identity fallback");

console.log("PREVIEW_FINAL_SVG_PARITY=PASS");
console.log("VI_LONG_EDITED_COPY=PASS");
console.log("PRESENTATION_MISMATCH_FAIL_CLOSED=PASS");
console.log("FONT_OWNERSHIP_MATRIX=PASS");
console.log("CORRECTIVE_RENDER=PASS");
}

main().catch(error => {
  console.error("FAIL:", error);
  process.exit(1);
});
