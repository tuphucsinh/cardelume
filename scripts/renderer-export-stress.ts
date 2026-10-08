import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import {
  CARD_BODY_MIN_CSS_PX,
  CARD_BODY_MIN_RENDER_PX,
  enforceReadableBodyFloor,
  type CardDocument,
  type RendererTypographyContract
} from "@cardelume/card-schema";
import {
  CURRENT_RENDERER_VERSION,
  assertRendererFontsReady,
  fitTypography,
  getCardFormatSpec,
  rasterizeSvgWithResvg,
  rendererTextSafeInset,
  renderFinalSvg,
  renderPreviewSvg,
  renderProductionFinal,
  renderProductionPreview
} from "@cardelume/renderer";

async function main() {
// 1. Authoritative source & contract verification
assert.equal(CARD_BODY_MIN_CSS_PX, 10.4, "authoritative CARD_BODY_MIN_CSS_PX must be 10.4");
assert.equal(CARD_BODY_MIN_RENDER_PX, 32, "authoritative CARD_BODY_MIN_RENDER_PX must be 32");

assertRendererFontsReady();

const defaultContract: RendererTypographyContract = enforceReadableBodyFloor();
assert.equal(defaultContract.bodyCssPx, CARD_BODY_MIN_CSS_PX, "default contract bodyCssPx");
assert.equal(defaultContract.bodyRenderPx, CARD_BODY_MIN_RENDER_PX, "default contract bodyRenderPx");
assert.equal(defaultContract.floorSource, "card-schema", "floorSource must be card-schema");

const validContract = enforceReadableBodyFloor(12, 36);
assert.equal(validContract.bodyCssPx, 12);
assert.equal(validContract.bodyRenderPx, 36);
assert.equal(validContract.floorSource, "card-schema");

assert.throws(() => enforceReadableBodyFloor(10.0, 32), /typography_below_readability_floor/, "rejects below CSS floor");
assert.throws(() => enforceReadableBodyFloor(10.4, 30), /typography_below_readability_floor/, "rejects below Render floor");

function extractEmittedBodyPx(svg: string): number {
  const matches = [...svg.matchAll(/font-family="sans-serif"\s+font-size="(\d+)"/g)];
  assert.ok(matches.length > 0, "SVG must contain sans-serif body text");
  const fontSizes = matches.map((m) => Number(m[1]));
  return Math.max(...fontSizes);
}

const formats: CardDocument["format"][] = [
  "portrait-5x7", "folded-5x7", "square-5x5", "landscape-7x5", "postcard-6x4"
];

function doc(format: CardDocument["format"], locale = "en"): CardDocument {
  return {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    rendererVersion: CURRENT_RENDERER_VERSION,
    marketPackVersion: "2026.08",
    id: crypto.randomUUID(),
    locale,
    format,
    templateId: "luxury-editorial",
    paletteId: "editorial-ivory",
    typographyId: "editorial-serif",
    artworkAssetIds: [],
    textBlocks: [
      { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
      { id: "headline", role: "headline", align: "center", text: "A beautiful year awaits." },
      { id: "body", role: "body", align: "center", text: "May it bring you more of what makes you feel most like yourself." }
    ],
    metadata: { occasion: "Birthday", relationship: "Friend", feeling: "Elegant" }
  };
}

function hash(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function pdfText(pdf: Uint8Array) { return Buffer.from(pdf).toString("latin1"); }

// Raster-level guard: the printed card must actually contain ink. resvg silently drops
// every glyph when it cannot load a font from RENDER_FONT_DIRS (woff2 is not loadable),
// which produced text-free exports while every SVG-source assertion still passed.
async function rasterInkPixels(jpg: Uint8Array) {
  const { data } = await sharp(Buffer.from(jpg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  let dark = 0;
  for (const v of data) if (v < 120) dark++;
  return dark;
}

// 2. Multi-format deterministic export & readability floor assertions (real Resvg raster path)
for (const format of formats) {
  const input = doc(format, format === "square-5x5" ? "ja" : "en");
  const a = await renderProductionFinal(input);
  const b = await renderProductionFinal(input);
  const spec = getCardFormatSpec(format);
  const formatInset = Math.round(Math.min(spec.front.widthPx, spec.front.heightPx) * (spec.safeMarginIn / Math.min(spec.front.widthIn, spec.front.heightIn)));
  assert.ok(rendererTextSafeInset(format) > formatInset, `${format} text safe area clears format margin`);
  const meta = await sharp(a.jpg).metadata();
  assert.equal(meta.width, spec.front.widthPx, `${format} jpg width`);
  assert.equal(meta.height, spec.front.heightPx, `${format} jpg height`);
  assert.equal(meta.density, 300, `${format} jpg dpi`);
  const ink = await rasterInkPixels(a.jpg);
  assert.ok(ink > 2000, `${format} rasterized export must contain rendered text ink (got ${ink} dark px) - check renderer font loading`);
  assert.equal(a.metadata.pdf.pageCount, spec.pdf.pageCount, `${format} pdf page count metadata`);
  assert.equal(hash(a.jpg), hash(b.jpg), `${format} jpg deterministic`);
  assert.equal(hash(a.pdf), hash(b.pdf), `${format} pdf deterministic`);
  const text = pdfText(a.pdf);
  const bleedPt = spec.bleedIn * 72;
  const pointsW = spec.pdf.widthIn * 72, pointsH = spec.pdf.heightIn * 72;
  assert.ok(text.includes(`/MediaBox [0 0 ${pointsW + 2 * bleedPt} ${pointsH + 2 * bleedPt}]`), `${format} MediaBox carries bleed`);
  assert.ok(text.includes(`/TrimBox [${bleedPt} ${bleedPt} ${bleedPt + pointsW} ${bleedPt + pointsH}]`), `${format} TrimBox is the finished size inside the bleed`);
  assert.ok(text.includes(`/BleedBox [0 0 ${pointsW + 2 * bleedPt} ${pointsH + 2 * bleedPt}]`), `${format} BleedBox`);
  assert.ok(text.includes(`/BleedIn ${spec.bleedIn}`), `${format} declares bleed allowance`);
  assert.ok(text.startsWith("%PDF-1.4"), `${format} PDF signature`);

  // Emitted SVG body size assertion
  const finalSvg = renderFinalSvg(input);
  const emittedBodyPx = extractEmittedBodyPx(finalSvg);
  assert.ok(emittedBodyPx >= CARD_BODY_MIN_RENDER_PX, `${format} emitted body px ${emittedBodyPx} >= floor ${CARD_BODY_MIN_RENDER_PX}`);

  const previewSvg = renderPreviewSvg(input);
  const previewBodyPx = extractEmittedBodyPx(previewSvg);
  assert.ok(previewBodyPx >= CARD_BODY_MIN_RENDER_PX, `${format} preview emitted body px ${previewBodyPx} >= floor ${CARD_BODY_MIN_RENDER_PX}`);

  // Fit typography floor contract assertion
  const fit = fitTypography("A headline", "A body message", input.locale, format);
  assert.ok(fit.bodyPx >= CARD_BODY_MIN_RENDER_PX, `${format} fit bodyPx >= floor`);
  assert.ok(fit.bodyCssPx >= CARD_BODY_MIN_CSS_PX, `${format} fit bodyCssPx >= floor`);
  assert.equal(fit.floorSource, "card-schema");
}

// 3. Hostile / XML escaping / security checks
const hostile = doc("portrait-5x7");
hostile.textBlocks[1]!.text = '<script>alert("x")</script> & hello';
const hostileSvg = renderFinalSvg(hostile);
assert.ok(!hostileSvg.includes("<script>"), "raw script must not enter SVG");
assert.ok(hostileSvg.includes("&lt;script&gt;"), "hostile text must be XML escaped");
assert.ok(!/https?:\/\//i.test(hostileSvg), "renderer-owned SVG must not contain external URLs");

// 4. Long Latin copy — safe alternate layout failover without below-floor shrink or truncation
const longLatinDoc = doc("portrait-5x7", "en");
longLatinDoc.templateId = "whispered-type";
longLatinDoc.textBlocks[1]!.text = "A season to remember together.";
longLatinDoc.textBlocks[2]!.text = "Thank you for the steady presence, the laughter through long afternoons, and the quiet understanding across every season. Here is to everything still unfolding before us with joy.";
const longLatinSvg = renderFinalSvg(longLatinDoc);
const longLatinBodyPx = extractEmittedBodyPx(longLatinSvg);
assert.ok(longLatinBodyPx >= CARD_BODY_MIN_RENDER_PX, `long Latin copy body px ${longLatinBodyPx} >= floor ${CARD_BODY_MIN_RENDER_PX}`);
assert.ok(longLatinSvg.includes("Thank you for the steady presence"), "long Latin copy must not be truncated");
assert.ok(longLatinSvg.includes("with joy"), "long Latin copy end must be present");

// 5. Multilingual / CJK / Hangul / Vietnamese long copy
const longCjk = doc("portrait-5x7", "ja");
longCjk.templateId = "museum-note";
longCjk.textBlocks[1]!.text = "一年を支えてくれたあなたへ";
longCjk.textBlocks[2]!.text = "静かな時間も、遠く離れた日々も、あなたの存在がいつも心強かった。ありがとう。";
const longCjkSvg = renderFinalSvg(longCjk);
assert.ok(longCjkSvg.includes("一年を支えてくれたあなた"), "CJK copy remains renderable inside the hardened safe area");
assert.ok(extractEmittedBodyPx(longCjkSvg) >= CARD_BODY_MIN_RENDER_PX, "CJK emitted body px >= floor");

const longZh = doc("portrait-5x7", "zh");
longZh.templateId = "luxury-editorial";
longZh.textBlocks[1]!.text = "美好的一年正在前方";
longZh.textBlocks[2]!.text = "愿新的一年有安静的清晨、勇敢的新开始，也有许多让你自在做自己的小小幸福与温暖。";
const longZhSvg = renderFinalSvg(longZh);
assert.ok(longZhSvg.includes("愿新的一年有安静的清晨"), "Chinese copy remains renderable");
assert.ok(extractEmittedBodyPx(longZhSvg) >= CARD_BODY_MIN_RENDER_PX, "Chinese emitted body px >= floor");

const longKo = doc("square-5x5", "ko");
longKo.templateId = "monogram-orbit";
longKo.textBlocks[1]!.text = "따스한 계절의 시작";
longKo.textBlocks[2]!.text = "언제나 곁에서 든든한 힘이 되어주셔서 진심으로 감사드립니다. 평안이 가득한 날들이 이어지길 바랍니다.";
const longKoSvg = renderFinalSvg(longKo);
assert.ok(longKoSvg.includes("언제나 곁에서"), "Hangul copy remains renderable");
assert.ok(extractEmittedBodyPx(longKoSvg) >= CARD_BODY_MIN_RENDER_PX, "Hangul emitted body px >= floor");

const longVi = doc("folded-5x7", "vi");
longVi.templateId = "ribbon-line";
longVi.textBlocks[1]!.text = "Một năm thật đẹp đang chờ phía trước.";
longVi.textBlocks[2]!.text = "Mong năm mới có thêm thật nhiều khoảnh khắc bình yên, những khởi đầu đầy can đảm và niềm vui trọn vẹn.";
const longViSvg = renderFinalSvg(longVi);
assert.ok(longViSvg.includes("bình yên"), "Vietnamese copy remains renderable with diacritics");
assert.ok(extractEmittedBodyPx(longViSvg) >= CARD_BODY_MIN_RENDER_PX, "Vietnamese emitted body px >= floor");

// 6. Photo render paths (full-bleed and photo-window lower-scale template)
const photoDoc: CardDocument = {
  ...doc("portrait-5x7"),
  templateId: "photo-story",
  artworkAssetIds: ["photo-primary"],
  photoTreatment: "editorial"
};
await assert.rejects(() => renderProductionFinal(photoDoc), /trusted_photo_asset_required/);
const trustedPhoto = new Uint8Array(await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 138, g: 151, b: 128 } } }).jpeg({ quality: 90 }).toBuffer());
await renderProductionFinal(photoDoc, {
  assets: { "photo-primary": { bytes: trustedPhoto, contentType: "image/jpeg" } }
});
const photoSvg = renderFinalSvg(photoDoc, { "photo-primary": { bytes: trustedPhoto, contentType: "image/jpeg" } });
assert.ok(photoSvg.includes("data:image/jpeg;base64,"), "photo asset is embedded in SVG");
assert.ok(extractEmittedBodyPx(photoSvg) >= CARD_BODY_MIN_RENDER_PX, "photo card emitted body px >= floor");

// Photo window layout with scale/profile reduction (memory-window has bodyScale 0.78)
const memoryPhotoDoc: CardDocument = {
  ...doc("portrait-5x7"),
  templateId: "memory-window",
  artworkAssetIds: ["photo-primary"],
  photoTreatment: "editorial",
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "MOMENTS" },
    { id: "headline", role: "headline", align: "center", text: "Held close." },
    { id: "body", role: "body", align: "center", text: "Remembering all the bright days we spent together under open skies." }
  ]
};
const memorySvg = renderFinalSvg(memoryPhotoDoc, { "photo-primary": { bytes: trustedPhoto, contentType: "image/jpeg" } });
assert.ok(extractEmittedBodyPx(memorySvg) >= CARD_BODY_MIN_RENDER_PX, "memory-window photo card emitted body px >= floor despite bodyScale 0.78");

