# CardeLume Roadmap v7 — From Step 13 to AI-Managed Soft Launch

## Guiding priority

```text
Premium / Wow
> customer trust + security + correctness
> simplicity
> reliability
> speed
> economics
```

Economics matter, but they are optimized without knowingly dropping below the premium floor.

## Step 13 — AI Creative Director

**Status: DONE IN CODE / frozen baseline.**

Do not reopen architecture without benchmark evidence.

## Step 14 — Premium Quality Benchmark Lab

**Source/tooling implemented in 0.4.3 Step 14. Controlled-runtime real-model + human benchmark remains the quality gate.**

Deliver:

- Golden Card Set >=120 synthetic/reference-safe briefs;
- 3-run variance protocol;
- premium/wow human rubric;
- model/prompt/template comparison harness;
- lower-ranked-candidate challenge;
- expand-pool/critic/fallback tests;
- returning-user novelty sequences;
- creative concentration report;
- token/latency/cost report;
- GO/TUNE/NO-GO benchmark report.

## Step 15 — Lumer AI Operator Toolkit

**Repository/source toolkit implemented in 0.4.3 Step 15. Actual Pi5 profile bootstrap/trust/secrets/bundle install remains controlled-runtime work.**

Deliver:

- dedicated Hermes profile `lumer` / identity name Lumer;
- SOUL/authority policy;
- project-local `.hermes/skills/` catalog;
- template-author/premium-review/publish-QA;
- project-health/release/incident/backup skills;
- market/pricing/reference research skills;
- IP/security/economics/localization skills;
- operational bundles and documentation.

## Step 16 — Experiment / Staging Lab

**Source isolation/registry/feature-flag/promotion tooling implemented in 0.4.3 Step 16. Real external staging services/E2E remain controlled-runtime work.**

Deliver:

- explicit environment identity;
- experiment registry;
- feature flags/kill switches;
- branch/worktree flow;
- isolated DB/R2/payment/analytics;
- AI budgets;
- promotion and rollback gates.

## Step 17 — IP + Security Governance

**Source governance implemented in 0.4.3-step.17b; production evidence closure remains before launch.**

Deliver:

- asset/font provenance registry;
- font license manifest and build/publish gate;
- reference originality workflow;
- AI-generated asset provenance;
- ASVS 5.0 L2 verification plan/status;
- Top 10:2025 mapping;
- SBOM/dependency/security release gate;
- Lumer least-privilege production controls;
- protected Control Center/admin.

Step 17B source freeze provides fail-closed IP/security gates. Current production verdict remains NO_GO until exact provenance, dependency/release evidence, enforced CSP and real staging security validations close.

## Step 18 — Controlled Runtime + Commerce E2E

On Pi5/Hermes/staging:

- freeze lockfile;
- install/typecheck/build/tests;
- migrations 0001–0011;
- real premium AI benchmark integration;
- pg-boss;
- trusted R2 upload;
- Dodo test checkout/webhook/PAID;
- final JPG/PDF;
- secure recovery;
- backup/restore drill.

## Step 19 — Pi5 + Oracle Production / HA

- ARM64 + AMD64 images;
- Cloudflare shared-tunnel launch topology;
- readiness watchdog;
- Pi failure → Oracle continues;
- Oracle failure → Pi continues;
- worker failure handling;
- origin/security hardening;
- WAF/rate-limit/bot rules;
- observability/alerts.

## Step 20 — Optional Lume Account

**After core quality and commerce are proven; feature flag first.**

- passwordless account;
- secure anonymous-order claim;
- My Cards;
- cross-device recovery;
- opt-in style memory;
- reset/delete/export controls;
- no mandatory signup.

This work may be developed in parallel in the Experiment Lab if it does not distract from launch blockers.

## Step 21 — Soft Launch

Required gates:

- premium benchmark passes;
- full runtime/build/E2E passes;
- legal content approved;
- native-language/editorial QA for launch markets;
- device/accessibility/output QA;
- security/IP gates pass;
- failover/backup drills pass;
- initial monitoring thresholds/alerts configured.

## After soft launch

Use real evidence to tune:

