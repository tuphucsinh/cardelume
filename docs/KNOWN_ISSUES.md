# Known Issues / Remaining Controlled-Runtime Work — CardeLume 0.4.3 Step 13

This file lists work that is **not honestly proven in the artifact-only environment**. It is not a backlog of fake or intentionally omitted production code.

## P0 — dependency / semantic build

- `pnpm-lock.yaml` remains intentionally absent until a registry-enabled controlled install is reviewed.
- Run `scripts/freeze-dependencies.sh` on Hermes/Pi.
- Then run full workspace `pnpm typecheck`, `pnpm build`, `pnpm test` with frozen dependencies.
- Artifact-runtime Corepack still cannot fetch `pnpm-10.15.0.tgz` because DNS access to `registry.npmjs.org` fails with `EAI_AGAIN`; therefore full workspace semantic build is **not claimed** here.

## P0 — database

- Back up staging first.
- Apply migrations **0001–0011** to controlled Supabase/Postgres.
- Validate `0008_managed_templates.sql` composite FKs, seed idempotency and catalog readiness on real Postgres.
- Validate `0009_ai_creative_director.sql` style-memory/AI-usage constraints, RLS and retention cleanup.
- Verify pg-boss uses a session-capable/direct database connection.
- Verify production DB roles cannot access server-only rows through public RLS paths.

## P0 — Step 13 premium creative generation

- Run real premium-model quality benchmark across launch locales/markets and representative occasions.
- Verify the initial pack is <= 6 strong-fit + <= 2 premium wildcards and that AI can deliberately choose a lower-ranked supplied candidate.
- Force one `expand_pool`; verify pool <=16, approximately 75% fit / 25% exploration where inventory permits, and prior AI critique survives into the second call.
- Force copy-only critic; exact template/version must remain locked.
- Force `creative_range` critic; a weak direction may switch only to a server-supplied exact pair with unique family.
- Force unresolved low-wow/range/copy/confidence; verify curated Step 4 fallback rather than weak output.
- Verify uploaded photo can be creatively vetoed by AI when it does not improve the card.
- Verify recent style memory reduces repetition without hard-banning a clearly superior current fit.
- Observe expansion, critic and fallback rates. High rates indicate catalog/recipe/prompt/model quality problems and must **not** be solved with an unbounded agent loop.

## P0 — AI economics / observability

- Set real provider/model pricing metadata if cost estimation is desired.
- Verify normal successful generation is one premium AI call.
- Verify worst-case bounded path never exceeds director + expanded director + critic.
- Verify `generation_ai_usage` records provider/model/token/latency/cost metadata without raw prompts or card copy.
- Measure real P50/P95 generation latency, input/output tokens, calls/generation, critic rate and fallback rate before launch.

## P0 — Step 12 managed template system

- Run template admin over real HTTPS with production secrets.
- Verify Draft → targeting → immutable v2 → publish → archive.
- Verify exact-version checkout race on real Postgres.
- Verify catalog readiness fails closed when required format/script/archetype coverage is removed.
- Verify signed template-event capabilities reject tamper/expiry/cross-session replay through real Next.js routes.
- Verify daily metrics rollup and raw-event retention on the real worker schedule.
- Review seeded market affinities with actual launch-market editorial input; they are priors, not proof of cultural preference.
- Gather real traffic before materially increasing historical-performance influence.

## P0 — live services

- Supabase persistent Postgres/RLS E2E.
- Real R2 quarantine → sanitize → clean private asset → bound paid render flow.
- Dodo test-mode checkout → raw-body verified webhook → authoritative PAID → idempotent fulfillment.
- Real AI provider through the Step 13 Creative Director path.
- Paid final JPG/PDF and secure recovery/download E2E.

## P0 — HA / infrastructure

