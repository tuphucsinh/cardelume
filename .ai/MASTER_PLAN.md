# Mirror of root MASTERPLAN.MD

> Keep this file synchronized with `../MASTERPLAN.MD`. The root file is the canonical owner-facing plan.

# CARDELUME MASTERPLAN — Remaining Phases After Step17I

**Project:** CardeLume  
**Source baseline:** `0.4.3-step.17i` — Premium Experience Convergence  
**Execution target:** Raspberry Pi 5 first; Oracle Free/VPS as production fallback/HA  
**Current production status:** `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES`  
**Plan authority:** this file + `AGENTS.md` + `HANDOFF.md`; detailed specs remain under `docs/`.

> Product invariant: **small brief → CardeLume intelligence → 3 genuinely different premium directions → choose → minimal finish → preview → pay once → secure JPG/PDF.**

> Creative authority invariant: **hard compatibility constraints veto; soft evidence informs; Premium AI makes the final creative decision.**

> Delivery invariant: **source/offline PASS is never production PASS. Evidence must match what actually ran.**

---

## 0. Current position

Completed before this package:

- Step13 AI Creative Director core and regression protection.
- Step14 Premium Benchmark Lab source/tooling.
- Step15 Lumer/Hermes project toolkit source.
- Step16 experiment/staging isolation source.
- Step17 IP/copyright governance and Step17B security governance source.
- Step17C–17F font/template/product hardening.
- Step17G governance compression.
- Step17H production marketing approval boundary.
- Step17I premium experience convergence: material hero, folio reveal, bounded customer rationale, reversible wording refinement, simpler finish, print-layout clarity, accessibility focus transfer, keepsake/recovery messaging.

Still intentionally open:

- no authoritative `pnpm-lock.yaml` yet;
- no full frozen dependency install/build/typecheck/test evidence;
- no real staging DB/RLS/R2/pg-boss/Dodo E2E;
- no real premium-model Golden benchmark + human scoring;
- no exact shipped font binary/hash/license evidence;
- zero production-approved templates until human/owner evidence is complete;
- legal/native-language approval pending;
- browser/mobile/accessibility/performance/CSP enforcement pending;
- Pi5/Oracle production failover/backup-restore evidence pending.

---

# PHASE 0 — Pi5 import, identity, and clean project bootstrap

## Goal

Create a reproducible Hermes project checkout on the Pi5 without changing product behavior.

## Tasks

### 0.1 Place project in the standard location

Recommended:

```bash
mkdir -p ~/projects
cd ~/projects
unzip CARDELUME_STEP17I_HERMES_PI5_PROJECT.zip
cd cardelume
```

Do **not** run `new-project` inside this directory. The archive is already scaffolded to the project standard.

### 0.2 Attach Hermes Desktop Project

Attach `~/projects/cardelume` as the CardeLume project. Use the dedicated `lumer` Hermes profile when available.

Read in this order:

1. `AGENTS.md`
2. `HANDOFF.md`
3. `MASTERPLAN.MD`
4. `tasks.md`
5. `.ai/ARCHITECT.md`
6. `.ai/UI_UX.md`
7. `.ai/KNOWN_BUGS.md`
8. `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`

### 0.3 Verify package integrity and source identity

```bash
sha256sum -c PROJECT_SHA256SUMS.txt
node -p "require('./package.json').version"
npm run check:fast
npm run check:release
npm run check:status
```

Expected source identity:

```text
0.4.3-step.17i
```

`check:status` may remain NO_GO because runtime/owner evidence is deliberately missing.

### 0.4 Initialize/attach Git

If the folder is not already a Git checkout:

```bash
git init
git add .
git commit -m "Import CardeLume Step17I Hermes-ready baseline"
```

If this package is pulled from GitHub, use the repository history instead of reinitializing.

### 0.5 Secrets

```bash
cp .env.example .env
chmod 600 .env
```

Populate **staging/test** values only for Step18. Never commit `.env` or production credentials.

## Acceptance criteria

