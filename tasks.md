# CardeLume WBS — Remaining Work

Canonical plan: `.ai/MASTER_PLAN.md` (exact mirror: `MASTERPLAN.MD`).
Updated: 2026-09-02

Legend: `[ ]` pending · `[~]` in progress · `[x]` verified complete · `[!]` blocked by approval.
This file contains only unfinished executable work plus compact completion anchors. Detailed history belongs in Git and evidence artifacts.

## Current checkpoint

| Area | Status | Next condition |
|---|---|---|
| Phase 19 Premium/WOW | `PASS_FOR_MVP` — closed | No N=12 rerun, N=30, Final Golden or evaluator infrastructure from this result. |
| Phase 20 core | `ACTIVE` | T03 Owner visual approval, then M3A browser/accessibility/performance gate. |
| Help me choose | `DEFERRED_FEATURE_OFF` | Decompose/implement only after explicit Owner activation. |
| Phase 21 runtime | `PENDING` | Start only after Phase 20 core PASS and bounded staging authorization. |
| Phase 22 launch | `PENDING` | Start only after Phase 21 and production-readiness gates PASS. |
| Production | `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES` | Build/source PASS and Git push are not deployment approval. |

## Completed anchors

- Phase 18 reproducible install/build and reviewable baseline retained; residual dependency/native, template/IP and runtime risks remain production blockers.
- Phase 19 Owner external review: `PASS_FOR_MVP`; `12 × 3 = 36` primary generations, `36` schema validations, `108` review renders, `324` physical files, zero evaluator calls/retries/fallbacks. Evidence: `.ai/evidence/phase19-mvp-closure.json`.
- `P20M1T01` baseline captured at `/home/pi5/hermes-artifacts/browser-evidence/cardelume/phase20-baseline/3fb66eb841ec6907230e997e89e2d2e612bbc9db/`.
- `P20M1T02` Product Proof verified locally with fail-closed provenance, serializable Server → Client boundary, `5/5` HTTP 200 and `0` browser JS errors.
- `P20M1T04` readable-body floor verified: renderer stress PASS, `5` formats, `10.4 CSS px` and `32 render px`; root test/lint/typecheck/build `11/11`.
- `P20M1T05` three-direction diversity guard verified: three unique family IDs/directions, at least two effective archetypes, adversarial stress PASS; AI/templates checks PASS.
- `P20M1T06` Case 06 metadata repair verified as hash-bound and metadata-only; no model rerun or raw-artifact replacement.
- Template Admin follow-up `P20AM1T01–T03` accepted as presentation-only; focused stress `44/44`, root gates `11/11`, independent Agy readonly review PASS. Evidence: `.ai/TEMPLATE_ADMIN_SIMPLIFICATION_PLAN.md`.

---

## Phase 20 — Buyer Confidence Core

**Entry gate:** Phase 19 `PASS_FOR_MVP` is satisfied. Core launch remains blocked until the Phase 20 exit gate passes. Help me choose is optional and feature-off by default.

### [#P20M1T03] [apps/web/public/brand/og-card.png, apps/web/app/layout.tsx] `approvedOpenGraphProductProof(): Metadata`

**Goal:** Replace the weak OG placeholder with an approved product-specific premium-card composition.

**Depends on:** `[#P20M1T02]`
**Parallel-safe:** `yes` after T02; tracked replacement is approval-gated.

**Current evidence:** Candidate only: `/home/pi5/hermes-artifacts/cardelume/phase20/P20M1T03/og-card-candidate.svg`. Tracked `og-card.png` and `layout.tsx` remain unchanged.

**Concrete changes:**
1. Request/record Owner visual approval for the candidate.
2. Only after approval, replace the tracked asset and update metadata if required.
3. Verify 1200×630 and reduced social-preview crops, same-origin metadata resolution, provenance and production build.

**Constraints:** No fake UI/testimonial/rating, unapproved or unlicensed asset, physical-shipping implication or production deploy. Do not replace the tracked asset before Owner approval.

**Definition of Done:** Owner approval is recorded; tracked asset/metadata, crop evidence and build pass; `git diff --check` passes; no production deployment is implied.

**Status:** `[!]`

---

