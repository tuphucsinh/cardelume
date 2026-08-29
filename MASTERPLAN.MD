# CARDELUME MASTER PLAN — Premium Proof to Public Launch

**Project:** CardeLume
**Source baseline:** `0.4.3-step.17j`
**Current production status:** `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES`
**Canonical plan:** `MASTERPLAN.MD`; `.ai/MASTER_PLAN.md` is an exact mirror.
**Execution rule:** complete and verify the active phase before expanding scope.

> Product invariant: **small brief → CardeLume intelligence → 3 genuinely different premium directions → choose → minimal finish → preview → pay once → secure JPG/PDF.**

> Product position: **a premium digital card for one meaningful recipient, ready to print or share — not a template editor, public gallery, RSVP platform, subscription, or physical-fulfilment service.**

> Truth rule: source/offline PASS, reviewer PASS, owner approval, staging E2E and production readiness are separate gates. None implies another.

---

## 0. Current evidence and plan reset

### Review snapshot — 2026-08-29

- **Reviewed implementation anchor:** `61266c937a5b11a18c9ca8e5d8cae6a5e5c7469f`; P19M1T01 protocol freeze/validation is complete and source-stress, tamper and path-guard checks pass.
- **Phase 18:** reproducible install, build, supply-chain and font/asset baseline evidence pass; dependency/native, template eligibility and runtime evidence remain open. These risks block production promotion only; development, Git operations, controlled staging and evidence collection are allowed by owner clarification.
- **Phase 19:** staging/evidence work may proceed. P19M1T02 is preparation-only: the calibration packet exists, but no real-model call, human score or external rater contact has occurred.
- **Current launch classification:** Development `GO`; commit/push `GO`; Pi5 staging `GO`; evidence/remediation `GO`; production promotion `BLOCKED`; public launch `NO_GO`.
- **Review artifacts:** frozen protocol and calibration packet are under `/home/pi5/hermes-artifacts/cardelume/phase19/61266c937a5b11a18c9ca8e5d8cae6a5e5c7469f/`; Phase 18 exit evidence is `.ai/evidence/phase18-exit.json`.

### Verified foundation

- Step13–Step17J source architecture and offline governance exist.
- The core Studio flow, payment/recovery boundaries, private uploads, template approval boundary and privacy-minimized funnel are implemented at source level.
- The project is already imported, tracked in Git and attached to the CardeLume workspace; the old bootstrap Phase 0 is complete and removed from the forward plan.
- Current strict lint, typecheck, tests, build and frozen-install checks pass on the reviewed candidate; the reviewed lockfile is tracked. Controlled Pi5 staging is available for evidence, but complete runtime/security proof is still missing.

### Material blockers

1. Production template eligibility is `approved`-only, while the approved set is currently zero (`packages/templates/src/index.ts:108-115`, `338-350`).
2. Premium/WOW, originality and real three-direction diversity have not been proven with a real model plus independent human scoring.
3. The current homepage can show 16 review families, which is useful for owner review but too broad for the intended curated launch story (`apps/web/app/page.tsx:72-87`).
4. Buyer proof is weak: no approved brief → three directions → final case studies, no consented customer evidence, and the OpenGraph asset does not demonstrate the product.
5. Some marketing text remains hardcoded outside i18n (`apps/web/app/page.tsx:72-87`).
6. Staging DB/RLS, queue, R2/photo, Dodo, final rendering, recovery, browser/device, CSP and restore paths lack complete real-runtime E2E evidence.
7. `share_started` exists in analytics types, but there is no customer-facing “Help me choose” sharing flow (`apps/web/lib/analytics-events.ts:1-5`).

### Plan correction

The previous plan put a broad runtime programme and two-node HA ahead of proving product desirability. This revision changes the critical path to:

```text
reproducible baseline
→ premium product proof
→ buyer confidence + Help me choose
→ controlled runtime qualification
→ limited soft launch
→ public launch decision
```

HA, accounts, physical fulfilment and broad catalog expansion are conditional scale decisions, not default launch scope.

---

## Global boundaries

### In scope

- 6–8 excellent launch families, not a large template marketplace;
- real-model quality evidence and blind human Premium/WOW review;
- honest product proof and clear digital-delivery positioning;
- a private pre-purchase **Help me choose** sharing loop;
- secure payment, fulfilment, recovery and limited soft-launch evidence;
- responsive, accessible and performant customer journeys.

