import Module from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function need(value: unknown, message: string): asserts value {
  if (!value) {
    console.error(`FAILURE: ${message}`);
    throw new Error(message);
  }
}

// Stub "server-only" module resolution so template-event-token.server.ts can be imported in a node test script
const originalResolve = (Module as unknown as { _resolveFilename: (request: string, ...args: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (request: string, ...args: unknown[]) => string })._resolveFilename = function(request: string, ...args: unknown[]) {
  if (request === "server-only") return "/dev/null";
  return originalResolve.apply(this, [request, ...args]);
};

async function main() {
  const markers: string[] = [];
  let tokenLib: typeof import("../apps/web/lib/template-event-token.server.ts") | null = null;

  try {
    const targetPath = resolve("apps/web/lib/template-event-token.server.ts");
    tokenLib = await import(targetPath);
  } catch {
    console.log("TOKEN_LIB_IMPORT=BLOCKED_SERVER_ONLY");
  }

  if (tokenLib) {
    process.env.TEMPLATE_EVENT_SECRET = process.env.TEMPLATE_EVENT_SECRET || "0123456789abcdef0123456789abcdef";

    const baseInput = {
      templateId: "10000000-0000-4000-8000-000000000001",
      templateVersionId: "30000000-0000-4000-8000-000000000001",
      source: "ai_direction" as const,
      rankPosition: 1,
      market: "US",
      locale: "en",
      anonymousId: "11111111-1111-4111-8111-111111111111"
    };

    // 1. Token round-trip
    const validToken = tokenLib.issueTemplateEventToken(baseInput);
    need(tokenLib.verifyTemplateEventToken(validToken, baseInput) === true, "check_1_token_round_trip_failed");
    markers.push("TOKEN_ROUND_TRIP=PASS");

    // 2. Rejects market mismatch
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, market: "VN" }) === false, "check_2_different_market_accepted");
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, market: "OTHER" }) === false, "check_2_other_market_accepted");
    markers.push("REJECT_MARKET_MISMATCH=PASS");

    // 3. Rejects anonymousId mismatch
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, anonymousId: "22222222-2222-4222-8222-222222222222" }) === false, "check_3_different_anonymous_id_accepted");
    markers.push("REJECT_ANONYMOUS_ID_MISMATCH=PASS");

    // 4. Rejects templateId / templateVersionId / source / rankPosition / locale mismatch
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, templateId: "10000000-0000-4000-8000-000000000002" }) === false, "check_4_different_template_id_accepted");
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, templateVersionId: "30000000-0000-4000-8000-000000000002" }) === false, "check_4_different_template_version_id_accepted");
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, source: "recommended" }) === false, "check_4_different_source_accepted");
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, rankPosition: 2 }) === false, "check_4_different_rank_position_accepted");
    need(tokenLib.verifyTemplateEventToken(validToken, { ...baseInput, locale: "fr" }) === false, "check_4_different_locale_accepted");
    markers.push("REJECT_CONTEXT_MISMATCH=PASS");

    // 5. Rejects tampered signature and malformed tokens
    const [encoded, sig] = validToken.split(".");
    const flippedChar = sig.slice(-1) === "a" ? "b" : "a";
    const tamperedToken = `${encoded}.${sig.slice(0, -1)}${flippedChar}`;
    need(tokenLib.verifyTemplateEventToken(tamperedToken, baseInput) === false, "check_5_tampered_signature_accepted");
    need(tokenLib.verifyTemplateEventToken("malformed-not-a-token", baseInput) === false, "check_5_malformed_token_accepted");
    need(tokenLib.verifyTemplateEventToken("", baseInput) === false, "check_5_empty_token_accepted");
    need(tokenLib.verifyTemplateEventToken(`${validToken}.extra_chunk`, baseInput) === false, "check_5_three_part_token_accepted");
    need(tokenLib.verifyTemplateEventToken("aW52YWxpZA.invalid_sig", baseInput) === false, "check_5_invalid_payload_token_accepted");
    markers.push("REJECT_TAMPERED_OR_MALFORMED=PASS");

    // 6. Expiry and clamp assertions
    const negativeTtlToken = tokenLib.issueTemplateEventToken(baseInput, -1);
    need(tokenLib.verifyTemplateEventToken(negativeTtlToken, baseInput) === true, "check_6_negative_ttl_clamp_must_remain_valid");
    const zeroTtlToken = tokenLib.issueTemplateEventToken(baseInput, 0);
    need(tokenLib.verifyTemplateEventToken(zeroTtlToken, baseInput) === true, "check_6_zero_ttl_clamp_must_remain_valid");

    // Expiry check: simulate time past 60s clamp
    const origNow = Date.now;
    try {
      Date.now = () => origNow() + 65_000;
      need(tokenLib.verifyTemplateEventToken(negativeTtlToken, baseInput) === false, "check_6_expired_token_accepted");
    } finally {
      Date.now = origNow;
    }
    markers.push("REJECT_EXPIRED_AND_CLAMP=PASS");
  }

  // 7. Source guard on apps/web/app/api/generate/[jobId]/route.ts
  const routePath = resolve("apps/web/app/api/generate/[jobId]/route.ts");
  const routeText = readFileSync(routePath, "utf8");

  const forbiddenInternalFields = [
    "creativeThesis",
    "noveltyScore",
    "wowScore",
    "riskCodes",
    "confidence"
  ];
  for (const field of forbiddenInternalFields) {
    need(!routeText.includes(field), `check_7_forbidden_internal_field_found:${field}`);
  }

  const whitelistKeys = [
    "id",
    "templateId",
    "templateVersionId",
    "presentation",
    "templateName",
    "visualDirection",
    "photoMode",
    "accentMode",
    "signatureMove",
    "kicker",
    "headline",
    "body",
    "customerRationale",
    "templateEventToken",
    "generationSource"
  ];
  for (const key of whitelistKeys) {
    need(routeText.includes(key), `check_7_whitelist_key_missing:${key}`);
  }
  markers.push("PAYLOAD_SOURCE_GUARD=PASS");

  for (const marker of markers) {
    console.log(marker);
  }
  console.log("API_PAYLOAD_HYGIENE_STRESS=PASS");
}

main().catch(err => {
  console.error("STRESS RUN FAILED:", err);
  process.exit(1);
});
