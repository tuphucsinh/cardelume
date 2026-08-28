# Lume Analytics Review

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** analytics
- **risk:** low
- **production_authority:** none

## When to use

Audit analytics instrumentation, metric definitions, event integrity and whether dashboards support trustworthy decisions.

## Allowed data

Event schemas, aggregate counts, instrumentation source, consent/privacy rules, analytics retention and signed/session-bound event logic.

## Authority and write boundary

Read-only audit plus branch/test proposals. No production analytics routing or retention change without approval if it affects privacy or billing.

## Procedure

1. Inventory decision-critical events and map each to source instrumentation and metric definition.
2. Verify dedupe/session binding/signature controls where designed and identify client-trust weaknesses.
3. Check denominators, exposure logging, timestamp/locale/version fields and missing/duplicate event rates.
4. Ensure content fields do not capture customer card text/photos or unnecessary PII.
5. Reconcile dashboard KPIs with event definitions and list metrics unsafe for causal inference.
6. Propose instrumentation tests and privacy-safe fixes.

## Failure / stop conditions

Unknown event semantics or content-sensitive payloads block trustworthy use until resolved.

## Verification

Critical KPI lineage is documented; instrumentation controls tested/source-verified; privacy gaps explicit.

## Outputs

Event/KPI lineage; integrity issues; privacy findings; instrumentation test/fix plan.

## References

- `docs/TEMPLATE_RANKING_ANALYTICS_0.4.3_STEP12.md`
- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
