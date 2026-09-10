import fs from "node:fs";
import { supportedLocales } from "../apps/web/i18n/messages.ts";
import { betaCopy } from "../apps/web/i18n/beta-copy.ts";
import { launchCopy } from "../apps/web/i18n/launch-copy.ts";

function must(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`corrective_polish_failed: ${message}`);
}

const pageSource = fs.readFileSync("apps/web/app/page.tsx", "utf8");
const proofSource = fs.readFileSync("apps/web/components/product-proof-section.tsx", "utf8");
const betaSource = fs.readFileSync("apps/web/i18n/beta-copy.ts", "utf8");
const launchSource = fs.readFileSync("apps/web/i18n/launch-copy.ts", "utf8");

must(pageSource.includes('const trust=paymentMode === "off" ? beta.trust : m.home.trust;'), "homepage must use beta-safe trust copy when payment is off");
must(pageSource.includes("{trust.map("), "homepage must render the selected trust copy");
must(pageSource.includes("paymentMode={paymentMode}"), "homepage must pass payment mode to product proof");
must(betaSource.includes("const betaTrust:Record<LocaleCode,string[]>"), "beta trust copy must be locale keyed");
must(proofSource.includes("launch.downloadFormats"), "product proof must use the neutral downloadFormats field");
must(!proofSource.includes("vectorPdfJpg"), "product proof must not expose the old vector claim field");
must(proofSource.includes("paymentMode === \"off\" ? beta.finishNotice : launch.previewBeforePay"), "product proof must use beta-safe payment copy when payment is off");
must(proofSource.includes("paymentMode === \"on\" ? <span"), "product proof must hide one-time-payment copy when payment is off");
must(!launchSource.includes("vectorPdfJpg"), "launch copy must not expose the old vector claim field");

const internalTerms = /\b(?:MVP|AI|calibration|candidate|under review)\b|校准|캘리브레이션|calibrazione|calibración|étalonnage|Kalibrier|calibração|kiểm chuẩn/i;
for (const locale of supportedLocales) {
  const launch = launchCopy(locale);
  const beta = betaCopy(locale);
  must(!/vector|ベクター|벡터|vectorial|vettorial|vektoriell|vetorial|矢量|PDF vector/i.test(launch.proofSubtitle), `${locale} proof subtitle must not claim vector output`);
  must(!internalTerms.test(`${launch.proofSubtitle} ${launch.stagingNotice} ${launch.retainedMvpBadge} ${launch.showroomSubnote} ${launch.tabCaseAria}`), `${locale} customer copy contains internal QA wording`);
  must(/JPG/i.test(launch.downloadFormats) && /PDF/i.test(launch.downloadFormats), `${locale} download formats must name JPG and PDF`);
  must(!/vector|ベクター|벡터|vectorial|vettorial|vektoriell|vetorial|矢量/i.test(launch.downloadFormats), `${locale} download formats must not claim vector output`);
  must(beta.trust.length === 3 && beta.trust.every(Boolean), `${locale} beta trust row must have three localized entries`);
}

console.log("COPY_SURFACES=PASS");
console.log("BETA_PAYMENT_COPY=PASS");
console.log("EXPORT_CLAIM=PASS");
console.log("INTERNAL_QA_WORDING=PASS");
console.log("LOCALES_CHECKED=" + supportedLocales.length);