### Explicitly out of scope until evidence justifies them

- mandatory accounts, subscriptions or credit wallets;
- public/social card profiles, follower feeds or searchable shared cards;
- RSVP, guest-list or bulk invitation management;
- physical printing, shipping or envelope fulfilment;
- automatic/AI-only template approval;
- production HA complexity before measured reliability needs justify it;
- adding templates merely to increase catalog count;
- changing the current hero typography, scale, spacing or composition without a separate owner-approved visual brief.

### Global launch invariants

- Browser state cannot author payment, entitlement, template approval, price/currency or final asset access.
- AI cannot bypass compatibility, IP, security or production-approval gates.
- Shared previews never expose paid files, private object URLs, raw recovery secrets or unredacted private brief data.
- No fabricated reviews, usage numbers, customer stories or visual evidence.
- Every state-changing runtime test uses staging/test data, exact identifiers, cleanup/restore evidence and a stop condition.
- Production, credentials, migrations, external beta invitations and public launch require separate explicit approval.

---

# PHASE 18 — Reproducible and Reviewable Baseline

## Objective

Create one dependency-resolved, security-reviewed candidate that all premium, browser and runtime evidence can reference.

## Milestone 18.1 — Dependency freeze

1. Confirm Node and `pnpm@10.15.0`.
2. Generate a new candidate `pnpm-lock.yaml`; do not call it recovered history.
3. Review dependency versions, integrity, install scripts, native packages and ARM64/AMD64 compatibility.
4. Prove a clean `pnpm install --frozen-lockfile`.

### Acceptance

- reviewed lockfile is tracked;
- clean frozen install succeeds;
- dependency delta and native/install-script risks are documented;
- no unrelated package upgrade enters the candidate.

## Milestone 18.2 — Semantic and supply-chain baseline

Run and retain evidence for `pnpm typecheck`, `pnpm test`, strict `pnpm lint`, `pnpm build`, RELEASE/HEAVY governance, release SBOM, dependency/secret/security scans and `ip:audit`.

### Acceptance

- typecheck, tests and production build PASS;
- lint is a strict gate, not a script that masks failure;
- release SBOM reflects resolved dependencies;
- vulnerabilities are fixed or explicitly accepted by the owner with rationale;
- skipped/unavailable checks remain `BLOCKED` or `UNKNOWN`, never PASS.

## Milestone 18.3 — Font and asset eligibility preflight

Before any paid human scoring, run `npm run ip:collect-font-evidence` and `npm run quality:font-template-launch-check` across the complete review pool. Record exact browser/renderer binaries, hashes, versions, retained licenses, commercial-use eligibility, script coverage and brand/asset provenance.

### Acceptance

- every family entering Phase 19 has no UNKNOWN font/asset/license dependency;
- any ineligible family is removed or repaired before benchmark sampling;
- final immutable-version attestation remains required at approval, but no expensive review is performed on a family that cannot legally ship.

## Phase 18 baseline gate results

```text
REPRODUCIBLE_INSTALL PASS
SEMANTIC_BUILD PASS
SUPPLY_CHAIN PASS
FONT_ASSET_ELIGIBILITY PASS
BASELINE_SHA RECORDED
```

These are baseline evidence results, not production approval. The current classification is: development/commit-push/Pi5 staging/evidence collection `GO`; production promotion `BLOCKED`; public launch `NO_GO`.

---

# PHASE 19 — Premium/WOW Improvement and Product Truth

## Objective

Improve and prove that CardeLume produces work customers and independent reviewers perceive as premium, emotionally fitting, distinctive and worth paying for before expanding marketing or infrastructure.

## Design contract

- **Surface:** premium digital keepsake, not a design dashboard.
- **Visual language:** quiet editorial luxury with tactile paper-inspired craft; no generic luxury-template repetition.
- **Design dials:** variance `7/10`, motion `4/10`, density `3/10`.
- **Signature:** one recognizable CardeLume device must survive hero, reveal, final card, OG/share and recovery contexts.
- **Truth:** material effects may communicate craft but must not imply CardeLume ships a physical card.
- **Evidence:** exact browser screenshots and final JPG/PDF renders at agreed desktop/mobile/print sizes.

## Milestone 19.1 — Calibration and Final Golden benchmark

### Calibration stage — current bounded execution

Use the existing Step14 tooling with:

