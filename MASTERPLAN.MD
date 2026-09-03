# CardeLume Master Plan — Current Execution

**Project:** CardeLume
**Source baseline:** `0.4.3-step.17j`
**Primary plan:** `.ai/MASTER_PLAN.md`
**Exact mirror:** `MASTERPLAN.MD`
**Updated:** 2026-09-03

## Executive status

| Area | Status | Meaning |
|---|---|---|
| Phase 19 Premium/WOW | `DONE — PASS_FOR_MVP` | Owner accepted MVP progression only; not Final Golden or production-template approval. |
| Phase 20 Buyer Confidence Core | `DONE — PASS` | Core buyer-journey/browser/accessibility/performance gate passed on candidate `ee9ec4a814c668b326edd9fc10eda752bacbbdf7`. |
| Help me choose | `DEFERRED_FEATURE_OFF` | Optional; it must not block the core launch. |
| Phase 21 Runtime Qualification | `PENDING` | No production runtime, payment, storage, queue or restore proof is complete. |
| Phase 22 Soft/Public Launch | `PENDING` | Starts only after Phase 20 core and Phase 21 gates pass. |
| Non-payment public beta | `PASS — PAYMENT OFF` | Public CardeLume route, health, security and bounded fallback journey verified; final beta approval remains Owner-legal blocked. |
| Production | `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES` | No production deploy, promotion or public traffic is authorized by source checks alone. |

### Current next action

`Public non-payment technical beta`: PASS on the isolated Pi5 runtime and public Cloudflare route with payment OFF. Legal Owner approval still blocks final public-beta approval; do not reopen Phase 20 or start Dodo.

## Product contract and non-goals

CardeLume is a premium digital keepsake for one meaningful recipient: brief → CardeLume intelligence → three distinct directions → choose/refine → preview → one-time payment → secure JPG/PDF. It is not a template editor, marketplace, public gallery, RSVP system, subscription or physical-fulfilment service.

Launch invariants:

- Browser state cannot author payment, entitlement, template approval, price/currency or final-file access.
- AI cannot bypass compatibility, IP, security or production-approval gates.
- Pre-purchase previews never expose paid files, private object URLs, raw recovery secrets or unredacted private brief data.
- No fabricated testimonials, ratings, customer stories, usage numbers or visual evidence.
- State-changing runtime tests use isolated test data with snapshot/restore and exact-ID cleanup.
- Production credentials, live migrations, production promotion, external beta invitations and public launch require separate explicit Owner approval.

Deferred until evidence justifies them: `N=30`, Final Golden, evaluator infrastructure, mandatory accounts, subscriptions/credits, social profiles, RSVP/bulk invitations, physical fulfilment, HA complexity and broad catalog expansion.

## Verified foundation and evidence

- Phase 18 reproducible install/build, strict lint, typecheck and test baseline is retained; residual dependency/native and production-template risks remain production blockers.
- Phase 19 closure evidence: `.ai/evidence/phase19-mvp-closure.json` and `/home/pi5/hermes-artifacts/cardelume/phase19/P19M1T03-CODEX-REWORK-20260830T053726Z/`.
- Phase 20 baseline evidence: `/home/pi5/hermes-artifacts/browser-evidence/cardelume/phase20-baseline/3fb66eb841ec6907230e997e89e2d2e612bbc9db/`.
- Template Admin presentation-only follow-up evidence: `.ai/TEMPLATE_ADMIN_SIMPLIFICATION_PLAN.md`.
- `P20M1T03` Owner-approved v3 PNG promoted to `apps/web/public/brand/og-card.png`; `apps/web/app/layout.tsx` already had valid same-origin `1200×630` OpenGraph metadata. Evidence: `.ai/evidence/phase20-p20m1t03-og.json`.

Phase 19 Owner result:

- `12` frozen briefs × `3` repeats = `36` primary generations;
- `36` schema validations, `108` review renders, `324` physical render files;
- zero evaluator calls, retries and fallbacks;
- provider/model: `OpenAI Codex` / `gpt-5.6-luna`;
- retained candidate families: `letterpress`, `midnight`, `orbit`, `memory`, `photo`, `museum`, `petal`, `softfold`;
- result: `PASS_FOR_MVP`, not production-template approval.

## Public non-payment technical beta — 2026-09-03

Evidence: `.ai/evidence/public-beta-20260903.json` and `/home/pi5/hermes-artifacts/browser-evidence/cardelume-public-20260903/`.