- package hash manifest verifies 100%;
- `package.json` is `0.4.3-step.17i`;
- FAST and RELEASE source suites pass;
- project is attached to Hermes/Lumer;
- Git working tree is clean before Step18 changes;
- no production credentials are present.

---

# PHASE 18 — Controlled Runtime Validation

## Objective

Convert the current source/offline baseline into **real runtime evidence**. Step18 must happen in isolated staging/test services before production deployment.

## Milestone 18.1 — Dependency graph freeze

The Step17I baseline intentionally contains **no authoritative historical lockfile**. Do not invent one and call it recovered history.

### Tasks

1. Verify declared toolchain:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm --version
node --version
```

2. Generate a **new candidate** lockfile in a dedicated commit/worktree:

```bash
pnpm install --lockfile-only
```

3. Review:
   - unexpected packages;
   - install scripts/native binaries;
   - package versions and integrity entries;
   - renderer/image/native dependencies;
   - architecture compatibility for ARM64 and AMD64.

4. Commit the reviewed `pnpm-lock.yaml`.

5. Prove reproducibility:

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install --frozen-lockfile
```

### Acceptance

- reviewed `pnpm-lock.yaml` exists in Git;
- frozen install succeeds from a clean dependency state;
- no unreviewed dependency changes remain.

---

## Milestone 18.2 — Full semantic build and regression

Run:

```bash
pnpm typecheck
pnpm build
pnpm test
npm run check:release
npm run check:heavy
```

Do not convert skipped/unavailable checks to PASS.

### Acceptance

- full semantic typecheck PASS;
- production build PASS;
- workspace tests PASS;
- RELEASE PASS;
- HEAVY reports all locally executable gates accurately.

---

## Milestone 18.3 — Supply-chain and dependency security

Run and retain evidence:

```bash
npm run security:sbom-release
npm run security:dependency-scan
npm run security:secret-scan
npm run security:audit
npm run ip:audit
```

Also inspect container contents and multi-arch dependency compatibility.

### Acceptance

- resolved release SBOM exists;
- dependency vulnerabilities are triaged/remediated or explicitly accepted with owner rationale;
- secret scan clean;
- no unresolved release-critical dependency issue.

---

## Milestone 18.4 — Staging database + migrations + RLS

Use an isolated staging Supabase/Postgres database.

### Tasks

- backup staging DB before migration;
- apply migrations `0001 → 0011` sequentially;
- verify schema constraints/triggers;
- run RLS matrix for:
  - anonymous user A;
  - anonymous user B;
  - worker/service role;
  - admin/operator;
- test IDOR boundaries for card versions, payment entitlement, recovery, uploads, template administration and analytics.

### Acceptance

- all migrations applied in order;
- user A cannot read/write user B resources;
- service/admin privileges are no broader than intended;
- launch approval cannot be bypassed through direct API/DB application paths;
- backup/restore evidence retained.

---

## Milestone 18.5 — Queue/worker runtime

Validate real pg-boss operation.

### Tasks

- queue creation/start;
- worker heartbeat;
- same-release readiness;
- enqueue/claim/complete;
- retry/backoff;
- duplicate/idempotent job behavior;
- graceful shutdown;
- crashed/stale worker detection;
- backlog behavior under load.

Measure:

- worker CPU/RAM;
- jobs/minute;
- queue wait P50/P95;
- render/generation concurrency safe limit.

### Acceptance

- no lost durable job in tested failure cases;
- readiness fails when no healthy same-version worker exists;
- concurrency limits are documented from real measurements.

---

## Milestone 18.6 — Real R2/photo pipeline

Validate:

```text
browser authorization
→ quarantine/private upload
→ content validation
→ decode/re-encode/sanitize
→ clean private object
→ preview scope
→ final entitlement scope
→ cleanup/retention
```

Adversarial cases:

- wrong magic bytes;
- oversized image;
- decompression/dimension abuse;
- corrupt image;
- wrong owner/session;
- expired upload capability;
- invalid object key/prefix.

### Acceptance

- raw uploads never become public final assets;
- sanitization is mandatory;
- ownership and retention boundaries pass.

---

## Milestone 18.7 — Real Dodo test-mode commerce E2E

