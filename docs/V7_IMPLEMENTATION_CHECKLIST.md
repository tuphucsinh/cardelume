# V7 Implementation Checklist

This checklist distinguishes **spec approved** from **implemented/validated**.

## Current baseline

- [x] Step 13 AI Creative Director frozen in code.
- [x] V7 product/operations specs written.
- [x] Steps 14–17I implemented at source/tooling level where applicable.
- [ ] Steps 18–21 runtime/production/soft-launch evidence complete.

## Step 14 — Premium Benchmark Lab

- [x] benchmark directory/schema
- [x] Golden Set >=120 briefs
- [x] reference-safe fixtures/photos (semantic synthetic profiles; real owned photo bytes pending controlled runtime)
- [x] 3-run protocol
- [x] human rubric/report format (CSV + JSON summary)
- [x] creative concentration metrics
- [x] novelty sequence tests / repeat-user simulation
- [x] lower-ranked candidate challenge source regression
- [x] expand-pool challenge source regression
- [x] copy-only critic challenge source regression
- [x] creative-range critic challenge source regression
- [x] photo-use and photo-veto cohorts/metrics
- [x] token/latency/cost report generator
- [x] GO/TUNE/NO-GO report generator; real-model + human verdict pending

## Step 15 — Lumer Toolkit

Repository/source toolkit is implemented in Step 15; actual Pi5 Hermes profile bootstrap remains a controlled-runtime gate.

- [ ] create `lumer` Hermes profile on Pi5
- [ ] install reviewed SOUL into profile-local state
- [ ] configure workspace cwd on Pi5
- [x] separate secrets/config policy and repo/profile ownership boundary
- [ ] project skill trust on actual Pi5 checkout
- [x] `lume-project-health`
- [x] `cardelume-template-author`
- [x] `cardelume-premium-review`
- [x] `cardelume-template-portfolio`
- [x] `cardelume-market-adaptation`
- [x] `cardelume-publish-qa`
- [x] `lume-release-audit`
- [x] `lume-experiment-manager`
- [x] `lume-incident-response`
- [x] `lume-backup-restore-audit`
- [x] `lume-market-intelligence`
- [x] `lume-competitive-pricing`
- [x] `lume-visual-reference-scout`
- [x] `lume-ip-copyright-audit`
- [x] `lume-security-audit`
- [x] `lume-localization-qa`
- [x] `lume-ai-economics`
- [x] `lume-product-effectiveness`
- [x] companion project/performance/staging/readiness/dependency/provenance/analytics skills
- [x] authority/data/research/trust/concurrency policies
- [x] operational bundle templates
- [x] toolkit source validator + static health; release evidence consolidated into Step17G governance runner
- [ ] install/sync operational bundles into actual Lumer profile

## Step 16 — Experiment/Staging

Source guardrails/tooling are implemented in Step 16; real external-service isolation and staging E2E remain runtime gates.

- [x] explicit APP_ENV
- [ ] actual isolated DB project/credentials provisioned (source scope guard implemented)
- [x] R2 non-production prefix enforcement (actual bucket/credentials pending)
- [x] Dodo experiment/staging test-mode enforcement (actual E2E pending)
- [ ] actual isolated analytics destination provisioned (scope/namespace guard implemented)
- [x] AI budget attribution/caps in benchmark runner (provider-side cap pending)
- [x] feature flag registry + default OFF
- [x] global/per-flag kill switches
- [x] experiment registry + record schema
- [x] synthetic test data policy
- [x] branch/worktree command for real Git checkout
- [x] promotion evidence gate; production stops at owner approval
- [x] rollback/kill-switch contract
- [ ] real staging Cloudflare hostname/access policy
- [ ] real isolated staging E2E

## Step 17 — IP/Security

- [x] font manifest + installed-runtime evidence collector
- [x] asset provenance registry with immutable hashes
- [x] license evidence store structure and reviewer contract
- [x] unknown-license publish blocker / fail-closed release check
- [x] competitor/reference originality rule + 16-template review registry
- [x] reusable AI asset provenance contract
- [x] ASVS 5.0.0 L2 selected launch verification matrix
- [x] Top 10:2025 awareness mapping
- [x] partial source CycloneDX SBOM generation (explicitly not release authority)
- [x] dependency/security fail-closed release scan tooling
- [x] project-skill security/IP release integration
- [ ] exact font/brand/template production provenance approvals (currently NO_GO)
- [ ] frozen `pnpm-lock.yaml` + resolved release SBOM + vulnerability PASS
- [ ] enforced CSP after nonce/hash migration + browser/staging QA
- [ ] Lumer least-privilege production credentials validated on Pi5
- [ ] protected identity-aware internal admin/Control Center
- [ ] live TLS/RLS/security-logging/secret-store/backup security evidence

## Step 18 — Controlled Runtime E2E

- [ ] frozen dependency graph
- [ ] full typecheck/build/test
- [ ] migrations 0001–0011 on staging
- [ ] real AI provider
- [ ] pg-boss
- [ ] R2 photo flow
- [ ] Dodo checkout/webhook/PAID
- [ ] JPG/PDF fulfillment
- [ ] secure recovery
- [ ] backup/restore rehearsal

## Step 19 — Production HA

- [ ] ARM64 Pi image
- [ ] AMD64 Oracle image
- [ ] Cloudflare topology
- [ ] watchdog/readiness
- [ ] Pi down → Oracle
- [ ] Oracle down → Pi
- [ ] worker failure
- [ ] WAF/rate limits
- [ ] alerts

