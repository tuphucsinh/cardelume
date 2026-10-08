# CardeLume Master Plan

## CL2 — Generation Recovery & Premium UX — CURRENT AUTHORITY (2026-10-08)

**Base:** `cl2-release` forked from `origin/main` = `e476ad71780413e0b5658f872d4dbdd6a9d32dd5` (deployed runtime SHA). Local `main` (`a73546a`) and its dirty tree are frozen (OWNER-01).
**Status:** in progress. Active task queue: `tasks.md` §CL2-*.

### Problem (verified 2026-10-08)

Every realistic brief (recipient + detail) ended in `ai_generation_safe_failure`: the per-card literal copy contract was violated → `repairSemanticCopyContract` replaced all copy and overwrote `creativeThesis` with near-identical text → `creative_range`; the deterministic recovery copy then shared a relationship/detail suffix → `creative_range` again. Only EN/VI anchors existed, so 8 of 10 locales could never satisfy the contract. `@cardelume/ai` had a no-op package test and the E2E matrix asserted only "copy present", so the regression shipped. Provider, catalog and code were unchanged since the 2026-09-10 `20/20` PASS.

### Approach (bounded optimality check)

Loosening thresholds and deleting the deterministic repair were both rejected (they hide real duplicate trios or rely on the same robotic copy). Instead: make the contract set-level and locale-aware, make the repair minimal and same-language without overwriting per-direction thesis, exclude user-supplied inputs from similarity, replace the fallback copy bank with curated localized copy plus `generationSource` provenance, and wire a real generation-quality suite into the root gates. Thresholds `.62`/`.68` stay unchanged.

### CL2 scope and gates

Tasks: `CL2-CTRL-01`, `CL2-GEN-01/02`, `CL2-API-01`, `CL2-UX-01`, `CL2-UI-01/02/03`, `CL2-PERF-01`, `CL2-OPS-01`, `CL2-E2E-01`, `CL2-REL-01`, `CL2-DONE` (see `tasks.md`).
Approval gates: candidate deploy + bounded live provider matrix (`CL2-E2E-01`), runtime `AI_MODEL` pin (`CL2-OPS-01`), push to `origin/main` (`CL2-REL-01`).
Non-goals: payment activation, template approval, catalog expansion, DB migration, provider/governance framework, renderer rewrite, DNS/Cloudflare changes.

### Owner decisions

`OWNER-01` unpushed canonical WIP in the frozen dirty tree (template-admin routes, migration `0012`, 36 differing tracked files). `OWNER-02` zero production-approved templates; public runs `appEnv=staging`; paid launch `NO_GO`.

### Historical — Regression Recovery (superseded, evidence only)


**Baseline:** `0.4.3-step.17j` + public non-payment beta changes
**Canonical editable plan:** `.ai/MASTER_PLAN.md`
**Mirror:** `MASTERPLAN.MD` must exist and be byte-identical; it is not an independent authority.
**Updated:** 2026-09-03

## Status

| Area | Status |
|---|---|
| Phase 19 Premium/WOW | `DONE — PASS_FOR_MVP` |
| Phase 20 Buyer Confidence | `DONE — PASS` — historical closure retained |
| Public non-payment beta | `BLOCKED_BY_REGRESSION` |
| Phase 21R Product Correctness Recovery | `ACTIVE` |
| Payment / Dodo | `OFF / DEFERRED_BY_OWNER` |
| Help me choose | `DEFERRED_FEATURE_OFF` |
| Oracle failover | `DEFERRED_BY_OWNER_INFRA` |
| Paid launch | `NO_GO` |

## Reconciled remote baseline — historical, not final RC evidence

Remote `origin/main` advanced to `ff6660576864f04a54cc322f58b23ffd6e579e21` after the former candidate tree was verified. Its additive baseline is retained here without promoting it to the Phase 21R RC evidence:

- Phase 20 Buyer Confidence Core remained `DONE — PASS`; historical evidence and Owner visual/UX acceptance boundaries are preserved.
- The remote public non-payment beta record remains historical evidence only. It records payment OFF, public health/security checks, bounded fallback/export behavior and Owner-approved legal-copy flags; it does not prove the reconciled RC or authorize paid launch.
- Legal identity/config additions from the remote baseline are carried into the reconciled candidate as non-secret, Owner-approved beta metadata. `PAYMENT_MODE=off`, Dodo deferred, Oracle deferred and paid launch `NO_GO` remain unchanged.
- The reconciled candidate must repeat root, product, browser and public-edge verification after the remote overlap; no former runtime or tree is authoritative.