- 30–50 representative briefs; the current frozen protocol uses 30, within this bound, across enabled launch locales/scripts;
- photo/no-photo, short/long/edge copy and diverse relationships/occasions;
- three independent model runs per brief/config for automated stability metrics;
- an anonymized, stratified and frozen human-review subset prepared before output inspection;
- an initial target of three independent raters for calibration, with conflicts disclosed before assignment and owner/developers excluded from scoring;
- the anonymized review packet and estimated API/model cost prepared before any external model call or human contact;
- no model cost incurred and no external rater message sent without separate approval;
- aggregation deterministic from sealed individual score sheets, with recorded latency, token cost, fallback/failure rate and regeneration rate.

### Final Golden stage — after the bounded improvement loop

Only after Milestone 19.2 produces a stable candidate set of 6–8 families, run the final sealed benchmark with:

- 100–150 representative briefs across enabled launch locales/scripts;
- three independent model runs per brief/config for automated stability metrics;
- a blinded human-review subset of at least 30 representative briefs, stratified and frozen before output inspection across launch scripts/locales, photo/no-photo, short/medium/long copy pressure and key occasion/relationship groups;
- at least five independent raters for the human subset, with outputs anonymized and order-randomized;
- raters independent of product development, conflicts disclosed before assignment, owner/developers excluded from scoring, and the roster/conflicts/rubric frozen before outputs are revealed;
- at least 20% legally sourced private-review reference stimuli mixed into the blind set to anchor premium and average-quality bands; record source URL, retrieval date, license/internal-review use basis, stimulus SHA-256 and external artifact reference in `.ai/evidence/premium-reference-stimuli.json`; never ship, train on, reuse as CardeLume assets or commit binaries without redistribution rights;
- aggregation deterministic and performed from sealed individual score sheets before model/template identities are revealed;
- recorded latency, token cost, fallback/failure rate and regeneration rate.

Score separately: emotional fit; Premium perception; WOW/memorability; originality/brand distinctiveness; copy–design harmony; typography/copy pressure; honest material realism; three-direction diversity; locale naturalness; and photo use.

### Acceptance

- median Premium score `≥ 8.0/10`;
- median WOW score `≥ 7.5/10`;
- median originality/distinctiveness score `≥ 7.5/10`;
- emotional fit median `≥ 8.0/10`;
- at least `90%` of reviewed briefs are judged to contain three materially different directions, not color swaps;
- no approved family has a material IP, compatibility, accessibility or rendering blocker;
- production model/prompt selection fits the documented latency and unit economics budget.

The calibration run is diagnostic and not a launch gate; it identifies failure clusters for Milestone 19.2. The Final Golden run is the immutable final benchmark after the improvement loop; no family is approved from calibration results alone.

## Milestone 19.2 — Bounded Premium/WOW improvement loop

- rank failures by exact template/version, locale/script, copy pressure, photo mode and rubric dimension;
- select the smallest intervention class per hypothesis: template composition/type/material, creative recipe/ranking, or AI prompt/model/critic threshold;
- change one primary cause per candidate, preserve baseline output and record candidate SHA/config hash;
- run one frozen representative calibration slice after each change; run the 100–150-brief Final Golden benchmark only after the slice shows measurable uplift without material regression and the candidate set is stable at 6–8 families;
- stop after two failed iterations of the same hypothesis; preserve the failure, then cull the family/configuration or write a new hypothesis instead of cosmetic looping;
- never change the Golden set, blind-review subset, rubric, rater roster or thresholds after outputs are revealed.

### Acceptance

- each candidate has a before/after artifact linking exact files/config, representative renders, score deltas, latency/cost and residual risk;
- no accepted uplift regresses IP eligibility, compatibility, accessibility, browser↔renderer parity or unit economics;
- failing candidates remain non-production and are explicitly `rework`, `hold` or `rejected`.

## Milestone 19.3 — Signature and material calibration

- choose one primary CardeLume signature device and one restrained small-size variant;
- calibrate grain, edge depth, contact shadow, foil/light and emboss/deboss cues through the bounded improvement loop using real browser and final-render comparisons;
- keep motion purposeful: product orientation, reveal continuity and paid-unlock feedback only;
- provide complete reduced-motion/static fallbacks;
- preserve the owner-approved current hero layout unless a separate visual-change approval is granted.

### Acceptance