## Step 20 — Optional Lume Account

- [ ] feature flag OFF by default
- [ ] passwordless auth
- [ ] secure anonymous-order claim
- [ ] My Cards
- [ ] cross-device recovery
- [ ] opt-in style memory
- [ ] reset/disable memory
- [ ] privacy/delete/export flows
- [ ] RLS/auth security tests

## Step 21 — Soft Launch

- [ ] benchmark quality gate
- [ ] legal approval
- [ ] native-language QA
- [ ] device/accessibility QA
- [ ] renderer/output QA
- [ ] security/IP release gate
- [ ] failover/backup gate
- [ ] production monitoring

### Step 17C — Font/template IP hardening

- [x] family-level license/commercial-use research for all current font sources
- [x] exact shipped-binary approval kept separate/fail-closed
- [x] DM Sans Vietnamese distribution/coverage risk recorded
- [x] premium font experiment catalog with OFL-only researched candidates
- [x] bundled Noto preferred for JP/KR/ZH premium page headings
- [x] all 16 current template seeds portfolio/IP risk-reviewed
- [x] 12 original procedural replacement concepts defined in experiment scope
- [x] source governance stress validation
- [ ] exact Fontsource/Debian font binary versions + hashes + retained license files
- [ ] native-language typography benchmark / visual QA
- [ ] human visual-similarity + owner originality sign-off for production templates
- [ ] Golden benchmark promotion of any new font/template concept


### Step 17E — Portfolio V2 / pre-Pi5 completion

- [x] Plus Jakarta Sans source integration replacing DM Sans
- [x] 12 V2 managed experiment template/version identities
- [x] deterministic renderer layout profiles for all 12 V2 families
- [x] migration `0010_template_portfolio_v2.sql`
- [x] launch-status fail-closed catalog boundary
- [x] 9 weak legacy families held without destroying historical versions
- [x] 900-case / 4,500-check multilingual source-level layout stress
- [x] V2 production-layout contact sheet + offline triage
- [x] 28-template provenance coverage
- [x] owner brand/template review evidence templates
- [x] pre-Pi5 readiness evidence; Step17G consolidates it into `check:status`
- [ ] exact installed font artifact approvals
- [ ] owner brand-asset provenance approval
- [ ] human template originality/Premium/WOW approval
- [ ] real Golden/model/browser/staging evidence

### Step 17F — Product / UX integration hardening

- [x] 28/28 web visual directions have preview coverage
- [x] customer-facing surfaces exclude launch-held templates
- [x] template marketplace removed from primary Studio flow
- [x] three-new-directions regeneration uses prior results as soft novelty evidence
- [x] bounded AI Warmer/Playful rewrite; deterministic Shorter retained
- [x] custom occasion / relationship personalization
- [x] primary physical-effects control removed; subtle automatic behavior retained
- [x] privacy-minimized HMAC funnel analytics
- [x] payment/final-render authoritative funnel events
- [x] compact admin operating pulse
- [x] migration `0011_funnel_and_launch_approvals.sql`
- [x] explicit owner launch approval workflow separated from technical publish
- [x] approval evidence append-only + DB hard constraint
- [x] new current version demotes prior approval
- [x] legal placeholders removed and production owner/legal gate added
- [x] all admin namespaces protected; trusted actor audit trail
- [x] nonce CSP source path, script unsafe-inline removed
- [x] Next.js 16.3.3 source pin
- [x] Step17F source regression coverage retained inside Step17G RELEASE registry
- [ ] reviewed `pnpm-lock.yaml` + frozen full build/test
- [ ] owner/legal/native-language approval
- [ ] owner brand provenance + human template Premium/WOW/IP approval
- [ ] real Golden/staging/browser/CSP/runtime evidence

### Step 17G — Governance compression

- [x] FAST / RELEASE / HEAVY execution tiers
- [x] single governance check registry + consolidated runner
- [x] Step-specific aggregate package aliases removed
- [x] per-check persistent log sprawl removed
- [x] stale release-name assertions replaced by invariant/dynamic checks
- [x] historical duplicated status/validation/handoff docs removed from current baseline
- [x] current history index and canonical authority path documented
- [x] focused trust-boundary probes retained for debugging and coverage
- [ ] Step18 frozen build/service/browser/HA evidence


### Step 17H — Marketing approval boundary

- [x] production marketing/gallery helper requires `launch_status=approved`
- [x] homepage uses same production marketing gate
- [x] safe CardeLume-owned hero fallback when approved portfolio is empty
- [x] candidate/experiment visibility retained only for non-production review
- [x] zero auto-approvals

### Step 17I — Premium experience convergence

- [x] one-material-object hero
- [x] folio reveal transitions into actual three results
- [x] bounded customer-safe rationale separate from raw Creative Director thesis
- [x] fail-closed rationale sanitizer for provider process/model/ranking jargon
- [x] photo palette intelligence visible only when relevant
- [x] Finish simplified to Shorter + Refine + one-step Undo
- [x] visible color choices bounded to Original / photo / one curated accent
- [x] relationship neutral/optional by default
- [x] digital-only print layout guidance
- [x] post-pay keepsake JPG/PDF/recovery clarity
- [x] explicit phase focus targets for accessibility
- [x] owner-review shortlist prepared without changing launch approval state
- [ ] owner human Premium/WOW/originality review + approval of launch set
- [ ] Step18 live browser/model/payment/render/accessibility proof