Execute at least:

1. create checkout with exact signed server quote;
2. repeat identical request → reuse/idempotent result;
3. same idempotency key + changed request → reject;
4. valid `payment.succeeded` webhook → authoritative PAID only after exact reconciliation;
5. replay same webhook → no duplicate entitlement/recovery/render job;
6. wrong amount → reject;
7. wrong currency → reject;
8. wrong checkout session → reject;
9. invalid/stale signature → reject;
10. provider/fulfillment transient failure → retry safely;
11. final JPG/PDF + recovery download succeeds only for paid entitlement.

### Acceptance

- browser state cannot unlock high-resolution files;
- PAID is server-authoritative;
- replay/idempotency evidence PASS;
- recovery works after browser/tab closure.

---

## Milestone 18.8 — Premium AI Golden Benchmark

Use the Step14 protocol.

### Required dataset

- 150 Golden briefs;
- all launch locales/scripts;
- photo/no-photo;
- short/long/edge copy;
- diverse relationships/occasions/feelings.

### Protocol

- 3 independent runs per brief per candidate model/config;
- same candidate pool rules;
- record latency/tokens/cost;
- human/editorial scoring;
- evaluate:
  - emotional fit;
  - originality;
  - premium/WOW;
  - copy-design harmony;
  - typography;
  - diversity of the three directions;
  - concentration/repetition;
  - photo usage/veto;
  - market naturalness;
  - failure/fallback rate.

### Acceptance

- chosen production model/prompt has documented evidence;
- no claim of “3 genuinely different” without measured/human-reviewed output;
- cost/latency fits launch economics.

---

## Milestone 18.9 — Launch template human/owner gate

Start with the Step17I shortlist, not the whole catalog.

Candidate review pool should prioritize:

- Museum Note;
- Memory Window;
- Whispered Type;
- Night Ledger;
- Pressed Shadow;
- Soft Fold;
- selected challengers such as Midnight Lume, Luxury Editorial, Classic Letterpress, Monogram Orbit, Quiet Seal, Type Celebration.

### Human evidence required per approved family

- Premium/WOW review;
- originality/similarity review;
- Golden evidence;
- supported locale/script QA;
- exact asset/font provenance;
- renderer/browser parity review.

### Target

Approve **about 6–8 excellent launch families first**. Quality median matters more than catalog breadth.

### Acceptance

- at least a coherent minimum approved set exists;
- every `approved` transition has immutable evidence;
- no automatic or AI-only approval.

---

## Milestone 18.10 — Fonts, typography, localization

Collect exact evidence for shipped browser + renderer fonts:

- package/source;
- exact version;
- SHA-256;
- license/version;
- retained license text;
- commercial-use eligibility;
- script coverage.

Run native-language review for public/product/legal copy in launch locales, especially EN/VI/JA/KO/ZH.

Validate browser ↔ renderer parity for realistic copy pressure.

### Acceptance

- no UNKNOWN production font binary;
- no missing glyph/fallback surprise in launch locales;
- native QA complete for locales enabled at launch.

---

## Milestone 18.11 — Browser/mobile/accessibility/performance

Run on real browsers/devices or trustworthy browser automation:

- Chrome desktop;
- Firefox;
- Safari/iPhone;
- mid-range Android/Chrome;
- keyboard-only;
- screen reader checks;
- 200%/400% zoom where relevant;
- reduced motion;
- slow network/CPU.

Customer journey to verify end-to-end:

```text
homepage
→ studio brief
→ generation/reveal
→ 3 directions
→ select
→ finish/refine/undo
→ checkout
→ payment return
→ keepsake/download/recovery
```

Measure:

- LCP/INP/CLS;
- JS/hydration cost;
- font loading/FOIT/FOUT;
- Studio responsiveness;
- generation perceived wait;
- renderer output time;
- photo optimization.

### Acceptance

- no P0/P1 browser or accessibility defect;
- Core Web Vitals/performance budget respected or explicitly re-baselined with evidence;
- focus transfer across phases verified;
- reveal remains premium on reduced-motion and low-end devices.

---