- signature is recognizable without relying only on the wordmark;
- craft cues remain legible on `390×844` and do not degrade print/JPG/PDF output;
- no misleading physical-shipment interpretation in usability review;
- visual evidence covers `390×844`, `768×1024`, `1440×900` and representative final JPG/PDF output.

## Milestone 19.4 — Final rerun and curate 6–8 flagship families

After all pixel/prompt/model changes are frozen and the candidate set is stable at 6–8 families, run the 100–150-brief Final Golden benchmark. Start from the Step17J owner-review pool but approve only exact immutable versions that pass:

- Golden evidence;
- blind Premium/WOW/originality review;
- supported locale/script and long-copy pressure;
- browser ↔ renderer parity;
- exact asset/font provenance and commercial-use evidence;
- reduced-motion and lower-capability rendering;
- owner review.

### Acceptance

- 6–8 coherent families are approved for production;
- the set is visibly diverse in composition, type, material world, color world, energy and photo behavior;
- no automatic or AI-only approval;
- production homepage/Studio never falls back to an empty approved catalog.

## Milestone 19.5 — Product-proof package

Produce at least three approved case studies:

`bounded brief → three genuinely different directions → chosen/refined final → clean JPG/PDF detail`

Use synthetic, owner-authored or explicitly consented content only. Never invent customer identity, review, rating or usage volume.

### Acceptance

- three case studies cover distinct recipients/occasions and at least one photo case;
- proof shows readable personalization, not generic placeholder copy;
- every shown output maps to an approved exact template/version;
- consent/provenance is recorded where real customer material is used.

## Phase 19 exit gate

```text
REAL_AI_GOLDEN PASS
PREMIUM_WOW_IMPROVEMENT_LOOP CLOSED
PREMIUM_MEDIAN >= 8.0
WOW_MEDIAN >= 7.5
THREE_DIRECTION_DIVERSITY >= 90%
APPROVED_FAMILIES 6..8
PRODUCT_PROOF 3 CASES
OWNER_CREATIVE_APPROVAL VALID
```

---

# PHASE 20 — Buyer Confidence, Conversion and “Help me choose”

## Objective

Make the product, value and delivery immediately credible; reduce decision anxiety without turning CardeLume into a template marketplace or social network.

## Milestone 20.1 — Honest premium marketing surface

Before the first Phase 20 UI mutation, capture the desktop/tablet/mobile render and performance baseline under `/home/pi5/hermes-artifacts/browser-evidence/cardelume/phase20-baseline/<git-sha>/`; `metrics.json` plus viewport screenshots are the sole comparison baseline unless an owner-approved, dated re-baseline supersedes them.

- show only 6–8 flagship families on the public launch gallery;
- add the approved brief → three directions → final proof section below the existing hero;
- state near the primary CTA: digital card, preview before payment, one-time payment, JPG + print-ready PDF, no account required;
- localize all customer-facing marketing, aria and metadata strings;
- replace the current OG asset with an approved personalized card/product-proof composition;
- retain legal/refund/support discoverability;
- do not change hero scale/layout as part of this milestone.

### Acceptance

- a first-time user can correctly explain what is bought, when payment occurs and what files are delivered after a five-second comprehension test;
- no hardcoded English leaks across enabled locales;
- no unsupported physical-shipping implication;
- no fabricated proof;
- OG preview remains readable and product-specific at common social-preview sizes.

## Milestone 20.2 — “Help me choose” product contract

The creator may share exactly the current set of three watermarked, reduced-resolution directions before payment so trusted friends can help choose.

### User flow

```text
results/finish
→ Help me choose
→ creator sees privacy notice and creates private link
→ recipient opens link without account
→ recipient selects one direction and may leave a short optional note
→ creator sees aggregate choice/notes and continues editing or checkout
→ creator can revoke or replace the link at any time
```

### Security and privacy contract

