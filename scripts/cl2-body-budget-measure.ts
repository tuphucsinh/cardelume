/**
 * CL2-BODY-01 measurement: read a live e2e report and score each generated direction
 * against the renderer's own body budget (softBodyVisualLimit / hardOverflow).
 * Ground truth comes from the deployed run, not from the test fixtures.
 */
import { readFileSync } from "node:fs";
import { cardCopyMetrics } from "@cardelume/card-schema";

const args = process.argv.slice(2);
const gate = args.includes("--gate");
const path = args.find((a) => !a.startsWith("--"));
if (!path) {
  console.error("usage: cl2-body-budget-measure.ts <report.json> [format] [--gate]");
  process.exit(2);
}
const fmtOverride = args.find((a) => !a.startsWith("--") && a !== path);
const raw = JSON.parse(readFileSync(path, "utf8"));
const cases = Array.isArray(raw) ? raw : (raw.cases ?? []);
const fmtFor = (vp?: string) =>
  fmtOverride ?? (vp === "desktop" ? "landscape-5x7" : "portrait-5x7");

let total = 0;
let overSoft = 0;
let overHard = 0;
const rows: string[] = [];

for (const c of cases) {
  const info = c.case ?? c;
  const dirs = (c.rounds ?? []).flatMap((r: any) =>
    (r.results ?? []).flatMap((res: any) => res.directions ?? []),
  );
  if (!dirs.length) {
    if (total === 0) console.log("NO_DIRECTIONS_FOUND case keys:", Object.keys(c).join(","));
    continue;
  }
  for (const d of dirs) {
    const body = d?.body ?? d?.copy?.body;
    const headline = d?.headline ?? d?.copy?.headline ?? "";
    if (!body) continue;
    const locale = info.lang ?? "en";
    const format = fmtFor(info.vp);
    const m = cardCopyMetrics(headline, body, locale, format);
    total++;
    if (m.suggestShortening) overSoft++;
    if (m.hardOverflow) overHard++;
    rows.push(
      `${info.id ?? "?"} ${locale} ${format} bodyVisual=${m.bodyVisual.toFixed(0)} soft=${m.softBodyVisualLimit.toFixed(0)} hard=${m.hardBodyVisualLimit.toFixed(0)} words=${String(body).split(/\s+/).length} suggest=${m.suggestShortening ? "Y" : "n"} hardOverflow=${m.hardOverflow ? "Y" : "n"}`,
    );
  }
}

for (const r of rows) console.log(r);
console.log(
  `SUMMARY directions=${total} over_soft=${overSoft} over_hard=${overHard} within_budget_pct=${total ? (((total - overSoft) / total) * 100).toFixed(1) : "n/a"}`,
);

// --gate turns the measurement into a standing check the e2e run can fail on.
if (gate) {
  if (total === 0) {
    console.error("BODY_BUDGET_GATE=FAIL no generated copy found in the report (wrong path or empty run)");
    process.exit(1);
  }
  if (overSoft > 0 || overHard > 0) {
    console.error(`BODY_BUDGET_GATE=FAIL over_soft=${overSoft} over_hard=${overHard} of ${total} directions`);
    for (const r of rows) if (r.includes("suggest=Y")) console.error(`  over budget: ${r}`);
    process.exit(1);
  }
  console.log(`BODY_BUDGET_GATE=PASS ${total} directions within the renderer body budget`);
}