- template inventory;
- market affinities;
- ranking priors;
- wildcard/exploration;
- prompt/model;
- critic thresholds;
- pricing;
- account value;
- additional Lume products.

Do not add ML ranking/vector search/multi-agent complexity until traffic/data demonstrates a specific benefit.

### Step 17C — Font / Template IP hardening addendum

**Implemented in 0.4.3-step.17c as source/offline work before Step 18.**

- family-level commercial-use research separated from exact shipped-binary approval;
- current font portfolio audited; DM Sans Vietnamese distribution gap identified;
- premium replacement font experiment catalog added;
- CJK/Hangul web heading stack prefers bundled Noto for cross-platform parity;
- all 16 template seeds source/originality risk-reviewed without fake approval;
- 12 original renderer-safe replacement concepts created for experiment/staging;
- third-party template import is not the default replacement strategy.


### Step 17E — Pre-Pi5 portfolio/runtime-ready addendum

**Implemented in 0.4.3-step.17e as source/offline work.**

- Plus Jakarta Sans wired as the source global UI candidate; DM Sans retired from the web source path. Exact binary approval still requires frozen-install evidence.
- 12 original concepts promoted from POC to managed experiment template/version pairs with renderer-owned deterministic layout profiles.
- `launch_status` added as a separate safety boundary: 9 legacy families hold, 7 legacy candidates, 12 V2 experiment families, production reads require `approved`.
- multilingual source-level layout stress passes 900 combinations / 4,500 checks.
- brand/template owner/human approval remains explicit and cannot be replaced by AI/source tests.
- Historical Step 17E handoff targeted migrations through `0010`; current migration authority is `0011`. Step17G replaces the old pre-Pi aggregator with consolidated governance status.

### Step 17F — Product / UX integration hardening

**Implemented in 0.4.3-step.17f as source/offline work.**

- complete 28/28 web visual integration;
- remove launch-held templates from customer-facing surfaces;
- replace customer template browsing with bounded three-new-directions flow;
- bounded AI copy finishing + low-friction custom occasion/relationship;
- privacy-minimized HMAC funnel analytics and compact operating pulse;
- explicit, immutable, evidence-backed template launch approval workflow;
- substantive legal source copy with owner approval gate;
- namespace-wide admin protection + trusted actor audit trail;
- nonce CSP source path and Next.js security-patch source pin;
- migration `0011` and Step18 source handoff.

Step 18 applies migrations through `0011` and remains the authority for full build, real provider/services, browser/native QA and production evidence.


### Step 17G — Governance compression

**Implemented in 0.4.3-step.17g as source/offline work.**

- compress governance into FAST / RELEASE / HEAVY tiers;
- keep focused hard-boundary probes while removing Step-specific aggregate ceremony;
- consolidate evidence under `quality/governance/`;
- remove duplicated historical status/validation/handoff copies from the current baseline;
- correct validators that encoded release names/aliases instead of durable invariants;
- preserve production fail-closed owner/runtime gates.

Step18 remains the next roadmap authority.


## Step 17H — Marketing approval boundary

- Production marketing surfaces now require `launch_status=approved`, matching production catalog/generation.
- Non-production retains candidate/experiment review visibility.
- No launch approval is inferred or auto-created.
- After this patch, source-side work should proceed to Step18 runtime/owner evidence rather than additional product architecture.


## Step 17I — Premium experience convergence

**Implemented in 0.4.3-step.17i as source/offline work.**

- replace generic three-card hero collage with one stronger material/folio object while preserving approved-only production marketing;
- evolve generation reveal into a restrained folio that transitions into the actual three directions;
- add bounded customer-safe `customerRationale` while keeping raw `creativeThesis` internal;
- surface photo palette intelligence only when a customer has supplied a photo;
- simplify Finish to Shorter + one Refine wording action + Undo, with at most three art-directed color options;
- start relationship neutral/optional and clarify format as optional digital print layout;
- strengthen post-pay/recovery copy around owned high-resolution JPG + print-ready PDF;
- add explicit focus transfer across major Studio phases.

No launch template is auto-approved. Step18 remains the next authority for real-model, dependency, staging, browser, payment/render/recovery and security evidence.
