# CardeLume WBS — Phase 21R Regression Recovery

**Canonical editable plan:** `.ai/MASTER_PLAN.md`; `MASTERPLAN.MD` is a required byte-identical mirror.
**Updated:** 2026-09-03
**Default executor:** Agy (`gemini-3.8-flash-high`)
**Reviewer:** Mika only where marked

Legend: `[ ]` pending · `[~]` active · `[x]` verified · `[!]` blocked.

## Task standard

Each task must have one concern, a bounded primary area, focused verification and an explicit DoD. If a task cannot be independently verified, split it.

Agy must:
- inspect current source before editing;
- edit only files reasonably required by the current task;
- preserve payment/security/template-approval/private-asset boundaries;
- run focused tests and `git diff --check`;
- stop on missing prerequisite, unrelated dirty-path collision or destructive ambiguity.

If completing a task requires crossing into a materially unrelated package or domain, stop and return `REVIEW_REQUIRED`. Do not add a new governance or evidence framework.

Mika reviews read-only and returns `PASS`, `PASS_WITH_NOTES` or `REWORK`.

Current state: `PUBLIC_BETA=BLOCKED_BY_REGRESSION`, `PAYMENT_MODE=off`, Dodo/Oracle/Help-me-choose deferred.

## Reconciled remote baseline — historical, not final RC evidence

- Remote base: `origin/main=ff6660576864f04a54cc322f58b23ffd6e579e21`; its Phase 20/public non-payment/legal records are retained as historical inputs only.
- Remote legal metadata is included only where it is additive and Owner-approved; it does not unlock payment, production promotion or paid entitlement.
- This Phase 21R WBS remains the active recovery authority; all R6 evidence must be regenerated from the reconciled candidate tree.

---

## R0 — Freeze and truth reset

### [#P21R0T01] Regression baseline
**Status:** `[x]` · **Review:** none · **Depends:** none
**Goal:** bind the current defects to exact HEAD and stop stale readiness claims.
**Scope:** plan/status/evidence files only.
**Work:** record current HEAD and dirty-state; record `PUBLIC_BETA=BLOCKED_BY_REGRESSION`; preserve all historical PASS evidence unchanged; recreate and verify `MASTERPLAN.MD` as the byte-identical mirror of `.ai/MASTER_PLAN.md`; keep `PAYMENT_MODE=off`.
**Verify:** compare the two plan files byte-for-byte or by hash; run `git diff --check`; confirm no historical evidence file changed.
**DoD:** `REGRESSION_BASELINE=PASS`.

### [#P21R0T02] Freeze deferred lanes
**Status:** `[x]` · **Review:** none · **Depends:** R0T01 · **Parallel:** yes
**Goal:** prevent recovery work from activating unrelated features.
**Scope:** deferred feature flags and recovery boundaries.
**Work:** confirm Help me choose remains OFF, Dodo remains OFF/deferred, and Oracle is not a recovery dependency; add no new product scope.
**Verify:** payment-off/deferred-feature focused checks.
**DoD:** `RECOVERY_SCOPE_FROZEN=PASS`.

---

## R1 — Canonical preview/final rendering

### [#P21R1T01] Canonical presentation contract
**Status:** `[x]` · **Review:** none · **Depends:** R0T01
**Goal:** define one exact server-owned presentation contract for result → Studio preview → final JPG/PDF.
**Scope:** `card-schema`, managed templates and renderer interfaces plus focused tests.
**Work:** resolve and carry `templateId`, `templateVersionId`, exact `rendererTemplateKey` or equivalent render identity, customer-facing template/style identity, visual/layout/archetype data, typography identity and photo compatibility/state. Keep the contract small and reusable; `visualDirection` alone is not sufficient identity.
**Constraints:** the browser cannot author approval or renderer identity; no DB migration without `REVIEW_REQUIRED`.
**Verify:** schema round-trip, incompatible version rejection and exact managed version preservation.
**DoD:** `CANONICAL_PRESENTATION_CONTRACT=PASS`.