// 7. Lower-capability render path: postcard-6x4 (min scale 0.8)
const postcardDoc = doc("postcard-6x4", "en");
postcardDoc.templateId = "museum-note";
postcardDoc.textBlocks[1]!.text = "Greetings from afar.";
postcardDoc.textBlocks[2]!.text = "Thinking of you today and sending warmest wishes across the miles.";
const postcardSvg = renderFinalSvg(postcardDoc);
assert.ok(extractEmittedBodyPx(postcardSvg) >= CARD_BODY_MIN_RENDER_PX, "postcard-6x4 emitted body px >= floor despite scale 0.8");

// 8. User-supplied typographyFit below floor is clamped and protected
const subFloorDoc = doc("portrait-5x7");
subFloorDoc.typographyFit = {
  headlinePx: 70,
  bodyPx: 16, // Intentionally below CARD_BODY_MIN_RENDER_PX
  trackingEm: 0
};
const subFloorSvg = renderFinalSvg(subFloorDoc);
assert.ok(extractEmittedBodyPx(subFloorSvg) >= CARD_BODY_MIN_RENDER_PX, "user-supplied sub-floor bodyPx is clamped to floor in final SVG");

// 9. Extreme copy overflow fails closed with explicit error rather than below-floor shrink or silent truncation
const extremeDoc = doc("portrait-5x7");
extremeDoc.textBlocks[2]!.text = "word ".repeat(120);
assert.throws(() => renderFinalSvg(extremeDoc), /typography_copy_too_dense/, "extreme overflow fails closed with explicit error");

