import fs from "node:fs";
import { supportedLocales, getMessages } from "../apps/web/i18n/messages.ts";
import { betaCopy } from "../apps/web/i18n/beta-copy.ts";
import { launchCopy } from "../apps/web/i18n/launch-copy.ts";

function must(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`homepage_payment_consistency_failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Source-level checks for apps/web/app/page.tsx
// ---------------------------------------------------------------------------

const pageSource = fs.readFileSync("apps/web/app/page.tsx", "utf8");

// Authoritative payment mode derivation and contract
must(pageSource.includes("PAYMENT_MODE"), "homepage must read PAYMENT_MODE environment variable");
must(
  pageSource.includes('paymentMode:"off"|"on"') || pageSource.includes('paymentMode: "off" | "on"'),
  "homepage must have explicit paymentMode type annotation"
);
must(pageSource.includes('import { betaCopy } from "../i18n/beta-copy";'), "homepage must import betaCopy");

// Section branching
must(
  pageSource.includes('paymentMode === "off"') || pageSource.includes('paymentMode==="off"'),
  "homepage must branch conditionally on paymentMode === 'off'"
);

// Extract OFF branch source block
const offBranchIdx = pageSource.indexOf('paymentMode === "off"');
must(offBranchIdx !== -1, "paymentMode === 'off' branch not found");
const colonIdx = pageSource.indexOf(") : (", offBranchIdx);
must(colonIdx !== -1, "conditional else branch not found");

const offBranchSource = pageSource.slice(offBranchIdx, colonIdx);
const onBranchSource = pageSource.slice(colonIdx);

// OFF branch invariant assertions
must(!offBranchSource.includes("price.display"), "OFF branch must not render price.display");
must(!offBranchSource.includes("oneTime"), "OFF branch must not render oneTime payment copy");
must(!offBranchSource.includes("priceCta"), "OFF branch must not render priceCta");
must(!offBranchSource.includes("filesReady"), "OFF branch must not render filesReady ('after purchase' note)");
must(!offBranchSource.includes("instantDigital"), "OFF branch must not render instantDigital ('after purchase' in JA/VI)");

must(offBranchSource.includes("beta.description"), "OFF branch must render beta.description");
must(offBranchSource.includes("m.home.create"), "OFF branch must render existing create CTA (m.home.create)");
must(offBranchSource.includes("createHref"), "OFF branch must link CTA to createHref");
must(offBranchSource.includes("price-card"), "OFF branch must preserve layout container (.price-card)");

// ON branch invariant assertions
must(onBranchSource.includes("price.display"), "ON branch must preserve price.display");
must(onBranchSource.includes("m.home.oneTime"), "ON branch must preserve m.home.oneTime");
must(onBranchSource.includes("launch.filesReady"), "ON branch must preserve launch.filesReady");
must(onBranchSource.includes("m.home.priceCta"), "ON branch must preserve m.home.priceCta");
must(onBranchSource.includes("launch.instantDigital"), "ON branch must preserve launch.instantDigital");
must(onBranchSource.includes("launch.noPhysical"), "ON branch must preserve launch.noPhysical");

// ---------------------------------------------------------------------------
// 2. Cross-locale content assertions across all 10 supported locales
// ---------------------------------------------------------------------------

// Prohibited buy/pay strings when payment is OFF
const prohibitedSubstrings: Record<string, string[]> = {
  en: ["one-time payment", "after purchase", "pay only"],
  vi: ["thanh toán một lần", "sau khi mua"],
  ja: ["一回払い", "購入後", "購入後は"],
  ko: ["1회 결제", "구매 후"],
  es: ["pago único", "tras la compra"],
  fr: ["paiement unique", "après achat"],
  de: ["Einmalzahlung", "nach Kauf"],
  pt: ["pagamento único", "após a compra"],
  it: ["pagamento unico", "dopo l’acquisto"],
  zh: ["一次性付款", "购买后"]
};

for (const locale of supportedLocales) {
  const beta = betaCopy(locale);
  const m = getMessages(locale);
  const launch = launchCopy(locale);

  must(Boolean(beta.eyebrow && beta.eyebrow.trim()), `${locale}: beta.eyebrow must be non-empty`);
  must(Boolean(beta.description && beta.description.trim()), `${locale}: beta.description must be non-empty`);
  must(Boolean(m.home.create && m.home.create.trim()), `${locale}: m.home.create must be non-empty`);
  must(Boolean(launch.noPhysical && launch.noPhysical.trim()), `${locale}: launch.noPhysical must be non-empty`);

  // Verify that beta.description does not contain prohibited purchase/one-time phrasing
  const prohibited = prohibitedSubstrings[locale] ?? [];
  for (const term of prohibited) {
    must(
      !beta.description.toLowerCase().includes(term.toLowerCase()),
      `${locale}: beta.description must not contain '${term}'`
    );
  }
}

console.log("homepage payment consistency stress: PASS");
