# CardeLume Master Plan — Current Execution

**Project:** CardeLume
**Source baseline:** `0.4.3-step.17j`
**Primary plan:** `.ai/MASTER_PLAN.md`
**Exact mirror:** `MASTERPLAN.MD`
**Updated:** 2026-09-02

## Executive status

| Area | Status | Meaning |
|---|---|---|
| Phase 19 Premium/WOW | `DONE — PASS_FOR_MVP` | Owner accepted MVP progression only; not Final Golden or production-template approval. |
| Phase 20 Buyer Confidence Core | `ACTIVE` | T01, T02, T04, T05 and T06 verified; T03 waits for Owner visual approval; core browser gate remains. |
| Help me choose | `DEFERRED_FEATURE_OFF` | Optional; it must not block the core launch. |
| Phase 21 Runtime Qualification | `PENDING` | No production runtime, payment, storage, queue or restore proof is complete. |
| Phase 22 Soft/Public Launch | `PENDING` | Starts only after Phase 20 core and Phase 21 gates pass. |
| Production | `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES` | No production deploy, promotion or public traffic is authorized by source checks alone. |

### Current next action

`Need approval`: Owner visual approval of the product-specific OpenGraph candidate. After approval, update the tracked OG asset/metadata and run the core buyer-journey gate. Do not start Phase 21 automatically.

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
- Candidate OG asset, not tracked production asset: `/home/pi5/hermes-artifacts/cardelume/phase20/P20M1T03/og-card-candidate.svg`.

Phase 19 Owner result:

- `12` frozen briefs × `3` repeats = `36` primary generations;
- `36` schema validations, `108` review renders, `324` physical render files;
- zero evaluator calls, retries and fallbacks;
- provider/model: `OpenAI Codex` / `gpt-5.6-luna`;
- retained candidate families: `letterpress`, `midnight`, `orbit`, `memory`, `photo`, `museum`, `petal`, `softfold`;
- result: `PASS_FOR_MVP`, not production-template approval.

## Phase 20 — Buyer Confidence Core

**Objective:** make the value, proof and digital delivery immediately credible without changing the approved hero composition or turning the product into a marketplace.

### Completed checkpoint

- `P20M1T01`: desktop/tablet/mobile baseline captured and source remained unchanged during capture.
- `P20M1T02`: Product Proof renders locally with provenance-bound data, fail-closed filtering and serializable Server → Client props; stale SSR serialization defect is not reproduced on the current dev server. Local HTTP/browser probes: `5/5` HTTP 200, `0/5` serialization/server exceptions, `5/5` Product Proof, `0` browser JS errors.
- `P20M1T04`: readable body floor is sourced from `@cardelume/card-schema`; renderer/stress contract covers long Latin, CJK/Hangul/Vietnamese, photo and lower-capability paths. Independent stress: PASS, `5` formats, `10.4 CSS px`, `32 render px`.
- `P20M1T05`: customer-facing A/B/C diversity guard requires three family IDs, three visual directions and at least two effective archetypes; pre-critic and post-repair paths are guarded. Independent stress and AI/templates checks: PASS.
- `P20M1T06`: Case 06 review-fixture/context metadata is hash-bound without model rerun or raw-artifact replacement. Packet remains an evidence artifact; no new Owner approval is inferred.
- Template Admin follow-up: presentation-only catalog-first/progressive-disclosure work accepted by Owner; auth/API/lifecycle/launch/eligibility semantics were preserved. Details remain in `.ai/TEMPLATE_ADMIN_SIMPLIFICATION_PLAN.md`.

### Remaining core work

1. **P20M1T03 — OpenGraph product proof (`BLOCKED`)**
   - Candidate exists as artifact-only SVG. The tracked `apps/web/public/brand/og-card.png` and `apps/web/app/layout.tsx` remain unchanged.
   - Owner must approve the visual candidate before any tracked asset or metadata replacement.
   - After approval: verify common social-preview crops, metadata resolution, build and provenance; no fake testimonial/rating/physical-shipping implication.

2. **P20M3T01 — Core buyer-journey gate (`PENDING`)**
   - Verify homepage → brief → reveal → results → finish → checkout boundary at `390×844`, `768×1024`, `1440×900`, plus loading/fallback/empty/error, keyboard, screen-reader, 200% zoom and reduced motion.
   - Required gate: no P0/P1 defect, no overflow or blocked primary action, trust text ≥`12 CSS px`, primary targets ≥`44×44 CSS px`, lab LCP ≤`2.5s`, CLS ≤`0.1`, no key Studio long task >`200ms`, and no unapproved >`10%` regression from the frozen baseline.
   - Automated browser mutation is not authorized. Owner performs final authenticated visual/UX acceptance manually; read-only local probes require explicit authorization.

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

`P20M1T03` Owner approval and `P20M3T01` evidence are still required for the core gate. Source/build PASS is not runtime or production approval.

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