## Decision

Freeze feature expansion. Keep `PAYMENT_MODE=off`.

The recovery is complete only when the card selected in Studio and the downloaded JPG/PDF use one server-owned resolved presentation contract for the same exact managed template/version, with correct visible text, three genuinely distinct directions, and semantic output tests that fail on visually broken files.

Do not rewrite historical PASS evidence. Record new candidate-bound regression evidence.

## Non-negotiable invariants

1. **One presentation source of truth:** AI/result, Studio preview and final export consume one server-owned resolved presentation contract containing the managed `templateId`, `templateVersionId`, exact renderer identity, customer-facing style identity, visual/layout/archetype data, typography identity and photo compatibility/state.
2. **Template identity is authoritative:** internal slot names cannot become misleading customer-facing style names.
3. **Real diversity:** the final three directions must differ materially, not only by ID/color.
4. **HTTP 200 is not correctness:** JPG/PDF PASS requires the real production raster path, visible headline/body content, wrong-template rejection and preview/final parity assertions.
5. **Server authority remains intact:** browser cannot author template approval, renderer key, payment, entitlement or private asset access.
6. **Payment stays OFF:** no Dodo/order/PAID/entitlement mutation in Phase 21R.
7. **No scope creep:** Help me choose, accounts, subscriptions, Final Golden, Oracle HA and paid launch are excluded.
8. **Every PASS is SHA-bound and evidence-backed.**

## Execution model

- **Implementer:** Agy — `gemini-3.8-flash-high`.
- **Reviewer:** Mika only at explicit checkpoints or when Agy returns `REVIEW_REQUIRED`.
- Mika reviews read-only and returns `PASS`, `PASS_WITH_NOTES`, or `REWORK`.
- One task = one concern, independently verifiable. Split tasks that mix unrelated concerns.
- No commit/push/deploy/secret rotation/payment activation unless explicitly authorized.

## Phase 21R workstreams

### R0 — Freeze and truth reset
Record exact regression baseline, mark current beta blocked, preserve old evidence, freeze deferred lanes.

**P21R0T01 baseline:**
- HEAD: `214b5ff011c01594cfaf14c1757bf814b55e0d8a`
- branch: `main`
- dirty-state: `NON-CLEAN` (pre-existing tracked and untracked changes preserved)
- `PUBLIC_BETA=BLOCKED_BY_REGRESSION`
- `PAYMENT_MODE=off`

**Exit**
```text
REGRESSION_BASELINE PASS
PAYMENT_MODE OFF
RECOVERY_SCOPE_FROZEN PASS
```

### R1 — Canonical preview/final rendering
Create one server-owned resolved presentation contract tied to an exact managed template/version; remove slot-name/template-name conflation; make preview and final export consume that contract; align renderer/font/runtime ownership. `visualDirection` alone is never sufficient preview identity and the browser cannot author approval or renderer identity.

**Mika R1 review:** cross-package architecture and preview/final identity.

**Exit**
```text
CANONICAL_PRESENTATION_CONTRACT PASS
TEMPLATE_LABEL_IDENTITY PASS
PREVIEW_TEMPLATE_PARITY PASS
TYPOGRAPHY_RUNTIME_PARITY PASS
```

### R2 — Renderer/export semantic correctness
Replace fake raster release evidence with the real production renderer/raster path; add simple fixture-based visible-content assertions; add preview-vs-final parity fixtures; qualify beta JPG/PDF in the real runtime. The authoritative matrix covers portrait-5x7, folded-5x7, square-5x5, landscape-7x5 and postcard-6x4; Latin/Vietnamese, Japanese, Korean and Simplified Chinese; photo/no-photo; and one edited Finish-state case.

**Exit**
```text
REAL_RENDER_STRESS PASS
GLYPH_CONTENT_ASSERTIONS PASS
PREVIEW_FINAL_PARITY PASS
BETA_EXPORT_RUNTIME PASS
R2_EXIT PASS
```

### R3 — AI exactly-three + true diversity
Make the known AI verification path executable, handle valid/invalid structured output including the real `ai_direction_count_invalid` class, and keep repair/fallback bounded by one server-owned deadline and call budget. Every customer-visible normal or fallback direction carries an approved managed template/version. Hard constraints veto; soft creative signals inform; premium AI makes the final creative decision.

**Mika R3 review:** PASS — server fallback, rendered New Baby/Other neutral copy, preserved occasion state and Birthday regression checks passed in production Chrome at 390×844, 768×1024 and 1440×900.

