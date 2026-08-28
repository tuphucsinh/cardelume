# Lume Project Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** low
- **production_authority:** none

## When to use

Periodic whole-project audit to reconcile source, specs, roadmap, known issues and implemented state.

## Allowed data

Repository source, docs, migrations, scripts/tests, frozen handoff manifests and non-secret operational reports.

## Authority and write boundary

Read-only plus documentation/report proposals. Does not change production or silently rewrite architecture authority.

## Procedure

1. Identify latest frozen baseline and canonical V7 documents.
2. Inspect repo tree, package manifests, migrations and key runtime boundaries.
3. Compare implementation claims against source/tests; classify SOURCE, STATIC, ISOLATED RUNTIME, FULL BUILD, STAGING E2E and PRODUCTION/HA separately.
4. Detect stale docs, duplicate obsolete authority and unresolved known issues.
5. Review roadmap order and prevent optional features from displacing current P0 gates.
6. Produce evidence-backed discrepancies and recommended source/doc corrections.

## Failure / stop conditions

Never upgrade validation status without execution evidence. If source/docs conflict, report the conflict and apply documented source-of-truth precedence.

## Verification

All major claims cite files/tests; validation stages are separated; no hidden production mutation.

## Outputs

Status reconciliation; source/doc discrepancies; risk-ranked backlog; recommended next roadmap step.

## References

- `docs/MASTER_SPEC_V7.md`
- `docs/ROADMAP_V7.md`
- `docs/V7_IMPLEMENTATION_CHECKLIST.md`
