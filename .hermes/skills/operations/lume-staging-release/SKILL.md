# Lume Staging Release

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** medium
- **production_authority:** none

## When to use

Prepare and deploy an approved candidate to isolated staging for E2E validation.

## Allowed data

Release candidate artifact/checksum, staging config references, migration plan, feature flags, test-mode payment config, staging DB/R2/analytics scopes.

## Authority and write boundary

May operate staging within configured limits. It must never point staging writes at production scopes. Production promotion is out of scope.

## Procedure

1. Pin artifact version/checksum and staging environment identity.
2. Prove DB, R2/prefix, analytics, Dodo test mode and secrets are staging-scoped.
3. Back up staging state if migrations are destructive to staging fixtures.
4. Deploy/apply staging migrations according to runbook.
5. Execute readiness, worker, queue, AI, R2, payment test-mode and paid artifact/recovery E2E as applicable.
6. Capture logs/results and prepare release-audit evidence.
7. Roll back staging on blocker; never “fix” by weakening gates.

## Failure / stop conditions

Any ambiguous environment identity or production endpoint/credential risk => stop before write.

## Verification

Staging identity/scopes are explicit; E2E evidence attached; production untouched.

## Outputs

Staging deployment record; checksum; scope proof; E2E results; blockers; rollback result.

## References

- `docs/EXPERIMENT_STAGING_LAB_SPEC_V1.md`
- `docs/ROADMAP_V7.md`