- Public route `https://cardelume.vorigin.vn` resolves through Cloudflare to the isolated CardeLume binding `127.0.0.1:3010`; homepage and TLS verified.
- Public health is PASS: `/health/live`, `/health/ready` and `/health/worker` each returned `200`; web and worker services were active with zero worker restarts at verification.
- Public security is PASS: enforced CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, anonymous admin `403`, no permissive CORS, and no tested secret/private-R2 markers.
- Public browser journey is `PASS_PUBLIC` through one bounded real fallback: brief → AI attempt → exactly three directions → select → finish → JPG `200 image/jpeg` → PDF `200 application/pdf`; console JS errors `0`.
- OpenCode Go configuration was verified as `https://opencode.ai/zen/go/v1` with model `gpt-5.6-luna`. The primary public attempt returned `ai_direction_count_invalid` and was fail-softed once; no retry/tuning loop was run.
- Desktop `1440×900` and mobile `390×844` snapshots are usable. Finish focus geometry passed after the minimal `scroll-margin-top` fix: heading top `90px`, sticky header bottom `71px`, not covered.
- Payment remains fail-closed: public checkout returned `503` with `payment_disabled`; no Dodo, order, PAID state or entitlement bypass. Dodo recovery remains `DEFERRED_BY_OWNER`.
- `vorigin.vn`, `www.vorigin.vn`, local ports `8080/8081` remained VOrigin; `/srv/vorigin` and the existing Cloudflare VOrigin route were not changed.
- `NON_PAYMENT_PRODUCT_READY=PASS`, `CSP_ADMIN_SECURITY=PASS`, `PUBLIC_TECHNICAL_BETA_READY_WITH_PAYMENT_OFF=PASS`; `LEGAL_CONTENT_APPROVED=false`, therefore `PUBLIC_BETA_READY_WITH_PAYMENT_OFF=BLOCKED_BY_OWNER_LEGAL`. Oracle remains `DEFERRED_BY_OWNER_INFRA`.

## Phase 20 — Buyer Confidence Core

**Objective:** make the value, proof and digital delivery immediately credible without changing the approved hero composition or turning the product into a marketplace.

### Completed checkpoint

- `P20M1T01`: desktop/tablet/mobile baseline captured and source remained unchanged during capture.
- `P20M1T02`: Product Proof renders locally with provenance-bound data, fail-closed filtering and serializable Server → Client props; stale SSR serialization defect is not reproduced on the current dev server. Local HTTP/browser probes: `5/5` HTTP 200, `0/5` serialization/server exceptions, `5/5` Product Proof, `0` browser JS errors.
- `P20M1T04`: readable body floor is sourced from `@cardelume/card-schema`; renderer/stress contract covers long Latin, CJK/Hangul/Vietnamese, photo and lower-capability paths. Independent stress: PASS, `5` formats, `10.4 CSS px`, `32 render px`.
- `P20M1T05`: customer-facing A/B/C diversity guard requires three family IDs, three visual directions and at least two effective archetypes; pre-critic and post-repair paths are guarded. Independent stress and AI/templates checks: PASS.
- `P20M1T06`: Case 06 review-fixture/context metadata is hash-bound without model rerun or raw-artifact replacement. Packet remains an evidence artifact; no new Owner approval is inferred.
- `P20M1T03`: Owner-approved product-specific OG v3 promoted with candidate/target SHA-256 match; reduced-preview, metadata, provenance, `git diff --check` and production build PASS. Evidence: `.ai/evidence/phase20-p20m1t03-og.json`.
- `P20M3T01`: final buyer-journey gate PASS on candidate `ee9ec4a814c668b326edd9fc10eda752bacbbdf7`; all required viewports/states/keyboard/semantics/reduced motion/overflow/action/performance checks passed. Evidence: `.ai/evidence/phase20-p20m3t01-browser.json`.
- Template Admin follow-up: presentation-only catalog-first/progressive-disclosure work accepted by Owner; auth/API/lifecycle/launch/eligibility semantics were preserved. Details remain in `.ai/TEMPLATE_ADMIN_SIMPLIFICATION_PLAN.md`.

### Core closure

`P20M3T01` is complete for the technical Phase 20 core gate. The Owner's authenticated visual/UX acceptance remains a separate manual step.

### Optional M2B — Help me choose

Keep feature and routes disabled unless Owner explicitly activates this lane. If activated, the contract requires exactly three watermarked reduced-resolution directions, one-way token-hash storage, seven-day default expiry, immediate revoke/replace invalidation, creator-only results, plaintext note ≤`280` characters, no clean JPG/PDF/private URL leakage, rate limits, no-store/noindex/no-referrer behavior, and exact-ID cleanup. Its own browser/security gate must pass before enablement; otherwise record `DEFERRED_FEATURE_OFF`.

### Phase 20 exit gate