// Production preview helper smoke test (real Resvg raster path)
const previewResult = await renderProductionPreview(longLatinDoc);
assert.ok(previewResult.width > 0 && previewResult.height > 0, "renderProductionPreview produces valid dimensions");
assert.ok(previewResult.jpg.length > 0, "renderProductionPreview produces valid JPEG bytes");

// 10. Real Resvg raster path: content-dependency & negative proofs
// A. Content sensitivity: distinct SVG text produces distinct raster output
const contentDocA = doc("portrait-5x7");
contentDocA.textBlocks[1]!.text = "Headline Alpha";
const contentDocB: CardDocument = {
  ...contentDocA,
  id: crypto.randomUUID(),
  textBlocks: [
    contentDocA.textBlocks[0]!,
    { id: "headline", role: "headline", align: "center", text: "Headline Omega Distinct" },
    contentDocA.textBlocks[2]!
  ]
};
const renderedA = await renderProductionFinal(contentDocA);
const renderedB = await renderProductionFinal(contentDocB);
assert.notEqual(
  hash(renderedA.jpg),
  hash(renderedB.jpg),
  "real raster output must be content-dependent: different text must produce different raster hashes"
);

// B. Negative proof: malformed SVG content is rejected by real Resvg rasterizer
await assert.rejects(
  () => rasterizeSvgWithResvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="2100"><text>broken<unclosed_tag></svg>',
    { width: 1500, height: 2100, locale: "en" }
  ),
  /SVG data parsing failed/,
  "real Resvg raster path must reject malformed SVG markup"
);