- Build ARM64 Pi5 and AMD64 Oracle/VPS images from the reviewed frozen lockfile.
- Validate shared Cloudflare Tunnel replicas on both nodes.
- Test local watchdog against `/health/ready`.
- Test Pi power loss → VPS and VPS loss → Pi.
- Confirm WireGuard failure does not affect public web availability.
- Configure Cloudflare WAF/rate limits and abuse controls before public launch.

## P0 — legal launch gate

Privacy, Terms and Refund pages still require owner/legal approval. Keep:

```text
LEGAL_CONTENT_APPROVED=false
```

until final wording is approved. `/health/ready` intentionally fails closed otherwise.

## Localization / market QA

- Native-speaker proofreading remains required for JA / KO / ES / FR / DE / PT / IT / ZH / VI.
- Validate AI creative theses/copy plus managed-template recommendations with native-language reviewers in VN/JP/KR and representative Latin markets.
- Validate CJK/Hangul fonts in browser and JPG/PDF export.
- Stable locale URLs + reciprocal hreflang remain an SEO launch task before indexing localized marketing pages.

## Device / accessibility QA

- iPhone Safari no focus zoom.
- Mid-range Android motion/GPU benchmark.
- Full keyboard flow through Studio/template browser/Finish/checkout.
- Reduced-motion behavior.
- Template discovery remains usable at narrow widths without becoming a dense catalog.

## Renderer / output QA

- Inspect all five JPG/PDF formats on production ARM64 and AMD64 images.
- Confirm deterministic font availability.
- Compare browser preview vs final for managed immutable template versions.
- Validate Photo Story crop/orientation/contrast with trusted real uploads.

## Intentional non-goals for Step 13

Not considered missing:

- deterministic engine replacing AI creative judgment;
- default multi-agent chain;
- unbounded AI self-reflection;
- vector database / embedding search for the launch template inventory;
- ML recommendation system before sufficient traffic exists;
- relationship-specific template targeting without evidence;
- public template marketplace or customer template uploads;
- arbitrary admin renderer upload;
- multi-role enterprise admin system;
- unlimited template browsing;
- storing recipient/card copy/photo in style history;
- covert cross-device fingerprinting.


## Step 14 Premium Benchmark Lab — runtime gates

- Inherited Step 13 archive has no `pnpm-lock.yaml`; controlled Pi/Hermes runtime must restore/freeze dependency graph before full semantic build claims.
- Current sandbox has no installed pnpm and cannot reach npm registry through Corepack, so full workspace install/typecheck/build/test was not executed here.
- Real-model Golden Set runs (150 briefs × 3 repeats per candidate model) are not yet executed.
- Human/editorial premium scoring is not yet executed; no 8.5 median / 7.5 P10 launch-quality claim exists yet.
- Semantic photo profiles exercise Step 13 photo-decision inputs, but browser/final-render parity with owned/CC0 benchmark image bytes remains controlled-runtime work.
- For catalogs that have changed from the 16 source seeds, export the managed staging catalog and pass it with `--catalog-json`; do not benchmark a stale inventory and call it production-equivalent.

---

## Step 15 Lumer Operator Toolkit runtime gates

- The actual dedicated Hermes profile `lumer` has not been created/configured/trusted in this sandbox; that must happen on Pi5.
- Profile-local SOUL/secrets/bundles are intentionally not included in repository artifacts.
- `pnpm-lock.yaml` is still absent from the inherited frozen source; frozen dependency install/full build remains unproven.
- Live read-only project-health signals require least-privilege access to deployed services; static helper reports them UNKNOWN here.
- Release-evidence preflight correctly remains NO_GO until real-model/human benchmark, staging E2E, security/IP runtime evidence, backup/restore and later HA gates are executed.

---

## Step 16 Experiment/Staging runtime gates