- possession of an opaque 256-bit link grants read-only access to one immutable three-direction snapshot;
- store only a one-way token hash; never store/log the raw token after issue;
- default expiry: 7 days; maximum one active link per card snapshot; revocation is immediate;
- changing/regenerating the direction set invalidates the old snapshot link and requires a new link;
- shared views are `noindex`, `nofollow`, `nocache` and use a strict referrer policy;
- show only bounded display copy required to compare directions; never expose raw brief, email, payment/recovery state, private object URL or final files;
- photo-containing shares require explicit creator acknowledgement that recipients with the link can view the watermarked preview;
- recipient cannot edit, regenerate, checkout, download paid assets or claim ownership;
- feedback is one selected direction plus an optional plain-text note of at most 280 characters; render as text, not HTML;
- creation/open/vote endpoints are rate-limited and abuse-observable without collecting greeting copy or photo contents; direction regeneration remains in the existing `GENERATION_RATE_LIMIT_PER_HOUR` bucket (current default 12/hour), while share issue/replace is capped at 6 per card and 12 per anonymous subject per rolling 24 hours so sharing cannot bypass generation controls;
- card deletion, owner revocation, snapshot replacement or expiry denies future access fail-closed.
- replacement always means revoke the old link and issue a new `snapshotId` plus new token; token, feedback and snapshot identity are never reused or merged;
- revoke, expiry, replacement, regeneration or card deletion denies access immediately and hard-purges snapshot renders, feedback notes and token hashes within 24 hours;
- cleanup is idempotent, uses exact snapshot/object identifiers and verifies affected DB rows plus object deletion; only de-identified aggregate funnel events may outlive the share data.

### Interface/data boundaries

Implementation planning must define and test:

- create/read/revoke share-link server interfaces;
- immutable snapshot identity containing exact card/direction/template versions;
- snapshot previews use that exact identity and the same rendering contract as final output; only watermark and reduced resolution may differ;
- feedback identity/deduplication without requiring a recipient account;
- creator-only feedback retrieval;
- watermarked preview rendering and same-origin asset delivery;
- localized share page and accessible direction selection;
- Web Share API enhancement with copy-link fallback.

### Analytics

Extend the existing privacy-minimized funnel with explicit events:

```text
help_choose_started
help_choose_link_created
help_choose_opened
help_choose_vote_submitted
help_choose_creator_returned
help_choose_revoked
```

Record IDs/categorical metadata only; never record recipient note, greeting copy, names, token or photo content.

### Acceptance

- unauthorized/expired/revoked/tampered links fail closed;
- recipients can compare exactly three watermarked directions and submit one bounded choice on mobile and desktop;
- no route exposes clean JPG/PDF or private storage URL;
- one recipient cannot overwrite another recipient’s recorded feedback unintentionally;
- creator sees clear aggregate results without exposing recipient tracking data;
- Web Share API and copy-link fallback both work;
- keyboard, screen-reader, reduced-motion and localization paths PASS;
- threat tests cover token enumeration, replay, XSS note content, cache leakage, referer leakage, regeneration invalidation and rate limiting.

## Milestone 20.3 — Buyer-journey browser gate

Verify at minimum:

- Chrome desktop, Firefox, iPhone Safari and mid-range Android Chrome;
- `390×844`, `768×1024`, `1440×900`;
- keyboard-only, screen reader, 200% zoom and reduced motion;
- loading, fallback, empty, error, expired share and revoked share states;
- homepage → brief → reveal → results → Help me choose → return → finish → checkout boundary.

### Acceptance

- no P0/P1 usability, accessibility or content defect;
- no horizontal overflow or blocked primary action;
- trust/privacy text is at least `12 CSS px`, and primary touch targets are at least `44×44 CSS px`;
- at valid p75 field sample: LCP `≤2.5s`, INP `≤200ms`, CLS `≤0.1` on mobile; before enough field data exists, the same LCP/CLS targets apply in controlled lab runs, key Studio/share interactions have no long task over `200ms`, and no metric regresses over `10%` from the recorded baseline;
- an unmet budget is FAIL unless the owner approves a dated re-baseline with evidence; missing field sample remains UNKNOWN, not PASS.

## Phase 20 exit gate

```text
VALUE_COMPREHENSION PASS
MARKETING_LOCALIZATION PASS
PRODUCT_PROOF_RENDERED PASS
HELP_ME_CHOOSE_SECURITY PASS
HELP_ME_CHOOSE_UX PASS
BROWSER_ACCESSIBILITY_PERFORMANCE PASS
```

---

# PHASE 21 — Controlled Runtime Qualification

## Objective

Prove the full product in isolated staging/test services, including the new sharing boundary, before real customer traffic.

## Milestone 21.1 — Staging data and authorization

- back up staging DB;
- apply migrations `0001 → current head` sequentially;
- verify schema constraints/triggers and share-link lifecycle constraints;
- run user A/user B/service/admin RLS and IDOR matrices;
- test cards, versions, uploads, share snapshots/feedback, payment, entitlement, recovery, analytics and template approval;
- verify restore against the captured backup.

