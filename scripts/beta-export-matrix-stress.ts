import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import {
  CardDocumentSchema,
  CheckoutCardSnapshotSchema,
  assertCanonicalPresentationIdentity,
  type CardDocument,
  type CheckoutCardSnapshot
} from "../packages/card-schema/src/index.ts";
import {
  bootstrapTemplates,
  resolveCanonicalPresentation
} from "../packages/templates/src/index.ts";
import {
  getCardFormatSpec
} from "../packages/renderer/src/index.ts";
import { renderBetaExportArtifact } from "../apps/web/lib/beta-export-render.ts";
import { buildCheckoutCardDocument } from "../apps/web/lib/checkout-card-core.ts";
import type { RenderAssets } from "../packages/renderer/src/index.ts";

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

function semanticRegionsForFormat(format: CardDocument["format"], hasPhoto: boolean): TextRegion[] {
  const spec = getCardFormatSpec(format);
  const fw = spec.front.widthPx;
  const fh = spec.front.heightPx;
  const photoOffset = hasPhoto ? Math.round(fh * 0.25) : 0;
  const regions = semanticRegions.map((r) => ({
    name: r.name,
    left: Math.round(r.left * fw / 1500),
    top: Math.round(r.top * fh / 2100) + photoOffset,
    width: Math.round(r.width * fw / 1500),
    height: Math.round(r.height * fh / 2100)
  }));
  for (const reg of regions) {
    assert.ok(reg.left >= 0 && reg.top >= 0, `${format}: region ${reg.name} top/left must be >= 0`);
    assert.ok(reg.left + reg.width <= fw, `${format}: region ${reg.name} right edge must be within front width`);
    assert.ok(reg.top + reg.height <= fh, `${format}: region ${reg.name} bottom edge must be within front height`);
  }
  return regions;
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

// Deterministic local JPEG: 800x600 solid colour via sharp.
async function makeSolidJpeg(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 160, g: 140, b: 120 } }
  })
    .jpeg()
    .toBuffer();
  return new Uint8Array(buf);
}

const PHOTO_PALETTE = {
  primary: "#8a977f",
  secondary: "#e8d7c2",
  accent: "#c18b6e",
  temperature: "balanced" as const,
  luminance: 0.57
};

interface MatrixFixture {
  name: string;
  slug: string;
  format: CardDocument["format"];
  locale: CheckoutCardSnapshot["locale"];
  assetKind: "jpg" | "pdf";
  hasPhoto: boolean;
  headline: string;
  body: string;
  finishEdited?: boolean;
}

const matrixFixtures: MatrixFixture[] = [
  {
    name: "folded-vietnamese-jpg",
    slug: "luxury-editorial",
    format: "folded-5x7",
    locale: "vi",
    assetKind: "jpg",
    hasPhoto: false,
    headline: "Một năm thật đẹp đang chờ phía trước.",
    body: "Mong năm mới có thêm thật nhiều khoảnh khắc bình yên và niềm vui trọn vẹn."
  },
  {
    name: "square-japanese-pdf",
    slug: "luxury-editorial",
    format: "square-5x5",
    locale: "ja",
    assetKind: "pdf",
    hasPhoto: false,
    headline: "一年を支えてくれたあなたへ",
    body: "静かな時間も、遠く離れた日々も、あなたの存在がいつも心強かった。ありがとう。"
  },
  {
    name: "landscape-korean-jpg",
    slug: "photo-story",
    format: "landscape-7x5",
    locale: "ko",
    assetKind: "jpg",
    hasPhoto: true,
    headline: "따스한 계절의 시작",
    body: "언제나 곁에서 힘이 되어주셔서 진심으로 감사드립니다."
  },
  {
    name: "postcard-chinese-pdf",
    slug: "photo-story",
    format: "postcard-6x4",
    locale: "zh",
    assetKind: "pdf",
    hasPhoto: true,
    headline: "美好的一年正在前方",
    body: "愿新的一年有安静的清晨与温暖的幸福。"
  },
  {
    name: "portrait-vietnamese-finish-photo-pdf",
    slug: "photo-story",
    format: "portrait-5x7",
    locale: "vi",
    assetKind: "pdf",
    hasPhoto: true,
    finishEdited: true,
    headline: "Một lời chúc được sửa lại.",
    body: "Mong năm mới có thêm nhiều bình yên và niềm vui."
  }
];