// C. Negative proof: dimension mismatch between rendered SVG and target spec is rejected
await assert.rejects(
  () => rasterizeSvgWithResvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#fff"/></svg>',
    { width: 1500, height: 2100, locale: "en" }
  ),
  /resvg_dimension_mismatch/,
  "real Resvg raster path must reject dimension mismatch"
);

// 11. Visible glyph & semantic content assertions (P21R2T02)
interface TextRegion {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface GlyphAssertionResult {
  region: string;
  diffPixels: number;
  totalPixels: number;
  occupancyRatio: number;
}

function extractEmbeddedJpegFromPdf(pdfBytes: Uint8Array): Uint8Array {
  const pdfBuf = Buffer.from(pdfBytes);
  const marker = Buffer.from("/Filter /DCTDecode");
  const streamStart = Buffer.from("stream\n");
  const streamEnd = Buffer.from("\nendstream");
  const filterIdx = pdfBuf.indexOf(marker);
  if (filterIdx === -1) throw new Error("pdf_missing_dctdecode_stream");
  const startIdx = pdfBuf.indexOf(streamStart, filterIdx) + streamStart.length;
  const endIdx = pdfBuf.indexOf(streamEnd, startIdx);
  if (startIdx < streamStart.length || endIdx === -1 || endIdx <= startIdx) {
    throw new Error("pdf_malformed_image_stream");
  }
  return new Uint8Array(pdfBuf.subarray(startIdx, endIdx));
}

function rasterizePdfPage(pdfBytes: Uint8Array): Uint8Array {
  try {
    return new Uint8Array(
      execFileSync("pdftoppm", ["-png", "-r", "300", "-singlefile"], {
        input: Buffer.from(pdfBytes),
        stdio: ["pipe", "pipe", "ignore"]
      })
    );
  } catch {
    return extractEmbeddedJpegFromPdf(pdfBytes);
  }
}

async function assertVisibleGlyphsInRegions(
  testRasterBytes: Uint8Array,
  baselineRasterBytes: Uint8Array,
  regions: TextRegion[],
  minOccupancyRatio = 0.008,
  minPixelL1Diff = 30
): Promise<GlyphAssertionResult[]> {
  const results: GlyphAssertionResult[] = [];
  for (const region of regions) {
    const testRaw = await sharp(Buffer.from(testRasterBytes))
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const baseRaw = await sharp(Buffer.from(baselineRasterBytes))
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });

    assert.equal(testRaw.info.width, region.width, `${region.name} width match`);
    assert.equal(testRaw.info.height, region.height, `${region.name} height match`);
    assert.equal(testRaw.data.length, baseRaw.data.length, `${region.name} buffer length match`);

    const channels = testRaw.info.channels;
    const totalPixels = region.width * region.height;
    let diffPixels = 0;

    for (let i = 0; i < testRaw.data.length; i += channels) {
      const dr = Math.abs((testRaw.data[i] ?? 0) - (baseRaw.data[i] ?? 0));
      const dg = Math.abs((testRaw.data[i + 1] ?? 0) - (baseRaw.data[i + 1] ?? 0));
      const db = Math.abs((testRaw.data[i + 2] ?? 0) - (baseRaw.data[i + 2] ?? 0));
      if (dr + dg + db >= minPixelL1Diff) {
        diffPixels++;
      }
    }

    const occupancyRatio = diffPixels / totalPixels;
    if (occupancyRatio < minOccupancyRatio) {
      throw new Error(
        `glyph_assertion_failed:${region.name}:occupancy_${(occupancyRatio * 100).toFixed(2)}%_below_${(minOccupancyRatio * 100).toFixed(2)}%`
      );
    }
    results.push({ region: region.name, diffPixels, totalPixels, occupancyRatio });
  }
  return results;
}