### [#P21R1T02] Separate slot ID from customer style identity
**Status:** `[x]` · **Review:** none · **Depends:** R1T01
**Goal:** slot=`midnight` cannot force the label “Midnight Lume” for a non-midnight selected template.
**Scope:** direction resolution, managed template metadata and customer-facing labels.
**Work:** use slot only for routing; populate name/material/badge from the exact managed template; require approved `templateId + templateVersionId` for every customer-visible direction; fail closed on missing identity.
**Verify:** adversarial slot/template mismatch test and missing-identity rejection at final beta export.
**DoD:** `TEMPLATE_LABEL_IDENTITY=PASS`.

### [#P21R1T03] Preview consumes canonical presentation
**Status:** `[x]` · **Review:** none · **Depends:** R1T01,R1T02
**Goal:** remove generic `visualDirection` preview drift.
**Scope:** Studio preview and the server-owned presentation resolver.
**Work:** make preview consume the one resolved presentation contract used by final export, including the exact managed template/version and layout/art/typography data. Do not create a second preview source or let the browser author renderer identity.
**Verify:** trace the same exact template/version from AI result through preview to export; use editorial/dark/tactile/photo fixtures.
**DoD:** `PREVIEW_TEMPLATE_PARITY=PASS`.

### [#P21R1T04] Renderer/font/runtime ownership
**Status:** `[x]` · **Review:** none · **Depends:** R1T01 · **Parallel:** yes
**Goal:** beta export and worker use an intentional renderer/font runtime.
**Scope:** package manifests, runtime imports and required font/native dependencies.
**Work:** declare renderer dependencies where imported; remove root-hoist reliance; align required fonts/native dependencies and use the canonical renderer runtime for beta export and worker. If ownership cannot be proven, stop with `REVIEW_REQUIRED`.
**Verify:** frozen install/build, production-like web export boot and no silent font fallback.
**DoD:** `TYPOGRAPHY_RUNTIME_PARITY=PASS`.

### [#P21R1G01] Mika R1 checkpoint
**Status:** `[ ]` · **Executor:** Mika · **Depends:** R1T03,R1T04
Review exact template/version identity, one-source presentation contract and security boundaries.
**Pass:** no P0/P1.

---

## R2 — Renderer/export semantic correctness

### [#P21R2T01] Real renderer stress
**Status:** `[x]` · **Review:** none · **Depends:** R1G01,R1T04
**Goal:** renderer tests must execute the real production raster path.
**Scope:** renderer/export stress and its focused test helpers.
**Work:** run the actual Resvg/production rasterizer; a raster stub that ignores SVG/content may remain only as a narrow unit helper and never as release evidence. Retain dimensions/DPI/MediaBox/determinism where valid.
**Verify:** a fixed good fixture passes and a controlled text/font break fails, without leaving a mutation behind.
**DoD:** `REAL_RENDER_STRESS=PASS`.

### [#P21R2T02] Visible glyph/content assertions
**Status:** `[x]` · **Review:** none · **Depends:** R2T01
**Goal:** detect blank headline/body despite valid MIME/size.
**Scope:** semantic artifact assertions for JPG and rasterized PDF pages.
**Work:** assert that expected headline/body regions contain visible card content for Latin/Vietnamese, Japanese, Korean and Simplified Chinese. Calibrate one simple deterministic threshold from fixed good/bad fixtures during implementation; do not tune it against candidate output.
**Verify:** a good JPG and rasterized PDF fixture pass; blank-text and missing-font fixtures fail.
**DoD:** `GLYPH_CONTENT_ASSERTIONS=PASS`.

### [#P21R2T03] Preview-final parity harness
**Status:** `[x]` · **Review:** none · **Depends:** R1G01,R1T03,R2T01
**Goal:** catch wrong-template/layout output after selection.
**Scope:** preview/final parity harness and fixed presentation fixtures.
**Work:** compare the canonical presentation identity and stable structural output for at least four managed families. Use a simple fixture-calibrated comparator; do not add arbitrary pixel/perceptual thresholds to the plan.
**Verify:** deliberate template/version mismatch and typography shift fail.
**DoD:** `PREVIEW_FINAL_PARITY=PASS`.