### Acceptance

- no cross-user read/write path;
- share recipient access is bounded to the issued snapshot only;
- approval/payment/entitlement cannot be bypassed through API or DB paths;
- migration and rollback/restore evidence are retained.

## Milestone 21.2 — Queue, AI, photo and renderer runtime

Verify real pg-boss, worker heartbeat/readiness, retry/idempotency, R2 quarantine/sanitize/clean storage, real AI generation, final JPG/PDF rendering and cleanup/retention.

Measure CPU/RAM, queue wait P50/P95, generation/render latency, safe concurrency, failure/fallback rate and cost.

### Acceptance

- no lost durable job in tested failure cases;
- no unsanitized or wrongly owned photo reaches a preview/final/share surface;
- readiness fails when no healthy same-version worker exists;
- real outputs match the approved template/version and browser proof.

## Milestone 21.3 — Dodo test-mode commerce and recovery E2E

Verify signed server quote, checkout idempotency, webhook signature/replay, exact amount/currency/session reconciliation, authoritative PAID transition, single fulfilment, final entitlement and recovery after browser closure.

### Acceptance

- browser/share state cannot unlock final files;
- wrong amount/currency/session or invalid/stale signature is rejected;
- repeated webhook/request cannot duplicate payment effects or fulfilment;
- paid JPG/PDF and recovery work only through authorized same-origin routes.

## Milestone 21.4 — Security, legal and operational gate

- CSP Report-Only → enforcement after full browser QA;
- admin edge identity + application defense-in-depth;
- rate limits for generation, upload, checkout, recovery and sharing;
- log review for PII, tokens and secrets;
- secret scope/rotation procedure;
- legal/native-language owner review;
- isolated DB/R2 backup and restore rehearsal;
- incident, refund and failed-fulfilment runbooks.

## Phase 21 exit gate

```text
STAGING_DB_RLS PASS
QUEUE_WORKER PASS
R2_PHOTO_RENDER PASS
DODO_PAYMENT_RECOVERY PASS
SHARE_RUNTIME_SECURITY PASS
CSP_ADMIN_SECURITY PASS
LEGAL_NATIVE_COPY APPROVED
BACKUP_RESTORE PASS
```

---

# PHASE 22 — Limited Soft Launch and Public Launch Decision

## Objective

Use limited, consented real traffic to determine whether CardeLume can reliably sell premium digital cards. Production remains approval-gated.

## Milestone 22.1 — Soft-launch candidate

Required before external invitations:

- Phases 18–21 PASS;
- approved production catalog is non-empty and coherent;
- one reproducible production node is ready with monitoring, backups and tested restore;
- exact pricing/products/currencies are configured and test-verified;
- support/refund/incident ownership is assigned;
- owner explicitly approves limited real traffic and paid transactions.

Verdict target:

```text
SOFT_LAUNCH_CANDIDATE
```

## Milestone 22.2 — Private beta and evidence

Start with 15–30 consented participants across relevant customer segments. Use a versioned consent artifact that records testing/analytics scope, retention, withdrawal/contact path, timestamp and form hash; marketing/case-study use requires a separate opt-in. Store consent evidence outside public artifacts and never commit participant PII or raw content. Preserve the privacy-minimized funnel from Studio start through generation, direction selection, Help me choose, finish, checkout, payment, render and JPG/PDF download.

Also measure:

- time to first acceptable direction and completion;
- “found one that feels right” rate;
- regeneration and fallback rate;
- Help me choose creation, vote and creator-return rates;
- checkout/payment/fulfilment/recovery failures;
- mobile vs desktop conversion;
- refund/support reasons;
- Premium/WOW/customer satisfaction and willingness-to-pay;
- AI/render/provider cost per paid order.

No fixed commercial threshold may be invented after seeing results. Before beta begins, owner and Mika must record target and stop thresholds for reliability, conversion, satisfaction, refund rate and unit economics.

## Milestone 22.3 — Bounded optimization

Priority:

1. safety, payment, fulfilment and privacy defects;
2. product quality and three-direction fit;
3. trust/value comprehension;
4. funnel friction and Help me choose usefulness;
5. portfolio culling;
6. model/prompt/pricing economics;
7. performance/accessibility;
8. only then new features.