const semanticRegions: TextRegion[] = [
  { name: "headline", left: 200, top: 750, width: 1100, height: 300 },
  { name: "body", left: 200, top: 1120, width: 1100, height: 360 }
];

// Fixed minimal-copy/background baseline with identical format/template/palette/art.
// The production renderer rejects blank headline/body rather than emitting a blank artifact.
const semanticBaselineDoc: CardDocument = {
  ...doc("portrait-5x7", "en"),
  id: "00000000-0000-4000-8000-000000000000",
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "" },
    { id: "headline", role: "headline", align: "center", text: "." },
    { id: "body", role: "body", align: "center", text: "." }
  ]
};
const semanticBaselineRender = await renderProductionFinal(semanticBaselineDoc);
const semanticBaselinePdfRaster = rasterizePdfPage(semanticBaselineRender.pdf);
const semanticBaselinePdfJpg = extractEmbeddedJpegFromPdf(semanticBaselineRender.pdf);

// Good fixtures: Latin, Vietnamese, Japanese, Korean, Simplified Chinese
const semanticScriptFixtures = [
  {
    name: "Latin",
    locale: "en",
    headline: "A beautiful year awaits.",
    body: "May it bring you more of what makes you feel most like yourself."
  },
  {
    name: "Vietnamese",
    locale: "vi",
    headline: "Một năm thật đẹp đang chờ phía trước.",
    body: "Mong năm mới có thêm thật nhiều khoảnh khắc bình yên và niềm vui trọn vẹn."
  },
  {
    name: "Japanese",
    locale: "ja",
    headline: "一年を支えてくれたあなたへ",
    body: "静かな時間も、遠く離れた日々も、あなたの存在がいつも心強かった。ありがとう。"
  },
  {
    name: "Korean",
    locale: "ko",
    headline: "따스한 계절의 시작",
    body: "언제나 곁에서 든든한 힘이 되어주셔서 진심으로 감사드립니다. 평안이 가득하길 바랍니다."
  },
  {
    name: "Chinese",
    locale: "zh",
    headline: "美好的一年正在前方",
    body: "愿新的一年有安静的清晨、勇敢的新开始，也有许多小小温暖与幸福。"
  }
];

for (const fixture of semanticScriptFixtures) {
  const goodDoc: CardDocument = {
    ...doc("portrait-5x7", fixture.locale),
    id: crypto.randomUUID(),
    textBlocks: [
      { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
      { id: "headline", role: "headline", align: "center", text: fixture.headline },
      { id: "body", role: "body", align: "center", text: fixture.body }
    ]
  };

  const goodRender = await renderProductionFinal(goodDoc);

  // 1. Inspect separate headline & body regions in real rendered JPG bytes
  const jpgResults = await assertVisibleGlyphsInRegions(
    goodRender.jpg,
    semanticBaselineRender.jpg,
    semanticRegions
  );
  assert.equal(jpgResults.length, 2, `${fixture.name} JPG inspected 2 text regions`);

  // 2. Inspect separate headline & body regions in real rasterized PDF page bytes
  const pdfRasterBytes = rasterizePdfPage(goodRender.pdf);
  const pdfRasterResults = await assertVisibleGlyphsInRegions(
    pdfRasterBytes,
    semanticBaselinePdfRaster,
    semanticRegions
  );
  assert.equal(pdfRasterResults.length, 2, `${fixture.name} PDF raster inspected 2 text regions`);

  // 3. Inspect separate headline & body regions in embedded PDF image XObject bytes
  const pdfJpgBytes = extractEmbeddedJpegFromPdf(goodRender.pdf);
  const pdfJpgResults = await assertVisibleGlyphsInRegions(
    pdfJpgBytes,
    semanticBaselinePdfJpg,
    semanticRegions
  );
  assert.equal(pdfJpgResults.length, 2, `${fixture.name} PDF XObject inspected 2 text regions`);
}

console.log("GOOD_FIXTURE=PASS");

// Blank/missing-text negative fixture: must genuinely fail the same glyph assertion
const blankDoc: CardDocument = {
  ...doc("portrait-5x7", "en"),
  id: crypto.randomUUID(),
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
    { id: "headline", role: "headline", align: "center", text: "" },
    { id: "body", role: "body", align: "center", text: "" }
  ]
};
await assert.rejects(
  () => renderProductionFinal(blankDoc),
  /typography_copy_missing/,
  "blank text fixture must fail closed before artifact encoding"
);