### [#P21R2T04] Real beta export matrix
**Status:** `[x]` · **Review:** none · **Depends:** R1G01,R1T04,R2T02,R2T03
**Goal:** qualify `/api/beta/export` in the actual web runtime.
**Scope:** beta export route and semantic export matrix.
**Work:** cover JPG/PDF × portrait-5x7, folded-5x7, square-5x5, landscape-7x5, postcard-6x4 × Latin/Vietnamese, Japanese, Korean and Simplified Chinese × photo/no-photo, plus one Finish-state case with edited customer text.
**Assert:** exact approved `templateId + templateVersionId`, visible headline/body content in JPG and rasterized PDF, page/dimension correctness, wrong-template rejection, no private URL/token leak and no order/PAID/entitlement mutation. Missing exact identity must fail closed; it may not derive a template from slot ID, `visualDirection` or a direction→template table.
**Verify:** execute the real web runtime matrix; the good fixture passes, blank-text and wrong-template fixtures fail, and both JPG/PDF are checked.
**DoD:** `BETA_EXPORT_RUNTIME=PASS`.

---

## R3 — AI exactly-three + true diversity

### [#P21R3T01] Provider capability + structured output
**Status:** `[x]` · **Review:** none · **Depends:** R0T02 · **Parallel:** yes
**Goal:** make the known AI verification path executable and handle the real invalid-count failure.
**Scope:** existing AI provider/parser path and its focused verification.
**Work:** repair the known execution failure in the current verification path (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` at `packages/ai/src/index.ts:35`); verify valid structured response, invalid JSON, invalid direction count and the real `ai_direction_count_invalid` class. Use native structured output when the current provider supports it cleanly; otherwise retain the strict parser. Do not add a generic provider framework.
**Verify:** valid, malformed JSON, wrong count, invented ID/version, oversized response and timeout.
**DoD:** `AI_PROVIDER_CONTRACT=PASS`.

### [#P21R3T02] Bounded exactly-three repair/fallback
**Status:** `[x]` · **Review:** none · **Depends:** R3T01
**Goal:** always reach exactly 3 valid directions or fail safely without retry loops.
**Scope:** generation repair/fallback path and direction identity propagation.
**Work:** bound AI calls and retries; choose the exact maximum call count from the existing pipeline during implementation, with no unbounded retry. Use one server-owned end-to-end deadline/budget; when remaining budget is insufficient, stop AI work and use a safe deterministic fallback. Every customer-visible normal or fallback direction must carry an approved `templateId + templateVersionId`; never bypass eligibility or approval.
**Verify:** provider returns 0/1/2/4, duplicates, invalid IDs/versions, timeout and failed repair; missing fallback identity fails closed.
**DoD:** `AI_EXACTLY_THREE=PASS`, `AI_BOUNDED_FAILURE=PASS`.

### [#P21R3T03] Strong final diversity gate
**Status:** `[x]` · **Review:** none · **Depends:** R3T02,R1T01
**Goal:** prevent “same card in three colors”.
**Scope:** final direction validation/repair and creative diversity scoring.
**Work:** hard-fail duplicate exact template/version, misleading identity, incompatible template, invalid photo requirement and effectively duplicate customer directions where valid alternatives exist. Treat material, color, energy and composition differences as creative scoring/repair signals rather than rigid universal quotas. Preserve: hard constraints veto, soft scores inform, premium AI makes the final creative decision.
**Repair:** use the existing critic/template-swap path; if valid alternatives do not exist, return a safe fallback/failure rather than a misleading trio.
**Verify:** adversarial all-ivory, same-archetype, duplicate-family, invalid-photo and small-pool cases.
**DoD:** `CUSTOMER_DIRECTION_DIVERSITY=PASS`.

### [#P21R3T04] Complete fallback occasions
**Status:** `[x]` · **Review:** none · **Depends:** R3T02 · **Parallel:** yes
**Goal:** every UI occasion has a correct deterministic fallback with exact managed identity.
**Scope:** fallback occasion mapping and enum coverage.
**Work:** cover New Baby/Other and any other missing values; add enum-coverage test; ensure each fallback contains an approved `templateId + templateVersionId`.
**Verify:** every supported occasion resolves to an approved fallback and missing identity fails closed.
**DoD:** `FALLBACK_OCCASION_COVERAGE=PASS`.

### [#P21R3T05] Shared generation deadline
**Status:** `[x]` · **Review:** none · **Depends:** R3T02
**Goal:** browser fallback cannot race an abandoned expensive worker path.
**Scope:** server-owned generation deadline and budget propagation.
**Work:** enforce one end-to-end deadline across director→expand→critic; reserve fallback budget; stop launching phases when budget is insufficient; use bounded calls/no unbounded retries and safe exact-identity fallback; record only existing cancellation telemetry needed to diagnose the path.
**Verify:** normal, slow-first-call, expansion, critic and timeout-before-fallback.
**DoD:** `GENERATION_DEADLINE_BUDGET=PASS`.

### [#P21R3G01] Mika R3 quality checkpoint
**Status:** `[x]` · **Executor:** Mika · **Depends:** R3T03,R3T04,R3T05
Review ≥8 representative briefs across photo/no-photo, feelings and scripts.
**Pass:** no misleading label, fallback mismatch or sibling-trio P0/P1.

---

## R4 — Studio/beta UX cleanup

### [#P21R4T01] True 3-step Studio hierarchy
**Status:** `[x]` · **Review:** none · **Depends:** R1T02
**Goal:** Brief → Choose → Finish/Download, one dominant hierarchy/action per phase.
**Scope:** Studio flow and customer-facing selected-style presentation.
**Work:** preserve focus/live-region/keyboard; show the resolved style identity; no template-editor/marketplace behavior.
**Verify:** 390×844, 768×1024, 1440×900, keyboard, 200%, reduced motion.
**DoD:** `STUDIO_3_STEP_HIERARCHY=PASS`.

### [#P21R4T02] Payment-off messaging consistency
**Status:** `[x]` · **Review:** none · **Depends:** R0T02 · **Parallel:** yes
**Goal:** homepage/Studio/finish never contradict “free beta” vs “pay”.
**Scope:** payment-mode customer messaging only.
**Work:** propagate authoritative payment mode to marketing/Studio; beta OFF uses free-download copy; ON retains future one-time-payment copy without activating payment.
**Verify:** OFF/ON snapshots and no contradictory customer strings.
**DoD:** `BETA_MESSAGING_CONSISTENT=PASS`.

### [#P21R4T03] Physical effects default OFF
**Status:** `[x]` · **Review:** none · **Depends:** none · **Parallel:** yes
**Goal:** physical effects cannot surprise customers or request motion permission by default.
**Scope:** Studio physical-effect preferences and permission path.
**Work:** master/haptics/gyro/lighting default false; explicit opt-in; no motion permission before user action; preserve stored preference.
**Verify:** fresh profile, saved-on profile, reduced motion and permission path.
**DoD:** `PHYSICAL_EFFECTS_DEFAULT_OFF=PASS`.

### [#P21R4T04] Customer copy localization cleanup
**Status:** `[x]` · **Review:** none · **Depends:** R1T02 · **Parallel:** yes
**Goal:** remove hardcoded launch copy from recovered customer journey.
**Scope:** customer-facing localization and template metadata labels.
**Work:** move customer-visible gallery/result/beta labels to i18n; safe locale fallback for template metadata.
**Verify:** all 10 locales and placeholder/overflow smoke.
**DoD:** `CUSTOMER_COPY_LOCALIZED=PASS`.

### [#P21R4G01] Mika R4 visual/UX checkpoint
**Status:** `[x]` · **Executor:** Mika · **Depends:** R4T01,R4T02,R4T03,R4T04
Review desktop+mobile hierarchy, premium feel, exact style identity and beta clarity.
**Pass:** no P0/P1.

---

---

## R6 — Regression acceptance

### [#P21R6T01] Clean root/focused gates
**Status:** `[x]` · **Review:** none · **Depends:** R1G01 (architecture checkpoint), R2T04 (semantic renderer/export gate), R3G01 (quality checkpoint), R4G01 (UX checkpoint), R5T03 (release gate)
**Goal:** join the completed workstream gates before final E2E acceptance.
**Scope:** root and focused verification only; no new product behavior.
**Work:** run root test, lint, typecheck, build, real renderer/export stress, AI/diversity stress and the release product gate.
**Verify:** all required checks pass on the exact candidate SHA; a `REWORK` checkpoint blocks acceptance.
**DoD:** all PASS on the exact candidate SHA; a `REWORK` checkpoint blocks acceptance.

### [#P21R6T02] Primary semantic E2E matrix
**Status:** `[x]` · **Review:** none · **Depends:** R6T01
**Goal:** prove the repaired customer journey across the primary browser and export matrix.
**Scope:** local/staged runtime, browser journey and semantic JPG/PDF output.
**Work:** execute the primary browser and export matrix below on the candidate.
**Matrix:** 390×844 / 768×1024 / 1440×900; reduced motion; 200%; en/vi/ja/ko/zh; 5 formats; photo/no-photo; AI normal + bounded fallback; JPG/PDF.
**Assert:** exact template/version parity, true 3-way diversity, visible/correct text, no JS/runtime error, no overflow/action block, no paid mutation, no private leak.
**Verify:** execute the matrix on the candidate; every listed assertion passes.
**DoD:** `PRIMARY_E2E_MATRIX=PASS`.

### [#P21R6T03] Remaining locale/failure smoke
**Status:** `[x]` · **Review:** none · **Depends:** R6T02
**Goal:** prove recovery behavior outside the primary launch-locale matrix.
**Scope:** remaining launch locales and bounded failure states.
**Work:** execute the remaining locale and failure-state smoke cases below.
**Locales:** es/fr/de/pt/it.
**Failures:** provider timeout, invalid count, photo error, export unavailable, rate limit.
**Verify:** no placeholder/overflow P0/P1, misleading identity or broken recovery.
**DoD:** no placeholder/overflow P0/P1, misleading identity or broken recovery.

### [#P21R6T04] Public repaired-beta smoke
**Status:** `[x]` · **Result:** `BLOCKED_EXTERNAL_PREREQUISITE` · **Depends:** R6T02,R6T03
**Goal:** verify an already Owner-approved deployed candidate, not local source and not a new deployment.
**Scope:** public repaired-beta smoke only.
**Work:** homepage → brief → 3 directions → choose → finish → JPG/PDF, desktop+mobile.
**Verify:** approved deployed SHA, TLS/security, live/ready/worker, semantic downloaded files and payment disabled before mutation.
**Constraint:** Agy must not deploy or modify Cloudflare, DNS, Pi5 routing, Oracle or payment. If no Owner-approved deployed candidate exists, return `BLOCKED_EXTERNAL_PREREQUISITE`. No Dodo or unrelated VOrigin changes.
**DoD:** `PUBLIC_PAYMENT_OFF_SMOKE=PASS` or the explicit blocked result above.

### [#P21R6G01] Mika final product review
**Status:** `[x]` · **Result:** `PASS_WITH_NOTES` · **Executor:** Mika · **Depends:** R6T04
Review 3 normal journeys + 1 fallback, desktop+mobile, preview/download parity, premium quality and beta clarity.
**Pass:** `PASS`/`PASS_WITH_NOTES` with no P0/P1.

### [#P21R6T05] Close regression
**Status:** `[ ]` · **Review:** none · **Depends:** R6G01
**Goal:** close the regression only after independent final acceptance.
**Scope:** plan/status/evidence closure; no product-code changes.
**Work:** create final candidate-bound evidence; update plan/tasks/project context; preserve old evidence; remove the beta block only if every R6 gate passes. `PUBLIC_BETA_READY_WITH_PAYMENT_OFF=PASS` is allowed only after R6 acceptance, never before it.
**Verify:** R6G01 is PASS or PASS_WITH_NOTES with no P0/P1, all R6 gates are PASS, and payment/deferred statuses remain unchanged.
**DoD:**
```text
PHASE_21R PASS
PUBLIC_BETA_READY_WITH_PAYMENT_OFF PASS
PAYMENT_MODE OFF
DODO DEFERRED_BY_OWNER
ORACLE_FAILOVER DEFERRED_BY_OWNER_INFRA
PAID_LAUNCH NO_GO
```

---

## Deferred queue — do not execute

Dodo/payment/recovery · Oracle failover · Help me choose · Final Golden/N=30 · accounts/subscriptions/social/physical fulfilment · unrelated catalog expansion.
