import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_RENDERER_VERSION,
  rendererFontConfig,
  renderProductionFinal,
  type CardDocument
} from "@cardelume/renderer";

function need(ok: boolean, msg: string) {
  if (!ok) throw new Error(msg);
}

// 1. Manifest boundary and dependency ownership
const webPkg = JSON.parse(readFileSync("apps/web/package.json", "utf8"));
const rendererPkg = JSON.parse(readFileSync("packages/renderer/package.json", "utf8"));
const workerPkg = JSON.parse(readFileSync("apps/worker/package.json", "utf8"));
const lockfile = readFileSync("pnpm-lock.yaml", "utf8");

need(webPkg.dependencies?.["@cardelume/renderer"] === "workspace:*", "web must directly own @cardelume/renderer workspace dependency");
need(!webPkg.dependencies?.["@resvg/resvg-js"] && !webPkg.devDependencies?.["@resvg/resvg-js"], "web must not redundantly declare @resvg/resvg-js; renderer owns native resvg");
need(Boolean(rendererPkg.dependencies?.["@resvg/resvg-js"]), "renderer must directly declare @resvg/resvg-js");
need(Boolean(rendererPkg.dependencies?.["sharp"]), "renderer must directly declare sharp");
need(workerPkg.dependencies?.["@cardelume/renderer"] === "workspace:*", "worker maintains renderer ownership");

// Verify pnpm-lock.yaml apps/web importer entry
const webImporterMatch = lockfile.match(/apps\/web:\s*\n\s*dependencies:\s*\n([\s\S]*?)(?=\n\s*devDependencies:|\n\s*apps\/|\n\s*packages\/)/);
need(Boolean(webImporterMatch), "apps/web importer entry present in lockfile");
need(webImporterMatch![1].includes("'@cardelume/renderer':") || webImporterMatch![1].includes("@cardelume/renderer:"), "lockfile apps/web dependencies must declare @cardelume/renderer");
need(webImporterMatch![1].includes("specifier: workspace:*"), "lockfile apps/web @cardelume/renderer must use workspace:* specifier");
need(webImporterMatch![1].includes("link:../../packages/renderer"), "lockfile apps/web @cardelume/renderer must link to packages/renderer");

// 2. Docker parity & deterministic font runtime
const webDocker = readFileSync("docker/web.Dockerfile", "utf8");
const workerDocker = readFileSync("docker/worker.Dockerfile", "utf8");
const nextConfig = readFileSync("apps/web/next.config.ts", "utf8");

need(webDocker.includes("COPY packages/renderer/package.json packages/renderer/package.json"), "web Dockerfile deps stage must copy packages/renderer/package.json");
need(webDocker.includes("/app/packages/renderer/node_modules /app/packages/renderer/node_modules"), "web Dockerfile build stage must copy renderer node_modules");
need(webDocker.includes("pnpm install --frozen-lockfile"), "web Dockerfile must use frozen lockfile");
need(!webDocker.includes("--no-frozen-lockfile"), "web Dockerfile must not disable frozen lockfile");

// Pinned Debian font packages parity with worker.Dockerfile
const pinnedEbGaramond = "fonts-ebgaramond=0.016+git20210310.42d4f9f2-1";
const pinnedLato = "fonts-lato=2.0-2.1";
const pinnedNotoCjk = "fonts-noto-cjk=1:20220127+repack1-1";

need(workerDocker.includes(pinnedEbGaramond), "worker Dockerfile has authoritative EB Garamond pin");
need(webDocker.includes(pinnedEbGaramond), "web Dockerfile must match exact pinned EB Garamond package");
need(workerDocker.includes(pinnedLato), "worker Dockerfile has authoritative Lato pin");
need(webDocker.includes(pinnedLato), "web Dockerfile must match exact pinned Lato package");
need(workerDocker.includes(pinnedNotoCjk), "worker Dockerfile has authoritative Noto CJK pin");
need(webDocker.includes(pinnedNotoCjk), "web Dockerfile must match exact pinned Noto CJK package");
need(webDocker.includes("fontconfig"), "web Dockerfile must install fontconfig");

