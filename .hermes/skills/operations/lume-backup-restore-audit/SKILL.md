# Lume Backup Restore Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** high
- **production_authority:** approval-required

## When to use

Verify backup freshness, coverage, restoration procedure and recovery evidence before releases or after infrastructure changes.

## Allowed data

Backup metadata, retention policy, encrypted storage metadata, DB/object inventory counts, restore rehearsal logs and checksums. Avoid reading customer content unless strictly required.

## Authority and write boundary

May perform restore rehearsal only in isolated non-production targets. **Owner approval checkpoint:** production restore, overwrite or destructive recovery requires explicit approval.

## Procedure

1. Enumerate business-critical sources of truth (DB, R2/object metadata, config references) and required RPO/RTO.
2. Check latest successful backups, retention and independent failure alerts.
3. Verify backup artifacts are protected from the same credential/failure domain where practical.
4. Restore to isolated staging/recovery target.
5. Validate schema/version, row/object counts, representative entitlement/recovery metadata and application readiness without exposing PII.
6. Record elapsed recovery, gaps and checksum/evidence.
7. Mark PASS only for an actually executed restore rehearsal.

## Failure / stop conditions

No backup timestamp or “backup job succeeded” alone counts as restore proof. Stop on target ambiguity that could overwrite production.

## Verification

Restored target is isolated; app/schema checks pass; evidence timestamps are recent; RPO/RTO gaps recorded.

## Outputs

Backup coverage matrix; restore rehearsal report; RPO/RTO evidence; blockers and recovery recommendation.

## References

- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
- `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