## Milestone 18.12 — CSP, admin edge identity, logs, secrets, restore

### Tasks

- validate nonce-based CSP in Report-Only/staging;
- enforce CSP after browser QA;
- keep style policy only as permissive as actual React rendering requires;
- validate Cloudflare Access/identity-aware admin boundary;
- validate application Basic Auth defense-in-depth;
- validate edge/app rate limits;
- inspect logs for PII/secrets;
- validate secret scope/rotation procedure;
- execute isolated DB backup/restore rehearsal.

### Acceptance

- CSP enforce-mode works on complete journey;
- admin origin/API cannot be reached without intended identity boundary;
- no secret/PII leakage;
- restore produces a usable isolated database from a verified backup.

---

## Step18 exit gate

Step18 may be called **PASS** only when evidence supports all material runtime categories:

```text
FROZEN_DEPENDENCIES PASS
FULL_BUILD PASS
STAGING_DB_RLS PASS
QUEUE_WORKER PASS
R2_UPLOAD_RENDER PASS
DODO_PAYMENT_RECOVERY PASS
REAL_AI_GOLDEN PASS
TEMPLATE_OWNER_GATE PASS
FONT_LOCALIZATION PASS
BROWSER_ACCESSIBILITY_PERFORMANCE PASS
SECURITY_RUNTIME PASS
BACKUP_RESTORE PASS
```

Otherwise retain explicit partial state.

---

# PHASE 19 — Pi5 primary deployment + Oracle/VPS fallback / HA

## Objective

Run CardeLume as low-cost production infrastructure where either compute node can serve the product while all business-critical state remains external/durable.

## Milestone 19.1 — Reproducible multi-arch images

Build/test:

- ARM64 image for Raspberry Pi 5;
- AMD64 image for Oracle/VPS;
- same application release/version;
- pinned base images and digests where practical;
- web and worker health checks.

### Acceptance

- both architectures build and run the same release;
- renderer fonts/assets are identical by manifest where required.

---

## Milestone 19.2 — Pi5 production node

Configure:

- Docker Compose;
- web + worker;
- watchdog/systemd;
- Cloudflare Tunnel replica;
- resource limits;
- log rotation;
- automatic restart policy;
- secure secrets outside Git.

### Acceptance

- power/reboot restores services automatically;
- `/health/live`, `/health/worker`, `/health/ready` behave correctly;
- stale worker makes readiness fail closed.

---

## Milestone 19.3 — Oracle Free/VPS fallback node

Deploy same release with lower/appropriate worker concurrency if needed.

### Acceptance

- node can independently serve web and worker workload against shared durable dependencies;
- no business-critical local-only state.

---

## Milestone 19.4 — Cloudflare routing and failover

Initial free architecture may use the shared Tunnel replica approach if current Cloudflare behavior is validated. Paid routing/load-balancing is optional only if precise primary/fallback steering becomes necessary.

Test:

- Pi off → Oracle/VPS serves;
- Oracle/VPS off → Pi serves;
- home Internet down;
- app crash on one node;
- worker crash;
- tunnel disconnect;
- rolling deploy one node at a time.

### Acceptance

- one healthy node is sufficient for dynamic site availability;
- no split-brain purchase/entitlement behavior;
- failover does not bypass readiness.

---

## Milestone 19.5 — Shared dependency outage behavior

Test degraded/failure behavior for:

- Supabase/Postgres;
- R2;
- AI provider;
- Dodo;
- DNS/Tunnel.

### Acceptance

- no purchase is accepted if it cannot be safely fulfilled;
- existing safe/static functionality degrades gracefully;
- recovery is documented.

---

## Milestone 19.6 — Backup/restore + disaster rehearsal

Run:

- DB backup;
- checksum validation;
- isolated restore;
- R2 retention/recovery checks;
- node rebuild from Git + secrets + documented bootstrap only.

### Acceptance

- Pi5 can be destroyed/replaced without losing durable business state;
- Oracle/VPS can be rebuilt from scratch;
- restoration procedure is tested, not theoretical.

---

## Step19 exit gate