// Copyright checks
need(webDocker.includes("/usr/share/doc/fonts-ebgaramond/copyright"), "web Dockerfile must verify EB Garamond copyright");
need(webDocker.includes("/usr/share/doc/fonts-lato/copyright"), "web Dockerfile must verify Lato copyright");
need(webDocker.includes("/usr/share/doc/fonts-noto-cjk/copyright"), "web Dockerfile must verify Noto CJK copyright");

// Runtime environment and security invariants
need(webDocker.includes("RENDER_REQUIRE_DETERMINISTIC_FONTS=true"), "web Dockerfile runner stage must set RENDER_REQUIRE_DETERMINISTIC_FONTS=true");
need(webDocker.includes("USER cardelume"), "web Dockerfile must run as unprivileged cardelume user");
need(webDocker.includes("useradd --create-home --uid 10001 cardelume"), "web Dockerfile must create cardelume user with uid 10001");
need(webDocker.includes("standalone"), "web Dockerfile must copy standalone output");
need(nextConfig.includes('serverExternalPackages: ["@resvg/resvg-js"]') || nextConfig.includes("serverExternalPackages: ['@resvg/resvg-js']"), "apps/web next.config.ts must maintain serverExternalPackages for @resvg/resvg-js");

// 3. Strict font contract (fail-closed in strict mode)
const prevEnvStrict = process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS;
const prevFontDirs = process.env.RENDER_FONT_DIRS;
try {
  // Test 3a: strict mode with missing font directory throws fail-closed error
  process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS = "true";
  process.env.RENDER_FONT_DIRS = "/nonexistent/path/for/parity/test";
  assert.throws(
    () => rendererFontConfig("en"),
    /renderer_fonts_missing/,
    "strict mode must throw fail-closed error when deterministic font directories are absent"
  );

  // Test 3b: dev escape hatch when strict mode disabled
  process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS = "false";
  delete process.env.RENDER_FONT_DIRS;
  const devConfig = rendererFontConfig("en");
  need(typeof devConfig.loadSystemFonts === "boolean", "rendererFontConfig returns valid structure in dev mode");
} finally {
  if (prevEnvStrict === undefined) {
    delete process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS;
  } else {
    process.env.RENDER_REQUIRE_DETERMINISTIC_FONTS = prevEnvStrict;
  }
  if (prevFontDirs === undefined) {
    delete process.env.RENDER_FONT_DIRS;
  } else {
    process.env.RENDER_FONT_DIRS = prevFontDirs;
  }
}

// 4. In-memory fixed CardDocument export execution via real renderProductionFinal
async function main() {
  const testDoc: CardDocument = {
    schemaVersion: 1,
    templateVersion: "0.4.0",
    rendererVersion: CURRENT_RENDERER_VERSION,
    marketPackVersion: "2026.08",
    id: "00000000-0000-0000-0000-000000000000",
    locale: "en",
    format: "portrait-5x7",
    templateId: "luxury-editorial",
    paletteId: "editorial-ivory",
    typographyId: "editorial-serif",
    artworkAssetIds: [],
    textBlocks: [
      { id: "kicker", role: "kicker", align: "center", text: "CELEBRATION" },
      { id: "headline", role: "headline", align: "center", text: "With Warmest Wishes" },
      { id: "body", role: "body", align: "center", text: "May the year ahead be filled with joy, peace, and quiet confidence." }
    ],
    metadata: { occasion: "Birthday", relationship: "Friend", feeling: "Elegant" }
  };

  const rendered = await renderProductionFinal(testDoc);
  need(rendered.jpg instanceof Uint8Array && rendered.jpg.byteLength > 0, "renderProductionFinal produces valid JPEG bytes");
  need(rendered.pdf instanceof Uint8Array && rendered.pdf.byteLength > 0, "renderProductionFinal produces valid PDF bytes");
  need(Buffer.from(rendered.pdf.slice(0, 8)).toString("latin1").startsWith("%PDF-1.4"), "PDF output has standard PDF-1.4 header");
  need(rendered.metadata.format === "portrait-5x7", "rendered metadata matches requested format");
  need(rendered.metadata.rendererVersion === CURRENT_RENDERER_VERSION, "rendered metadata matches CURRENT_RENDERER_VERSION");
  need(rendered.metadata.jpg.widthPx === 1500 && rendered.metadata.jpg.heightPx === 2100, "portrait-5x7 JPEG matches 1500x2100 px");

  console.log("TYPOGRAPHY_RUNTIME_PARITY=PASS");
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