async function runMatrixFixture(fixture: MatrixFixture): Promise<void> {
  // Step 1: Find template
  const tmpl = bootstrapTemplates.find((t) => t.slug === fixture.slug);
  assert.ok(tmpl, `bootstrap template '${fixture.slug}' must exist for fixture '${fixture.name}'`);

  const templateId = tmpl.id;
  const templateVersionId = tmpl.versionId;

  // Step 2: Resolve canonical presentation
  const presentation = resolveCanonicalPresentation({
    templateId,
    templateVersionId,
    hasPhoto: fixture.hasPhoto,
    locale: fixture.locale,
    format: fixture.format
  });
  assert.equal(presentation.templateId, templateId, `${fixture.name}: presentation templateId must match tmpl.id`);
  assert.equal(presentation.templateVersionId, templateVersionId, `${fixture.name}: presentation templateVersionId must match tmpl.versionId`);

  // Step 3: Build photo assets if needed
  const photoAssetId = fixture.hasPhoto ? crypto.randomUUID() : undefined;
  let assets: RenderAssets | undefined;
  if (fixture.hasPhoto && photoAssetId) {
    const jpegBytes = await makeSolidJpeg();
    assets = { [photoAssetId]: { bytes: jpegBytes, contentType: "image/jpeg" } };
  }

  // Step 4: Build snapshot
  const snapshot: CheckoutCardSnapshot = {
    locale: fixture.locale,
    format: fixture.format,
    direction: fixture.hasPhoto ? "photo" : "editorial",
    templateId,
    templateVersionId,
    presentation,
    visualDirection: presentation.visualDirection,
    templateSource: "ai_direction",
    occasion: "New Year",
    relationship: "Friend",
    feeling: "Warm",
    kicker: "FOR YOU",
    headline: fixture.headline,
    body: fixture.body,
    accentMode: fixture.hasPhoto ? "photo" : "original",
    ...(fixture.hasPhoto && photoAssetId ? { photoAssetId, photoPalette: PHOTO_PALETTE } : {})
  };

  // Step 5: Parse snapshot, build document, parse document, render
  const parsedSnapshot = CheckoutCardSnapshotSchema.parse(snapshot);

  const exportDoc: CardDocument = buildCheckoutCardDocument({
    versionId: crypto.randomUUID(),
    snapshot: parsedSnapshot,
    managedTemplate: {
      rendererTemplateKey: tmpl.rendererTemplateKey,
      version: tmpl.version,
      templateVersionId: tmpl.versionId,
      photoMode: tmpl.photoMode,
      presentation
    }
  });

  const parsedDoc = CardDocumentSchema.parse(exportDoc);

  // Step 6: Assert identity preservation
  assert.equal(
    parsedDoc.presentation?.templateId, tmpl.id,
    `${fixture.name}: document.presentation.templateId must equal tmpl.id`
  );
  assert.equal(
    parsedDoc.presentation?.templateVersionId, tmpl.versionId,
    `${fixture.name}: document.presentation.templateVersionId must equal tmpl.versionId`
  );
  assert.equal(
    parsedDoc.templateId, tmpl.rendererTemplateKey,
    `${fixture.name}: document.templateId must equal tmpl.rendererTemplateKey`
  );

  // Assert headline and body in text blocks
  const headlineBlock = parsedDoc.textBlocks.find((b) => b.role === "headline");
  const bodyBlock = parsedDoc.textBlocks.find((b) => b.role === "body");
  assert.ok(headlineBlock, `${fixture.name}: headline block must exist`);
  assert.ok(bodyBlock, `${fixture.name}: body block must exist`);
  assert.equal(headlineBlock.text, fixture.headline, `${fixture.name}: headline must match fixture`);
  assert.equal(bodyBlock.text, fixture.body, `${fixture.name}: body must match fixture`);

  // For finishEdited fixture — these are the edited values, assert exactly
  if (fixture.finishEdited) {
    assert.equal(headlineBlock.text, fixture.headline, `${fixture.name}: finishEdited headline must be present exactly`);
    assert.equal(bodyBlock.text, fixture.body, `${fixture.name}: finishEdited body must be present exactly`);
  }

  const renderResult = await renderBetaExportArtifact({ document: parsedDoc, presentation, assets });

  assert.equal(
    renderResult.metadata.presentation?.templateId,
    tmpl.id,
    `${fixture.name}: renderResult.metadata.presentation.templateId must equal tmpl.id`
  );
  assert.equal(
    renderResult.metadata.presentation?.templateVersionId,
    tmpl.versionId,
    `${fixture.name}: renderResult.metadata.presentation.templateVersionId must equal tmpl.versionId`
  );

  const spec = getCardFormatSpec(fixture.format);

  // Step 7: JPG assertions
  if (fixture.assetKind === "jpg") {
    const jpgBytes = renderResult.jpg;
    assert.ok(jpgBytes.length > 0, `${fixture.name}: JPG bytes must be non-empty`);
    const decoded = await sharp(Buffer.from(jpgBytes)).metadata();
    assert.equal(decoded.format, "jpeg", `${fixture.name}: decoded image format must be jpeg`);
    assert.equal(decoded.width, spec.front.widthPx, `${fixture.name}: decoded width must match format spec`);
    assert.equal(decoded.height, spec.front.heightPx, `${fixture.name}: decoded height must match format spec`);
    assert.equal(decoded.density, 300, `${fixture.name}: decoded density must be 300 dpi`);
  }

  // Step 8: PDF assertions
  if (fixture.assetKind === "pdf") {
    const pdfBytes = renderResult.pdf;
    assert.ok(pdfBytes.length > 0, `${fixture.name}: PDF bytes must be non-empty`);
    const pdfText = Buffer.from(pdfBytes).toString("latin1");
    assert.ok(pdfText.startsWith("%PDF-1.4"), `${fixture.name}: PDF must start with %PDF-1.4`);
    const pageTokenCount = (pdfText.match(/\/Type\s*\/Page\b/g) ?? []).length;
    assert.equal(pageTokenCount, spec.pdf.pageCount, `${fixture.name}: PDF /Type /Page token count must equal spec.pdf.pageCount`);
    const expectedMediaBox = `[0 0 ${spec.pdf.widthIn * 72} ${spec.pdf.heightIn * 72}]`;
    assert.ok(pdfText.includes(expectedMediaBox), `${fixture.name}: PDF must contain MediaBox ${expectedMediaBox}`);
    const credentialMarkerRe = /https?:\/\/|authorization|bearer|access-token|private-url/i;
    assert.ok(!credentialMarkerRe.test(pdfText), `${fixture.name}: PDF must not contain HTTP URLs or credential/recovery markers`);
  }

  // Step 9: Baseline document (no text)
  const baselineSnapshot: CheckoutCardSnapshot = {
    ...snapshot,
    kicker: "",
    headline: " ",
    body: ""
  };
  const baselineDoc = buildCheckoutCardDocument({
    versionId: crypto.randomUUID(),
    snapshot: baselineSnapshot,
    managedTemplate: {
      rendererTemplateKey: tmpl.rendererTemplateKey,
      version: tmpl.version,
      templateVersionId: tmpl.versionId,
      photoMode: tmpl.photoMode,
      presentation
    }
  });
  const baselineResult = await renderBetaExportArtifact({ document: baselineDoc, presentation, assets });

  // Step 10: JPG semantic content — all JPG fixtures
  if (fixture.assetKind === "jpg") {
    const scaledRegions = semanticRegionsForFormat(fixture.format, fixture.hasPhoto);
    assert.equal(scaledRegions.length, 2, `${fixture.name}: must have exactly two semantic regions`);
    const glyphResults = await assertVisibleGlyphsInRegions(
      renderResult.jpg,
      baselineResult.jpg,
      scaledRegions
    );
    assert.equal(glyphResults.length, 2, `${fixture.name}: inspected 2 semantic text regions`);
    for (const res of glyphResults) {
      assert.ok(
        res.occupancyRatio > 0.008,
        `${fixture.name}: ${res.region} visible glyph occupancy (${(res.occupancyRatio * 100).toFixed(2)}%) must exceed threshold`
      );
    }
  }

  // Step 11: PDF semantic — rasterize and check, but not for folded fixtures
  if (fixture.assetKind === "pdf" && fixture.format !== "folded-5x7") {
    const scaledRegions = semanticRegionsForFormat(fixture.format, fixture.hasPhoto);
    assert.equal(scaledRegions.length, 2, `${fixture.name}: must have exactly two semantic regions`);
    const pdfRaster = rasterizePdfPage(renderResult.pdf);
    const baselinePdfRaster = rasterizePdfPage(baselineResult.pdf);
    const pdfGlyphResults = await assertVisibleGlyphsInRegions(
      pdfRaster,
      baselinePdfRaster,
      scaledRegions
    );
    assert.equal(pdfGlyphResults.length, 2, `${fixture.name}: inspected 2 PDF semantic text regions`);
    for (const res of pdfGlyphResults) {
      assert.ok(
        res.occupancyRatio > 0.008,
        `${fixture.name}: PDF ${res.region} visible glyph occupancy (${(res.occupancyRatio * 100).toFixed(2)}%) must exceed threshold`
      );
    }
  }

  console.log(`  [PASS] ${fixture.name}`);
}