**Exit**
```text
AI_EXACTLY_THREE PASS
AI_BOUNDED_FAILURE PASS
CUSTOMER_DIRECTION_DIVERSITY PASS
FALLBACK_OCCASION_COVERAGE PASS
GENERATION_DEADLINE_BUDGET PASS
R3_EXIT PASS
```

### R4 — Studio/beta UX cleanup
Make Studio a real Brief → Choose → Finish flow; show actual selected style identity; make beta/payment copy consistent; effects off by default; remove customer-facing localization drift.

**Mika R4 review:** desktop + mobile visual/UX.

**Exit**
```text
STUDIO_3_STEP_HIERARCHY PASS
BETA_MESSAGING_CONSISTENT PASS
VISUAL_IDENTITY_CORRECT PASS
PHYSICAL_EFFECTS_DEFAULT_OFF PASS
CUSTOMER_COPY_LOCALIZED PASS
R4_EXIT PASS
```

### R5 — Release hardening — DONE — PASS
Keep R5 lean: wire the authoritative product release gate so source-string or HTTP-only checks cannot claim readiness, and keep a simple source-of-truth consistency check. Preserve existing security controls; do not add new Turnstile, abuse-control, synthetic-canary or monitoring infrastructure in this recovery unless an existing launch blocker independently requires it.

**Exit**
```text
RELEASE_PRODUCT_CORRECTNESS_GATE PASS
SOURCE_OF_TRUTH_SYNC PASS
```

**R5 execution evidence (2026-09-04):** `P21R5T03` passed with product correctness `PASS`: product/source, creative, commerce, media, runtime, templates, IP, real renderer, semantic JPG/PDF matrix, Chrome CDP browser evidence, and root test/lint/typecheck/build all passed on candidate `0.4.3-step.17j` / HEAD `214b5ff011c01594cfaf14c1757bf814b55e0d8a`. A deliberate browser-failure artifact produced `RELEASE_PRODUCT_CORRECTNESS_GATE: FAIL`, confirming fail-closed behavior. `P21R5T04` passed source-of-truth consistency. Existing security/owner gates remain `NO_GO`; this does not activate payment or make a production-release claim.

### R6 — Regression acceptance
Run root gates and semantic E2E across desktop/tablet/mobile, reduced motion/200%, AI normal/fallback, photo/no-photo, five formats, representative scripts and all launch locales.

**Mika R6 review:** final read-only product review after automation passes.

**R6 execution evidence (2026-09-04):** `R6T01 PASS`, `R6T02 PASS`, and `R6T03 PASS` on candidate `0.4.3-step.17j` / HEAD `214b5ff011c01594cfaf14c1757bf814b55e0d8a`. Fresh Chrome CDP covered 5 primary locales plus 5 remaining locales across `390x844`, `768x1024`, and `1440x900`; exactly-three/diversity, Finish/payment-off visibility, localization, overflow and runtime/network checks passed. Semantic JPG/PDF/photo/no-photo/five-format and bounded failure contracts passed. `R6T04 BLOCKED_EXTERNAL_PREREQUISITE`: no Owner-approved deployed candidate was available, and no deployment was performed. Mika local final review is `PASS_WITH_NOTES` with no P0/P1; `R6T05` remains open and the public-beta block is preserved.

**Final exit**
```text
ROOT_GATES PASS
BROWSER_JOURNEY PASS
EXPORT_SEMANTIC_MATRIX PASS
MIKA_FINAL_REVIEW PASS
PUBLIC_BETA_READY_WITH_PAYMENT_OFF PASS
PAYMENT_MODE OFF
PAID_LAUNCH NO_GO
```

## Deferred until explicit Owner activation

- Dodo/payment/recovery and paid entitlement.
- Oracle/VPS failover.
- Help me choose.
- Final Golden / N=30 evaluator program.
- Accounts/subscriptions/social/physical fulfilment.
- Broad catalog expansion unrelated to regression recovery.

## Evidence standard

Each gate PASS records the candidate SHA, relevant commands/results, and the artifact or review result needed to support that gate. Historical evidence remains unchanged; no new synchronization or evidence framework is introduced.

`UNKNOWN`, `SKIPPED`, `BLOCKED`, `NOT_RUN`, HTTP `200`, valid MIME, or “build succeeded” alone are never product correctness.

Detailed executable work lives only in `tasks.md`; historical completion detail stays in Git/evidence.