### [#P20M3T01] [tests/browser-verify.sh] `verifyCorePhase20Journey(): EvidenceMatrix`

**Goal:** Qualify the launch-critical buyer journey independently of the optional sharing lane.

**Depends on:** `[#P20M1T02]`, `[#P20M1T03]`, `[#P20M1T04]`, `[#P20M1T05]`
**Parallel-safe:** `no`

**Concrete changes:**
1. Verify homepage → brief → reveal → results → finish → checkout boundary at `390×844`, `768×1024` and `1440×900`.
2. Cover loading/fallback/empty/error, keyboard-only, screen reader, 200% zoom and reduced motion.
3. Compare lab performance against the frozen Phase 20 baseline and capture DOM/screenshots/console/network evidence.

**Constraints:** No checkout/payment mutation, production data, production deploy or browser mutation automation. Owner performs final authenticated visual/UX acceptance manually; read-only local probes require explicit authorization. Missing field p75 data is `INSUFFICIENT_FIELD_SAMPLE`, not PASS.

**Definition of Done:** No P0/P1 defect, horizontal overflow or blocked primary action; trust text ≥`12 CSS px`; primary targets ≥`44×44 CSS px`; LCP ≤`2.5s`; CLS ≤`0.1`; no key Studio long task >`200ms`; no unapproved >`10%` regression from baseline.

**Status:** `[ ]`

### Phase 20 core exit gate

```text
VALUE_COMPREHENSION PASS
MARKETING_LOCALIZATION PASS
PRODUCT_PROOF_RENDERED PASS
CORE_BROWSER_ACCESSIBILITY_PERFORMANCE PASS
HELP_ME_CHOOSE PASS | DEFERRED_FEATURE_OFF
```

---

## Optional M2B — Help me choose (`DEFERRED_FEATURE_OFF`)

Do not implement or expose this lane unless the Owner explicitly activates it. The IDs below are reserved so future work keeps stable dependencies; all remain deferred.

| ID | Scope | Depends on |
|---|---|---|
| `P20M2T01` | Preserve authoritative generation job identity in Studio. | `none` |
| `P20M2T02` | Shared schemas for exactly three directions and plaintext note ≤`280`. | `none` |
| `P20M2T03` | Token-hash-only DB lifecycle, owner isolation, quotas and exact-ID purge; migration candidate only. | `P20M2T02` |
| `P20M2T04` | Server authority for owner/result checks and watermarked preview rendering. | `P20M2T02`, `P20M2T03` |
| `P20M2T05` | Bounded issue/vote/revoke/results/preview APIs and redacted analytics. | `P20M2T01`, `P20M2T04` |
| `P20M2T06` | No-account recipient page with exactly three previews and bounded feedback. | `P20M2T05` |
| `P20M2T07` | Creator issue/share/results/revoke UX; regenerate fail-closed while share is active. | `P20M2T01`, `P20M2T05`, `P20M2T06` |
| `P20M2T08` | Exact-ID worker cleanup for revoked/expired/replaced snapshots. | `P20M2T03`, `P20M2T04` |

Activation contract: watermarked reduced-resolution previews only; one-way token hash; seven-day default expiry; immediate revoke/replace invalidation; creator-only results; no clean JPG/PDF/private URL/raw brief leakage; rate limits; `no-store`/`noindex`/`no-referrer`; plaintext rendering; exact-ID cleanup. Its own security/browser gate must PASS before enablement.

---

## Phase 21 — Controlled Runtime Qualification (`PENDING`)

**Entry gate:** Phase 20 core PASS plus explicit Owner authorization for a bounded isolated staging run. No production or unrelated Supabase project. Snapshot before state-changing tests; restore and verify adjacent counts afterward.

### [#P21M1] Staging DB / migration / RLS / restore

- Back up local/staging test DB; apply migrations sequentially; verify constraints and triggers.
- Run user A/user B/service/admin RLS and IDOR matrix across cards, versions, uploads, payment, entitlement, recovery, analytics and approved-template paths.
- Verify rollback/restore and relevant adjacent data counts.

**Gate:** `STAGING_DB_RLS PASS` + `BACKUP_RESTORE PASS`.
**Status:** `[ ]`

### [#P21M2] Queue / AI / photo / renderer runtime