async function main() {
  console.log("Running beta-export-matrix-stress initial skeleton (one valid no-photo JPG case)...");

  // 1. Resolve exact template identity from bootstrap templates
  const tmpl = bootstrapTemplates.find((t) => t.slug === "luxury-editorial");
  assert.ok(tmpl, "bootstrap template luxury-editorial must exist");

  const templateId = tmpl.id;
  const templateVersionId = tmpl.versionId;

  assertCanonicalPresentationIdentity({
    templateId,
    templateVersionId,
    visualDirection: tmpl.visualDirection
  });

  const presentation = resolveCanonicalPresentation({
    templateId,
    templateVersionId
  });

  // 2. Build snapshot with exact template identity and no photo
  const snapshot: CheckoutCardSnapshot = {
    locale: "en",
    format: "portrait-5x7",
    direction: "editorial",
    templateId,
    templateVersionId,
    presentation,
    templateSource: "ai_direction",
    occasion: "Birthday",
    relationship: "Friend",
    feeling: "Warm",
    kicker: "FOR YOU",
    headline: "A beautiful year awaits.",
    body: "May it bring you more of what makes you feel most like yourself.",
    accentMode: "original",
    visualDirection: presentation.visualDirection
  };

  const parsedSnapshot = CheckoutCardSnapshotSchema.parse(snapshot);

  // 3. Build checkout card document using production helper
  const exportDoc: CardDocument = buildCheckoutCardDocument({
    versionId: crypto.randomUUID(),
    snapshot: parsedSnapshot,
    managedTemplate: {
      rendererTemplateKey: tmpl.rendererTemplateKey,
      version: tmpl.version,
      templateVersionId: tmpl.versionId,
      photoMode: tmpl.photoMode,
      presentation
    }
  });

  const parsedDoc = CardDocumentSchema.parse(exportDoc);

  // 4. Generate JPG via production renderer path
  const renderResult = await renderBetaExportArtifact({ document: parsedDoc, presentation });
  const jpgBytes = renderResult.jpg;
  assert.ok(jpgBytes.length > 0, "JPG bytes must be non-empty");

  // 5. Decode JPG and verify format and dimensions
  const spec = getCardFormatSpec("portrait-5x7");
  const decoded = await sharp(Buffer.from(jpgBytes)).metadata();
  assert.equal(decoded.format, "jpeg", "decoded image format must be jpeg");
  assert.equal(decoded.width, spec.front.widthPx, "decoded width must match format spec");
  assert.equal(decoded.height, spec.front.heightPx, "decoded height must match format spec");
  assert.equal(decoded.density, 300, "decoded density must be 300 dpi");

  // PDF positive verification (same renderResult, portrait-5x7 fixture)
  const pdfBytes = renderResult.pdf;
  assert.ok(pdfBytes.length > 0, "PDF bytes must be non-empty");

  const pdfText = Buffer.from(pdfBytes).toString("latin1");
  assert.ok(pdfText.startsWith("%PDF-1.4"), "PDF must start with %PDF-1.4");

  assert.equal(renderResult.metadata.pdf.pageCount, spec.pdf.pageCount, "PDF pageCount must match spec");
  assert.equal(renderResult.metadata.pdf.widthIn, spec.pdf.widthIn, "PDF widthIn must match spec");
  assert.equal(renderResult.metadata.pdf.heightIn, spec.pdf.heightIn, "PDF heightIn must match spec");

  const pageTokenCount = (pdfText.match(/\/Type\s*\/Page\b/g) ?? []).length;
  assert.equal(pageTokenCount, spec.pdf.pageCount, "PDF /Type /Page token count must equal spec.pdf.pageCount");

  const expectedMediaBox = `[0 0 ${spec.pdf.widthIn * 72} ${spec.pdf.heightIn * 72}]`;
  assert.ok(pdfText.includes(expectedMediaBox), `PDF must contain MediaBox ${expectedMediaBox}`);

  const credentialMarkerRe = /https?:\/\/|authorization|bearer|access-token|private-url/i;
  assert.ok(!credentialMarkerRe.test(pdfText), "PDF must not contain HTTP URLs or credential/recovery markers");

  // 6. Assert expected card text is visibly present using baseline comparison
  const baselineSnapshot: CheckoutCardSnapshot = {
    ...snapshot,
    kicker: "",
    headline: " ",
    body: ""
  };
  const baselineDoc = buildCheckoutCardDocument({
    versionId: crypto.randomUUID(),
    snapshot: baselineSnapshot,
    managedTemplate: {
      rendererTemplateKey: tmpl.rendererTemplateKey,
      version: tmpl.version,
      templateVersionId: tmpl.versionId,
      photoMode: tmpl.photoMode,
      presentation
    }
  });
  const baselineResult = await renderBetaExportArtifact({ document: baselineDoc, presentation });

  // PDF semantic rasterization
  const pdfRaster = rasterizePdfPage(renderResult.pdf);
  const baselinePdfRaster = rasterizePdfPage(baselineResult.pdf);
  const pdfGlyphResults = await assertVisibleGlyphsInRegions(
    pdfRaster,
    baselinePdfRaster,
    semanticRegions
  );

  assert.equal(pdfGlyphResults.length, 2, "inspected 2 PDF semantic text regions");
  for (const res of pdfGlyphResults) {
    assert.ok(
      res.occupancyRatio > 0.008,
      `PDF ${res.region} visible glyph occupancy (${(res.occupancyRatio * 100).toFixed(2)}%) must exceed threshold`
    );
  }

  console.log("BETA_EXPORT_PDF_POSITIVE=PASS");
  console.log("BETA_EXPORT_PDF_SEMANTIC=PASS");

  const glyphResults = await assertVisibleGlyphsInRegions(
    jpgBytes,
    baselineResult.jpg,
    semanticRegions
  );

  assert.equal(glyphResults.length, 2, "inspected 2 semantic text regions");
  for (const res of glyphResults) {
    assert.ok(
      res.occupancyRatio > 0.008,
      `${res.region} visible glyph occupancy (${(res.occupancyRatio * 100).toFixed(2)}%) must exceed threshold`
    );
  }

  // 7. Negative case: fail-closed rejection for invalid presentation identity
  const invalidIdentitySnapshot = {
    ...snapshot,
    templateId: undefined,
    templateVersionId: undefined,
    presentation: undefined
  };

  let reachedFinalRender = false;
  let identityRejectionError: unknown;

  try {
    const invalidDoc = buildCheckoutCardDocument({
      versionId: crypto.randomUUID(),
      snapshot: invalidIdentitySnapshot,
      managedTemplate: {
        rendererTemplateKey: tmpl.rendererTemplateKey,
        version: tmpl.version,
        templateVersionId: tmpl.versionId,
        photoMode: tmpl.photoMode,
        presentation
      }
    });

    const parsedInvalidDoc = CardDocumentSchema.parse(invalidDoc);
    reachedFinalRender = true;
    await renderBetaExportArtifact({ document: parsedInvalidDoc, presentation });
  } catch (err) {
    identityRejectionError = err;
  }

  assert.equal(reachedFinalRender, false, "must not reach final render");
  assert.ok(identityRejectionError, "an error must be thrown");
  assert.match(String(identityRejectionError), /invalid_presentation_identity/);

  console.log("BETA_EXPORT_IDENTITY_NEGATIVE=PASS");
  console.log("BETA_EXPORT_JPG_SKELETON=PASS");

  // --- Matrix fixtures ---
  console.log("Running matrix fixtures...");
  for (const fixture of matrixFixtures) {
    await runMatrixFixture(fixture);
  }

  // Coverage assertions
  assert.equal(matrixFixtures.length, 5, "exactly five additional fixtures");

  const allFormats = [
    "portrait-5x7", // existing JPG positive
    "portrait-5x7", // existing PDF positive
    ...matrixFixtures.map((f) => f.format)
  ];
  const formatSet = new Set(allFormats);
  for (const fmt of ["portrait-5x7", "folded-5x7", "square-5x5", "landscape-7x5", "postcard-6x4"]) {
    assert.ok(formatSet.has(fmt), `all formats must appear: missing ${fmt}`);
  }

  const allLocales = ["en", ...matrixFixtures.map((f) => f.locale)];
  const localeSet = new Set(allLocales);
  for (const loc of ["en", "vi", "ja", "ko", "zh"]) {
    assert.ok(localeSet.has(loc), `locale must appear: missing ${loc}`);
  }

  const hasPhotoValues = matrixFixtures.map((f) => f.hasPhoto);
  assert.ok(hasPhotoValues.includes(false), "hasPhoto: false must appear");
  assert.ok(hasPhotoValues.includes(true), "hasPhoto: true must appear");

  const assetKinds = matrixFixtures.map((f) => f.assetKind);
  assert.ok(assetKinds.includes("jpg"), "assetKind jpg must appear");
  assert.ok(assetKinds.includes("pdf"), "assetKind pdf must appear");

  const finishEditedCount = matrixFixtures.filter((f) => f.finishEdited).length;
  assert.equal(finishEditedCount, 1, "exactly one finishEdited fixture");

  console.log("BETA_EXPORT_MATRIX=PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