- Source-level environment isolation is enforced, but actual separate Supabase/R2/analytics/Cloudflare/Dodo-test resources have not been provisioned or verified in this sandbox.
- Local AI experiment cost ledger/call caps are defense in depth; provider/project-level spend caps should be configured where supported.
- `worktree-create` requires a real Git checkout; frozen handoff archives do not include `.git` state.
- `dodo-payment-contract-stress.ts` requires the workspace TypeScript resolver/dependency environment; it was not falsely marked PASS under bare Node.
- Full frozen dependency build remains blocked by the inherited missing `pnpm-lock.yaml` and unavailable package install in this environment.

---

## Step 17 / 17B IP + Security governance gates

- All 11 discovered font sources/packages are `UNKNOWN` for production until exact version/binary hash + authoritative license evidence are collected and reviewed. Upstream OFL research alone does not identify the exact shipped binary.
- `apps/web/public/brand/cardelume-icon.png` and `og-card.png` have immutable SHA-256 records but no owner/creator/right-to-use evidence in the repo; both remain `UNKNOWN`.
- All 16 bootstrap template compositions require explicit originality + third-party similarity review; current status remains `UNKNOWN/PENDING`.
- Worker Debian font packages are not version/snapshot pinned.
- `pnpm-lock.yaml` is missing; exact npm graph, resolved release SBOM and dependency vulnerability report are therefore not available.
- CSP is intentionally still Report-Only and includes `unsafe-inline`. Enforce only after nonce/hash/allowlist migration and browser/staging validation.
- Live TLS/Cloudflare origin policy, RLS/IDOR matrix, secret-store/IAM scope, centralized security logging/alerts and backup/restore security validation are not executed here.
- Template admin retains app-level HTTP Basic auth as defense in depth, and current production config/proxy also requires the identity-aware Cloudflare Access boundary. The remaining gate is **live edge identity/access validation**; do not treat Basic auth alone as sufficient.
- The source secret scan is deliberately high-confidence and worktree-oriented. Run dedicated Git-history/entropy/CI secret scanning before release.
- `security/reports/source-sbom.cdx.json` is partial and explicitly **not** a release SBOM.
- Step 17G `npm run check:status` is expected `NO_GO` until IP/security/font-template owner/runtime gates close. Focused `security:release-check` / `ip:release-check` remain available for domain debugging.

---

## Step 17C Font / Template audit gates

- Family-level research confirms the current font families are OFL-eligible for commercial design use, but production entries deliberately remain `UNKNOWN` until exact shipped version/file/hash/license evidence is collected.
- Current DM Sans Google Fonts/Fontsource metadata has no Vietnamese subset; it should not remain the sole global UI sans for CardeLume's Vietnamese locale. Plus Jakarta Sans is the primary experiment candidate, not yet a production dependency.
- Web JP/KR/ZH premium headings now prefer bundled Noto before OS fonts. Browser/native-language visual QA is still required.
- No current 16-template record is auto-approved. Source inspection found procedural repo-authored renderer art rather than imported template artwork, but owner originality + third-party similarity review remains mandatory.
- Generic/cultural-shorthand families marked for rework remain in the frozen source catalog for backward compatibility until benchmarked replacements are implemented and promoted; Step 17C does not silently change production creative selection.
- 12 replacement concepts are experiment-only and have no production authority.
- Seven of the 12 Step 17C concepts now have procedural SVG POCs and an offline gallery. These are still preview experiments: no production renderer/catalog wiring, Golden benchmark or native typography QA is claimed.
- `typography-plus-jakarta` and `original-template-v2` are registered draft experiments with default-OFF feature flags and production excluded from allowed environments.

## Step 17D Font / Template production-quality gates