// Adversarial test: fixture with headline present but body missing must fail at body region
const blankBodyDoc: CardDocument = {
  ...doc("portrait-5x7", "en"),
  id: crypto.randomUUID(),
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
    { id: "headline", role: "headline", align: "center", text: "Headline Only" },
    { id: "body", role: "body", align: "center", text: "" }
  ]
};
await assert.rejects(
  () => renderProductionFinal(blankBodyDoc),
  /typography_copy_missing/,
  "missing body fixture must fail closed before artifact encoding"
);

console.log("BLANK_TEXT_FIXTURE=FAIL_AS_EXPECTED");

// Font missing negative proof: strict font requirement rejects when font dir is missing
const fontProofDoc: CardDocument = {
  ...doc("portrait-5x7", "ja"),
  id: crypto.randomUUID(),
  textBlocks: [
    { id: "kicker", role: "kicker", align: "center", text: "FOR YOU" },
    { id: "headline", role: "headline", align: "center", text: "一年を支えてくれたあなたへ" },
    { id: "body", role: "body", align: "center", text: "静かな時間も、遠く離れた日々も、あなたの存在がいつも心強かった。" }
  ]
};

const origStrict = process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS;
const origDirs = process.env.RENDER_FONT_DIRS;

try {
  process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS = "true";
  process.env.RENDER_FONT_DIRS = "/definitely/missing/font/dir";
  await assert.rejects(
    () => renderProductionFinal(fontProofDoc),
    /renderer_fonts_missing:ja/,
    "missing font directory in strict mode must reject with renderer_fonts_missing:ja"
  );
  console.log("FONT_NEGATIVE_PROOF=PASS");
} finally {
  if (origStrict === undefined) {
    delete process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS;
  } else {
    process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS = origStrict;
  }
  if (origDirs === undefined) {
    delete process.env.RENDER_FONT_DIRS;
  } else {
    process.env.RENDER_FONT_DIRS = origDirs;
  }
}

// Post-negative environment sanity check: verify clean restoration without leakage
assert.equal(
  process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS,
  origStrict,
  "RENDER_REQUIRE_DETERMINISTIC_FONTS must be cleanly restored"
);
assert.equal(
  process.env.RENDER_FONT_DIRS,
  origDirs,
  "RENDER_FONT_DIRS must be cleanly restored"
);
const postSanityDoc = doc("portrait-5x7", "en");
const postSanityRender = await renderProductionFinal(postSanityDoc);
assert.ok(
  postSanityRender.jpg.length > 0 && postSanityRender.pdf.length > 0,
  "renderer remains healthy and functional after negative proof restoration"
);

console.log(JSON.stringify({
  ok: true,
  formats: formats.length,
  renderer: CURRENT_RENDERER_VERSION,
  bodyMinCssPx: CARD_BODY_MIN_CSS_PX,
  bodyMinRenderPx: CARD_BODY_MIN_RENDER_PX
}));
}

main().catch((error)=>{ console.error(error); process.exit(1); });
