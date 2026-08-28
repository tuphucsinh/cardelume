# Lume Release Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** high
- **production_authority:** approval-required

## When to use

Before any staging→production promotion or release candidate sign-off.

## Allowed data

Frozen dependency/lock evidence, SBOM, build/typecheck/tests, migrations, backups, security/IP audits, benchmark delta, staging E2E, config diff, version/checksum, rollout/rollback plan.

## Authority and write boundary

Audit and prepare only. **Owner approval checkpoint:** a GO means eligible for owner approval, never permission for Lumer to deploy production autonomously.

## Procedure

1. Pin release commit/version/artifact checksum.
2. Require dependency lock reproducibility and SBOM evidence.
3. Require typecheck/build/tests and relevant stress/regression results.
4. Review migrations, compatibility, backup freshness and tested rollback/restore plan.
5. Require security and IP/copyright gates.
6. Require Premium Benchmark comparison for creative/model/template/prompt changes.
7. Require staging E2E including payment test mode and paid artifact/recovery paths when affected.
8. Diff production configuration/feature flags without exposing secret values.
9. Verify rollout health signals and rollback triggers.
10. Any mandatory missing/failed gate => NO_GO. Otherwise => GO_FOR_OWNER_APPROVAL.

## Failure / stop conditions

Fail closed on missing evidence. Never infer full build/staging/production validation from source inspection.

## Verification

Every PASS cites an actual executed artifact; exact release checksum/version matches package; owner approval remains pending.

## Outputs

Release gate table; failed/unknown items; exact artifact identity; rollback readiness; NO_GO or GO_FOR_OWNER_APPROVAL.

## References

- `docs/ROADMAP_V7.md`
- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`

## Machine gates

Run `npm run check:release` for authoritative source/offline release coverage and `npm run check:status` for the consolidated owner/runtime gate view. Use focused IP/security probes only to debug a failed domain. Do not substitute `source-sbom.cdx.json` for a resolved release SBOM, and do not infer CSP/TLS/RLS/logging/secret-store runtime results from source inspection.