- Historical Step17D note: the launch-quality gate returned `NO_GO` while DM Sans was wired as global UI/body. That source issue was resolved in Step17E by wiring Plus Jakarta Sans; exact installed binary provenance and real VI/browser/render QA remain open.
- Historical Step17D note: Plus Jakarta Sans and Be Vietnam Pro were candidate replacements. Current Step17I web source uses Plus Jakarta Sans; exact package version/binary evidence, CLS/layout and native typography QA remain required before production approval.
- Six additional OFL+Vietnamese premium candidates are research/experiment entries only. CardeLume must not ship all of them merely because they are free.
- Nine legacy renderer directions are held for reframe/rework/replace/merge and remain active only to preserve the frozen baseline/benchmark comparison. Production promotion must archive/reversion them rather than silently mutating immutable version identities.
- All 12 original replacement concepts now have procedural SVG POCs, but they are not full managed-template/renderer implementations yet.
- Before promotion, each new family needs immutable versioning, real CardDocument/render integration, EN/VI/JP/KR/ZH text-pressure fixtures, exact font provenance, Golden target-segment scores and human originality/WOW review.


## Step 17E remaining gates

- Plus Jakarta Sans is now wired in source, but its exact installed Fontsource binary/version/hash is still `UNKNOWN` until the frozen dependency graph is restored and evidence is collected.
- Nine legacy families are launch-held. Twelve V2 families are managed `experiment` templates. Neither state grants production authority.
- Source multilingual layout stress is not equivalent to real browser/font/final-render parity.
- Current CardeLume icon and OG-card binaries still require owner/right-to-use provenance evidence.
- Human originality/similarity/Premium/WOW review is still required before any template becomes `approved`.
- `pnpm-lock.yaml` remains the primary dependency reproducibility blocker.

## Step 17F remaining gates

- Full TypeScript semantic build is still blocked by the missing reviewed dependency lock/install. A 112-file TS/TSX syntax transpilation pass is not a substitute for workspace typecheck/build.
- Next.js is source-pinned to 16.3.3, but the authoritative resolved dependency graph and vulnerability report still require Step18 lockfile/install evidence.
- `style-src 'unsafe-inline'` remains in CSP because current React/card-preview paths still use controlled inline styles; script inline execution is nonce-gated. Remove style unsafe-inline only after a measured style refactor and browser QA.
- Legal copy is substantive source draft, not legal advice/approval. Non-English legal sections still require native/legal review before those locales are treated as legally localized.
- `ANALYTICS_PSEUDONYM_KEY` must be a production secret and must not be casually rotated because rotation breaks longitudinal pseudonymous funnel continuity.
- Launch approval evidence is structurally immutable/version-bound, but the truth of benchmark/IP/human evidence must still be verified by Step18/Lumer/owner process.
- Customer hosted-share links remain intentionally absent until a secure entitlement-aware backend exists.
- Production remains NO_GO until dependency/font/brand/template/legal/Golden/staging/browser/security/HA evidence closes.


## Step17H production marketing portfolio

- There are currently **0 launch-approved managed templates**. This is intentional fail-closed state, not a reason to promote candidates.
- In production, managed template marketing/gallery surfaces are approved-only. Until a launch set is explicitly approved, the homepage uses a neutral CardeLume-owned hero fallback and omits the managed style gallery.
- Human Premium/WOW/originality review + IP evidence + Golden evidence remain required before changing any template to `approved`.


## Step17I premium experience convergence

- Step17I improves hero/reveal/result rationale/Finish/recovery source UX but does not prove live premium feel; real browser/device QA remains Step18.
- `customerRationale` is a bounded customer-facing explanation and must never be used to expose raw `creativeThesis`, scores, rankings or hidden reasoning.
- Automated wording edits now have one-step Undo in the current client session; persistence across refresh is not claimed.
- Relationship starts neutral/optional. Format remains a renderer capability but is presented as optional digital print layout, not physical fulfillment.
- There are still **0 production-approved templates**. Human Premium/WOW/originality + IP + Golden evidence remains the primary portfolio gate.
- Exact Plus Jakarta Sans installed binary/version/hash/license evidence and native VI/browser/final-render QA remain Step18 gates even though Plus Jakarta Sans is now wired in current web source.
- Real generation latency must be measured before tuning reveal timing beyond the current staged source choreography.
- Full focus/keyboard/screen-reader behavior after phase transitions remains a live accessibility QA gate.
