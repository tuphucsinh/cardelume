# Lume Security Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** assurance
- **risk:** high
- **production_authority:** approval-required

## When to use

Periodic/release security review or after changes affecting auth, RLS, uploads, payment, recovery, admin, secrets, dependencies, logging or infrastructure.

## Allowed data

Source/config schemas without secret values, dependency manifests/SBOM, staging test endpoints, RLS/migration policies, logs with minimization and documented threat boundaries.

## Authority and write boundary

May perform non-destructive source/staging tests and prepare patches. No destructive production exploitation, secret rotation, control removal or production config change without explicit owner approval.

## Procedure

1. Scope changed attack surface and map to OWASP ASVS 5.0 Level 2 plus relevant higher-assurance payment/admin/recovery controls.
2. Review authentication/access control, Supabase RLS, upload decode/re-encode boundary, Dodo webhook verification, entitlement/recovery, rate limits, CSP/security headers and admin isolation.
3. Review secret handling, logs/PII retention, dependencies/SBOM, container pinning and supply-chain controls.
4. Check backup/restore and incident readiness.
5. Run safe staging tests; never use customer production content as a test corpus.
6. Rank findings by exploitability/impact and provide bounded remediation + regression test.

## Failure / stop conditions

Do not mark secure from checklist review alone when runtime control evidence is required. Stop destructive/exfiltration tests against production.

## Verification

Findings map to evidence/control; critical issues have regression tests; production mutations remain approval-gated.

## Outputs

Security gate matrix; severity-ranked findings; evidence; remediation/tests; release blocking verdict.

## References

- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`

## Step 17B operational commands

1. `node scripts/security-governance.mjs secret-scan`
2. `node scripts/security-governance.mjs sbom-source` — informational source SBOM only; never represent it as the release SBOM.
3. `node scripts/security-governance.mjs audit`
4. Review `security/asvs/ASVS_5.0.0_L2_MATRIX.json` and `security/top10/TOP10_2025_MAPPING.json`.
5. `node scripts/security-governance.mjs release-check` for fail-closed production eligibility. It requires the resolved release SBOM/vulnerability report plus runtime evidence and never deploys.

Known Step 17B blockers must not be downgraded from missing evidence: enforced CSP, frozen dependency graph/release SBOM/vulnerability evidence, live TLS/RLS/security-logging/secret-store/backup evidence, and IP provenance closure.