```text
ARM64 PASS
AMD64 PASS
PI5 PASS
VPS/ORACLE PASS
FAILOVER MATRIX PASS
DEPENDENCY-DEGRADE PASS
BACKUP/RESTORE PASS
```

Only then is infrastructure HA evidence complete.

---

# PHASE 20 — Optional Lume Account / My Cards (conditional)

## Rule

**Do not implement merely because it is on the roadmap.** Start only if soft-launch evidence shows a meaningful need for cross-device card history, repeat purchase or style memory.

## Possible scope

- passwordless account;
- secure anonymous-order claim;
- My Cards;
- cross-device recovery;
- opt-in style memory;
- reset/disable memory;
- privacy delete/export;
- RLS/auth tests.

## Explicit exclusions

- subscription/credits by default;
- social network features;
- mandatory account before purchase;
- broad personalization database without user benefit.

## Acceptance

- anonymous purchase remains first-class;
- account is opt-in;
- privacy/RLS/claim flows proven E2E;
- conversion is not harmed.

If evidence does not justify it, **skip Phase20** and continue improving the anonymous product.

---

# PHASE 21 — Soft launch, evidence-driven optimization, and public launch

## Milestone 21.1 — Soft-launch gate

Before real external customer traffic:

- approved launch template set;
- real-model Golden PASS;
- legal/native copy approved;
- real Dodo/R2/render/recovery E2E PASS;
- browser/mobile/a11y PASS;
- CSP/admin/RLS/security PASS;
- backup/restore PASS;
- Pi5/Oracle failover PASS;
- pricing configured and tested.

### Verdict target

`SOFT_LAUNCH_CANDIDATE` → owner explicit approval → limited traffic.

---

## Milestone 21.2 — Soft-launch measurement

Track privacy-minimized funnel:

```text
studio_started
→ generation_requested
→ results_viewed
→ direction_selected
→ finish_opened
→ checkout_opened
→ checkout_started
→ payment_completed
→ final_render_completed
→ download_jpg/pdf
```

Also measure:

- AI cost per generation and paid order;
- generation latency/fallback rate;
- direction regeneration rate;
- template selection concentration;
- payment failure/recovery;
- render failure;
- customer support/refund reasons;
- mobile vs desktop conversion.

Do not collect raw greeting copy/photos merely for analytics.

---

## Milestone 21.3 — Product quality tuning

Priority order:

1. P0 trust/payment/delivery defects;
2. P1 funnel friction;
3. 3-direction quality/diversity;
4. template portfolio culling/reinvestment;
5. AI model/prompt economics;
6. performance/accessibility;
7. only then new features.

Potential experiments must stay behind experiment/staging gates.

---

## Milestone 21.4 — Public launch decision

Public launch only after soft-launch evidence shows:

- reliable fulfillment;
- acceptable conversion and failure rates;
- premium/WOW human/customer evidence;
- sustainable AI/render cost;
- no unresolved P0 security/IP/legal issue;
- recoverable operations.

Final verdict:

```text
LAUNCH_READY
```

must be evidence-backed, not aspirational.

---

# POST-LAUNCH / SCALE TRIGGERS — only when evidence requires

These are not mandatory roadmap work.

Consider paid/expanded infrastructure only when measured thresholds justify it:

- Cloudflare Load Balancer for deterministic primary/fallback steering;
- larger VPS/compute when queue/render latency exceeds budget;
- additional worker nodes;
- managed observability when operational incidents justify it;
- physical fulfillment only as a separate product decision;
- account/style memory only if Phase20 criteria are met.

Never add architecture merely to appear enterprise-grade.

---

# Global acceptance rules

Every task/milestone must record:

- what was changed;
- exact command/test executed;
- PASS/FAIL/BLOCKED status;
- evidence path;
- unresolved risk;
- rollback or recovery path where applicable.

No agent may:

- fabricate runtime evidence;
- auto-approve a template;
- weaken payment/IP/security gates to obtain PASS;
- commit secrets;
- convert a failed/skipped test into PASS;
- expose raw AI internal reasoning to customers;
- expand scope before the current milestone acceptance criteria are satisfied.
