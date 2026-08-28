# Validation Report — CardeLume 0.4.3 Step 13

## Result

**Artifact/source + runtime-isolated validation: PASS.**

**Full frozen-dependency workspace semantic build: NOT EXECUTED / environment blocked before install.**

Step 13 is therefore suitable as the next controlled Hermes/Pi handoff baseline, but this report does **not** claim real provider/Supabase/R2/Dodo/pg-boss/Pi↔VPS production E2E.

---

## Scope validated

Step 13 changes creative orchestration while retaining Steps 1–12 production/security boundaries:

```text
hard compatibility veto
↓
soft rank + recent-style prior
↓
<=6 strong-fit + <=2 premium wildcards
↓
premium AI Creative Director
├─ select 3 supplied immutable template/version pairs
└─ OR request one bounded expanded pool
↓
creative thesis + signature move + controlled accent + copy
↓
deterministic premium quality gate
├─ pass
└─ conditional critic/reconsideration
      ↓
   quality gate again
      ├─ pass
      └─ premium-critical risk remains → curated Step 4 fallback
```

The key authority invariant is preserved:

> **Hard constraints veto. Soft scores inform. Premium AI makes the final creative decision.**

---

## Step 13 source-contract regression

`scripts/ai-creative-director-source-stress.ts`: **PASS**

Verified in source:

- candidate pack is `6 + 2` where inventory permits;
- wildcard editorial quality floor exists;
- style history is a soft novelty prior, not hard exclusion;
- soft score is not final creative authority;
- AI can request exactly one bounded expansion;
- prior AI critique is carried into expanded review;
- AI cannot invent an unsupplied template/version pair;
- unique family guard exists;
- Creative Director returns creative thesis, signature move, controlled accent, confidence, novelty and wow signals;
- prompt byte budget is enforced;
- conditional critic is wired;
- creative-range critic may reconsider supplied candidates only;
- critic template/version and family identity guards exist;
- premium-critical risk is checked again after critic and fails closed;
- recent style memory is wired into generation;
- AI usage telemetry is persisted;
- photo upload does not mechanically force a photo direction;
- Step 13 DB migration contains content-free style history + AI usage ledger.

---

## Managed-template runtime/source regression

### Ranking/runtime

`scripts/template-library-stress.ts`: **PASS**

Observed current 16-template launch seed:

- default surface: exactly 4 Recommended + 4 Market/Curated picks + <=8 More when inventory allows;
- surfaced IDs deduplicated;
- no-photo brief excludes `photoMode=required` candidates;
- Step 12 deterministic three-archetype selector remains only as backward-compatible fallback;
- Step 13 creative candidate pack produced 6 fit + 2 high-editorial wildcards;
- recent-style penalty remained soft and did not reduce a repeated strong candidate to zero eligibility.

### Source boundary

`scripts/template-library-source-stress.ts`: **PASS**

Verified:

- 16 template seeds + 16 immutable version seeds;
- template/version composite integrity;
- exact-version checkout pinning;
- archive-not-destructive-delete behavior;
- 4+4+8 browser cap;
- paid source attribution;
- metrics retention;
- admin action guard;
- catalog readiness coverage;
- signed/session-bound/replay-deduped browser analytics.

### Template event capability

`scripts/template-event-capability-stress.mjs`: **PASS**

---

## Regressions retained from Steps 1–12

The following were re-run against the Step 13 tree.

### Verified Dodo payment source boundary

`scripts/payment-boundary-source-stress.ts`: **PASS**

### Dodo Standard Webhooks crypto contract

`scripts/dodo-payment-contract-stress.ts`: **PASS** under Node type-stripping with only the test-runner relative import normalized to `.ts`; production source was not changed for the runner.

Validated valid signature, mutation/tamper rejection, timestamp rules and webhook secret handling covered by the existing stress contract.

### Trusted photo upload source boundary

`scripts/photo-upload-boundary-stress.ts`: **PASS**

### Durable generation queue source boundary

`scripts/generation-queue-source-stress.ts`: **PASS**

The test explicitly verifies the worker now contains `generateCreativeDirectorDirections` + `buildCreativeCandidatePack` and that stale duplicate generation route/501 behavior is absent.

### Production operations

`scripts/production-operations-source-stress.ts`: **PASS**

### Backup/restore guard

`scripts/backup-restore-source-stress.ts`: **PASS**

### Generation failure fallback

`scripts/generation-fallback-stress.ts`: **PASS** source + runtime contract.

### Launch security/retention

`scripts/launch-security-retention-stress.mjs`: **PASS**

### Reproducible container guard

`scripts/reproducible-container-source-stress.mjs`: **PASS**

### Recovery security

`scripts/recovery-security-stress.ts`: **PASS**

- 2,000 generated recovery secrets;
- no collision in test run;
- expected hash/cookie isolation contract.

