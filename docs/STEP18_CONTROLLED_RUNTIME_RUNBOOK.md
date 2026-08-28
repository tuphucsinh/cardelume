# Step 18 Controlled Runtime Validation Runbook

> Execute this runbook from the current **Step17J baseline (`0.4.3-step.17j`)**. Source/offline PASS does not substitute for any runtime evidence below.

This runbook is prepared in Step 17B. **It is not evidence that Step 18 has run.** Execute on Pi5/Lumer against isolated staging/test services first.

## 0. Safety / identity

- use a real Git checkout and record commit SHA + candidate version;
- use the dedicated `lumer` profile with least privilege;
- set `APP_ENV=staging`, staging DB/R2/analytics/recovery/AI scopes and Dodo `test_mode`;
- verify no production DB/R2/payment credential is present in the staging environment;
- back up the staging DB before migrations;
- do not run production migrations/deploy/DNS/payment changes without explicit owner approval.

## 1. Dependency freeze and build

```bash
corepack enable
pnpm --version
sha256sum pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
```

This Step17J Hermes package intentionally has no authoritative historical lockfile. If `pnpm-lock.yaml` is absent, create a **new candidate lockfile** in a dedicated branch/worktree (`pnpm install --lockfile-only`), review the resolved graph/install scripts/native dependencies, commit it as new Step18 evidence, then restart from a clean state with `pnpm install --frozen-lockfile`. Never describe the new lock as recovered historical state.

## 2. Supply-chain evidence

```bash
node scripts/release-sbom.mjs
node scripts/dependency-vulnerability-scan.mjs
node scripts/security-governance.mjs secret-scan
node scripts/ip-governance.mjs audit
```

Review container build outputs/digests and final image contents on ARM64 and AMD64. Run a dedicated Git-history/entropy secret scanner in CI in addition to the repository scanner.

## 3. Governance / full regressions

Run the consolidated release suite first:

```bash
npm run check:release
```

Focused probes may still be run directly when debugging a failing domain.

## 3A. Full regressions

Run the normal workspace suite plus the Step 13–17 source/runtime stress scripts. Do not collapse skipped tests into PASS.

## 4. Database and RLS

- back up staging DB;
- apply migrations `0001 → 0011` in order;
- verify migration state/schema constraints;
- execute RLS matrix with anonymous user A, anonymous user B, service worker and admin/service role;
- exercise function/object authorization, paid entitlements, recovery, uploads and template/admin boundaries;
- store a content-free report as `security/evidence/rls-authorization-validation.json` only after actual PASS.

## 5. Real staging services

Validate:

- pg-boss enqueue/worker/heartbeat/retry/idempotency;
- R2 quarantine → sanitize → clean private asset → preview/final scope;
- Dodo test checkout → raw-body verified webhook → authoritative PAID;
- paid JPG/PDF generation and entitlement;
- secure recovery and short-lived signed download;
- real premium AI Creative Director using Step 14 Golden Set protocol;
- AI token/latency/cost ledgers and experiment budget guards.

## 6. Browser / security validation

- migrate CSP in experiment/staging to enforced nonce/hash/allowlist form; run browser/mobile Studio/checkout/recovery/template/admin flows before production enforcement;
- probe Cloudflare/origin TLS versions/ciphers/HSTS and verify no HTTP downgrade;
- configure/validate edge WAF/rate limits/bot controls;
- put admin behind identity-aware access plus application authorization;
- verify CSRF/cross-origin mutation behavior;
- validate upload adversarial cases;
- validate centralized security log ACL/retention/alerts and no secret/PII leakage;
- validate secret manager scope and rotation procedure without printing values.

Write PASS evidence only after execution:

```text
security/evidence/staging-security-validation.json
security/evidence/tls-edge-validation.json
security/evidence/rls-authorization-validation.json
security/evidence/security-logging-validation.json
security/evidence/secret-store-validation.json
security/evidence/backup-restore-validation.json
```

## 7. Premium benchmark

Run all 150 Golden Briefs × 3 independent generations per candidate model under the same protocol, complete human/editorial review, summarize premium/WOW separately and compare model quality/consistency/diversity/latency/tokens/cost. CardeLume's Golden Set, not internet benchmark ranking, is final model-selection evidence.

## 8. Final Step 18 pre-release checks

```bash
node scripts/ip-governance.mjs release-check
node scripts/security-governance.mjs release-check
npm run check:status
```

A resulting `GO_FOR_OWNER_APPROVAL` means evidence is complete enough for the owner to decide. It never authorizes Lumer to deploy production.