- Verify pg-boss durability, worker heartbeat/readiness, retry/idempotency and failure recovery.
- Verify R2 quarantine/sanitize/ownership/retention and final JPG/PDF renderer parity on exact approved versions.
- Measure CPU/RAM, queue wait, generation/render latency, safe concurrency, failure/fallback rate and cost.

**Gate:** `QUEUE_WORKER PASS` + `R2_PHOTO_RENDER PASS`.
**Status:** `[ ]`

### [#P21M3] Dodo test-mode commerce / fulfilment / recovery

- Verify signed server quote, checkout idempotency, webhook signature/replay, exact amount/currency/session reconciliation.
- Verify authoritative PAID transition, single fulfilment, entitlement and browser-closure recovery.
- Reject wrong/stale/tampered state; browser state never unlocks final files.

**Gate:** `DODO_PAYMENT_RECOVERY PASS`.
**Status:** `[ ]`

### [#P21M4] Security / legal / operations

- Verify CSP, admin defense in depth, rate limits and PII/token/secret log hygiene.
- Verify secret rotation procedure, native-language legal/refund/support copy, incident and failed-fulfilment runbooks.
- Rehearse isolated DB/R2 backup and restore. If sharing is off, record `DEFERRED_FEATURE_OFF`.

**Gate:** `CSP_ADMIN_SECURITY PASS` + `LEGAL_NATIVE_COPY APPROVED` + `BACKUP_RESTORE PASS`.
**Status:** `[ ]`

### Phase 21 exit gate

```text
STAGING_DB_RLS PASS
QUEUE_WORKER PASS
R2_PHOTO_RENDER PASS
DODO_PAYMENT_RECOVERY PASS
CSP_ADMIN_SECURITY PASS
LEGAL_NATIVE_COPY APPROVED
BACKUP_RESTORE PASS
SHARE_RUNTIME_SECURITY PASS | DEFERRED_FEATURE_OFF
```

---

## Phase 22 — Limited Soft Launch and Public Launch Decision (`PENDING`)

### [#P22M1] Soft-launch candidate

- Phase 19 MVP quality, Phase 20 core and Phase 21 core/security gates PASS.
- Phase 18 residual dependency/native, IP/font/asset risks fixed or explicitly Owner-accepted.
- `6–8` exact human-approved production template versions form a non-empty catalog.
- Reproducible production node, monitoring, backups, tested restore, verified pricing/currencies and assigned support/refund/incident ownership.
- Explicit Owner approval for `15–30` consented participants and paid transactions.

**Status:** `[ ]`

### [#P22M2] Private beta evidence

Measure completion and acceptable-direction rates, regeneration/fallback, payment/fulfilment/recovery failures, mobile-vs-desktop conversion, refunds/support, Premium/WOW/satisfaction/willingness-to-pay and AI/render cost per paid order. Predeclare commercial and reliability stop thresholds before reviewing data. Report field performance as `INSUFFICIENT_FIELD_SAMPLE` until the sample is usable.

**Status:** `[ ]`

### [#P22M3] Bounded optimization

One material variable per experiment. Priority: safety/payment/privacy → product quality and three-direction fit → trust/value → funnel friction → portfolio/economics → performance/accessibility → new features.

**Status:** `[ ]`

### [#P22M4] Public launch gate

- Payment, fulfilment and recovery are reliable.
- Premium/WOW/customer satisfaction and commercial metrics meet predeclared targets.
- No unresolved P0 security/privacy/IP/legal/accessibility issue.
- Operations are recoverable and backups current.
- Owner explicitly approves public launch.

**Final verdict:** `LAUNCH_READY` only with evidence.
**Status:** `[ ]`

---

## Execution boundaries

- Do not commit secrets, `.env` values, private customer data, prompts, logs, caches, `.turbo` output or unapproved artifacts.
- Do not stage unrelated dirty-worktree paths; use an explicit allowlist.
- Do not weaken auth, payment, entitlement, privacy, IP, template-approval or runtime gates.
- Do not call source/build/browser evidence production approval.
- Production deploy/promotion requires the Phase 20, Phase 21, production-preflight and separate Owner approval gates in `MASTERPLAN.MD`.