### Photo Palette WCAG

`scripts/photo-palette-contrast-stress.ts`: **PASS**

- 8 adversarial palettes;
- 5,000 deterministic randomized palettes;
- required foreground/accent contrast contract retained.

---

## Static whole-tree validation

### TypeScript / TSX parser

- **116 TS/TSX source files** scanned.
- **0 parser diagnostics.**

The parser check used TypeScript `createSourceFile`, avoiding the known `transpileModule` harness failure seen in earlier artifact sessions.

### Relative imports

- **149 relative imports** scanned.
- **0 unresolved relative imports.**

### Strict isolated TypeScript

`tsc -p packages/templates/tsconfig.json --noEmit`: **PASS**

Full workspace typecheck is not claimed because workspace dependencies are not installed in this artifact runtime.

### Package metadata

- **12 `package.json` files parse successfully.**
- root/apps/packages report `0.4.3-step.13` where versioned.

### Shell syntax

- **7 shell scripts** under `scripts/` + `infra/` pass `bash -n`.

### Active production-path stub scan

Active `apps/`, `packages/`, `infra/`, `docker/`, compose and env-example surfaces were scanned for material launch stubs.

- active `status:501`: **0**
- active `dodo_not_wired`: **0**
- active `generation_queue_not_wired`: **0**
- active TODO/FIXME markers in those production surfaces: **0**

### Secret-file guard

No packaged:

- `.env` / `.env.local`;
- PEM/private-key file;
- SSH private-key file.

Basic private-key marker scan: **PASS**.

---

## Documentation consistency fixes completed before freeze

Current operational entry points now target Step 13/V6:

- `README.md`
- `START_HERE_HERMES.txt`
- `docs/HERMES_HANDOFF.md`
- `docs/HERMES_EXECUTION_PROMPT.md`
- `docs/KNOWN_ISSUES.md`
- `docs/PROJECT_TREE.md`
- `docs/SPEC_INDEX_V6.md`

Historical V5/Step 12 docs remain intentionally packaged because Step 13 retains the managed-template subsystem and supersedes only the final creative-authority behavior described by V6.

---

## Full workspace dependency/build attempt

Attempted again in this artifact environment:

```bash
corepack pnpm --version
corepack pnpm install --frozen-lockfile --ignore-scripts
```

Corepack failed **before dependency installation** while trying to retrieve:

```text
https://registry.npmjs.org/pnpm/-/pnpm-10.15.0.tgz
```

with:

```text
getaddrinfo EAI_AGAIN registry.npmjs.org
```

Therefore the following remain controlled Hermes/Pi requirements and are **not marked PASS here**:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
```

This is also why dependency-heavy renderer/Sharp/full Next.js tests are not substituted with fake results in this report.

---

## Not claimed / external validation still required

1. Real premium-model subjective quality across all launch markets/locales.
2. Real prompt token counts/provider billing until live provider response usage and pricing metadata are configured.
3. Real Supabase migration 0001→0009/RLS behavior.
4. Real pg-boss queue behavior and stale/retry semantics under production DB networking.
5. Real R2 trusted-photo flow and private final storage.
6. Dodo test-mode checkout → verified webhook → authoritative PAID → fulfillment E2E.
7. Real ARM64/AMD64 deterministic JPG/PDF output and fonts.
8. Pi5 ↔ Oracle/VPS Cloudflare failover.
9. Final Privacy/Terms/Refund approval (`LEGAL_CONTENT_APPROVED=true` must remain gated until approved).
10. Native-language/editorial review of premium AI output.

---

## Controlled-runtime launch criteria for Step 13

Before public launch, Hermes/Pi should demonstrate all of the following with evidence:

- frozen reviewed dependency graph;
- full workspace typecheck/build/tests PASS;
- migrations through 0009 PASS on staging;
- no-photo generation where AI chooses three premium supplied candidates;
- uploaded-photo generation where AI may choose photo or deliberately veto photo use;
- one bounded `expand_pool` path with prior critique continuity;
- copy-only critic cannot change template/version;
- creative-range critic can change only to supplied exact candidate pair and retains unique family;
- unresolved premium-critical risk returns curated fallback;
- normal path uses one premium AI call;
- bounded difficult path does not exceed three calls;
- style memory changes novelty opportunity without storing private content or hard-banning strong fit;
- AI usage ledger contains no raw prompt/card copy;
- Dodo/R2/final/recovery E2E PASS;
- Pi5/Oracle failover PASS;
- legal/native-language/browser/device launch gates PASS.

---

## Final artifact status

Step 13 source is **DONE IN CODE** and passes the available source/runtime-isolated regression suite.

The correct next activity is controlled-runtime validation and launch integration—not adding another creative architecture layer before real quality/traffic data exists.