```text
VALUE_COMPREHENSION PASS
MARKETING_LOCALIZATION PASS
PRODUCT_PROOF_RENDERED PASS
CORE_BROWSER_ACCESSIBILITY_PERFORMANCE PASS
HELP_ME_CHOOSE PASS | DEFERRED_FEATURE_OFF
```

`P20M1T03` and `P20M3T01` are verified. Phase 20 core is closed. Source/build/browser PASS is not runtime or production approval.

## Phase 21 — Controlled Runtime Qualification

Start only after Phase 20 core is PASS and the Owner authorizes the bounded staging run. Use isolated staging/test services, never production or an unrelated Supabase project.

| Task | Scope | Exit gate |
|---|---|---|
| `P21M1` | Backup DB, sequential migrations, constraints/triggers, user A/B/service/admin RLS and IDOR matrix, restore verification. | `STAGING_DB_RLS PASS` + `BACKUP_RESTORE PASS` |
| `P21M2` | pg-boss/worker readiness, retry/idempotency, R2 quarantine/sanitize/ownership, real AI, final JPG/PDF renderer parity, resource/latency/failure measurements. | `QUEUE_WORKER PASS` + `R2_PHOTO_RENDER PASS` |
| `P21M3` | Dodo test-mode quote, checkout idempotency, webhook signature/replay, exact amount/currency/session reconciliation, PAID/fulfilment/entitlement/recovery. | `DODO_PAYMENT_RECOVERY PASS` |
| `P21M4` | CSP, admin defense in depth, rate limits, PII/token/secret log review, rotation, legal/native copy, incident/refund/runbooks and backup rehearsal. | `CSP_ADMIN_SECURITY PASS` + `LEGAL_NATIVE_COPY APPROVED` |

If Help me choose stays off, its Phase 21 overlay is explicitly `DEFERRED_FEATURE_OFF`; it cannot be silently exposed to satisfy a checklist.

## Phase 22 — Limited Soft Launch and Public Launch Decision

A soft-launch candidate requires Phase 19 MVP quality closure, Phase 20 core PASS, Phase 21 core/security PASS, fixed or Owner-accepted Phase 18 residual risks, a non-empty catalog of `6–8` exact production-approved template versions, reproducible production node/monitoring/backups/restore, verified pricing/currency, assigned support/refund/incident ownership and explicit Owner approval for `15–30` consented participants and paid transactions.

During private beta, predeclare reliability, conversion, satisfaction, refund and unit-economics targets before reviewing results. Collect field performance only when the sample is usable; otherwise report `INSUFFICIENT_FIELD_SAMPLE`. Public launch requires reliable payment/fulfilment/recovery, acceptable commercial and quality metrics, no unresolved P0 security/privacy/IP/legal/accessibility issue, recoverable operations/current backups and explicit Owner approval.

Final verdict is `LAUNCH_READY` only when evidence-backed.

## When production deployment is allowed

**Not yet.** Production deploy/promotion is allowed only after all of these are true:

1. Phase 20 core exit gate is PASS, including Owner approval of the product-specific OG asset and the core browser/accessibility/performance evidence.
2. Phase 21 staging DB/RLS, queue/worker, R2/photo/renderer, Dodo/payment/recovery, security/legal and backup/restore gates are PASS.
3. The production catalog contains exact human-approved template versions; no `approved-only` catalog remains empty.
4. Phase 18 dependency/native, IP/font/asset and other residual risks are fixed or explicitly accepted by the Owner with rationale.
5. Exact production preflight is bound to the release commit, with monitoring, backups, tested rollback/restore and secret scope/rotation ready.
6. Owner separately approves production promotion and, later, public traffic/paid transactions.

Phase 22 beta evidence and public-launch decision still follow the production candidate. A green build or a pushed commit never substitutes for these gates.

## Verification commands and evidence rules

Project gates:

```text
/tmp/cardelume-pnpm-bin/pnpm run test
/tmp/cardelume-pnpm-bin/pnpm run lint
/tmp/cardelume-pnpm-bin/pnpm run typecheck
/tmp/cardelume-pnpm-bin/pnpm run build
```

Focused gates:

```text
node --experimental-strip-types scripts/renderer-export-stress.ts
./node_modules/.bin/tsx scripts/ai-creative-director-source-stress.ts
```

Record exact source/revision SHA, scope, command result, redacted evidence path, residual risk and rollback/recovery path. `UNKNOWN`, skipped, unavailable or preparation-only evidence must never be relabeled PASS. Local secret-scan failure caused by non-empty assignments in `.env` and `.env.development.local` remains a production blocker; values must not be printed or committed.

Historical detail belongs in Git, `.ai/DECISIONS_LOG.md`, `.ai/KNOWN_BUGS.md` and evidence artifacts—not in this current execution plan.