Each experiment changes one material variable, has a predeclared success metric and remains behind experiment/staging gates until promoted.

## Milestone 22.4 — Public launch gate

Public launch requires evidence of:

- reliable payment, fulfilment and recovery;
- Premium/WOW/customer satisfaction meeting predeclared targets;
- acceptable conversion, refund and failure rates;
- sustainable unit economics;
- no unresolved P0 security, privacy, IP, legal or accessibility issue;
- recoverable operations and current backups;
- owner approval.

Final verdict:

```text
LAUNCH_READY
```

must be evidence-backed, not aspirational.

---

# CONDITIONAL POST-LAUNCH TRIGGERS

Implement only when measured evidence justifies the cost.

## Lume Account / My Cards

Consider passwordless account, anonymous-order claim, cross-device history and opt-in style memory only if recovery, repeat purchase or cross-device evidence shows a meaningful need. Anonymous purchase remains first-class.

## Multi-node HA

Pi5 + Oracle/VPS active/fallback, paid load balancing or extra workers are not required merely to appear enterprise-grade. Trigger only when measured uptime risk, queue pressure, maintenance windows or incident cost exceeds the approved single-node + restore posture.

## Physical fulfilment

Treat printing/shipping as a separate product, operations, legal, quality and unit-economics decision. Do not blur it into the digital launch.

## Catalog expansion

Add families only when selection concentration, occasion gaps or locale evidence identifies a real need. Maintain the Premium/WOW and immutable approval gates.

---

# Global evidence and execution rules

Every milestone records:

- baseline/revision SHA;
- exact scope and changed files/services;
- exact command or human-review protocol;
- PASS/FAIL/BLOCKED/UNKNOWN;
- redacted evidence path;
- residual risk and owner;
- rollback/recovery path where applicable.

No agent may:

- fabricate runtime, visual, customer or commercial evidence;
- auto-approve a template or lower a quality gate to obtain PASS;
- weaken payment, entitlement, sharing, IP, privacy or security boundaries;
- commit secrets or expose private customer data;
- convert failed/skipped/unavailable checks into PASS;
- use clean paid assets in pre-purchase sharing;
- expand scope before the active phase gate is satisfied.

## Review history

- `R1`: `CHANGES_REQUIRED` from independent Reviewer profile using `kimi-k3` via `opencode-go`; session `20260829_102150_7987ee`. Three Important findings: share-data lifecycle/replace semantics, font/IP eligibility sequencing and independent anchored human scoring.
- `R2`: `PASS` with `CRITICAL: NONE`, `IMPORTANT: NONE` from the same independent model/provider; session `20260829_102541_529667`. Four Non-blocking WBS clarifications were accepted and incorporated: reference provenance, benchmark stratification, share/regeneration quotas and performance-baseline location.
- `R3`: final-delta `PASS` with `CRITICAL: NONE`, `IMPORTANT: NONE`, `NON_BLOCKING: NONE`; session `20260829_102833_4c40a5`. `PREMIUM_WOW_SUFFICIENCY: YES`; `HELP_ME_CHOOSE_SUFFICIENCY: YES`.
- `R4`: `PASS` with `CRITICAL: NONE`, `IMPORTANT: NONE`, `NON_BLOCKING: NONE` from fresh Agy read-only review using owner-requested `gemini-3.1-pro-high`; process `proc_fa845c9ad061`. Phase 19/20 WBS and Help-me-choose contract were judged execution-ready after their prerequisite gates.
- Reviewer PASS is a plan-quality gate only; it is not implementation, production or launch approval.

## Current execution boundary

Phase 19/20 WBS is generated in `tasks.md` and R4 plan review is PASS. Per the owner gate clarification, Phase 19 staging/evidence work may proceed; Phase 18 dependency/template/runtime blockers still block production promotion and keep public launch `NO_GO`. R4 is not implementation, owner creative approval, runtime E2E or production approval. Current authorization covers the reviewed commits/push and controlled Pi5 staging; it does not authorize external model spend/rater contact without separate approval, production promotion or public launch.

## External review handoff

Please review the plan against these bounded questions:

- Does the calibration-first sequence preserve the final quality bar while keeping the first real-model run within a known cost/call envelope?
- Are the dependency/native, template/IP and runtime blockers classified correctly as staging-allowed but production-blocking?
- Are evidence claims kept separate: source/offline checks, browser/runtime evidence, blind human scoring, owner approval and public launch?
