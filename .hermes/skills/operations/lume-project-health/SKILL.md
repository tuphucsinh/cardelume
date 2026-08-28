# Lume Project Health

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** low
- **production_authority:** none

## When to use

Daily/adhoc read-only operational assessment of CardeLume web, worker, queue, data/services, backups, AI quality/economics and current experiments.

## Allowed data

Source/version metadata; health/readiness endpoints; queue depth/staleness; aggregate DB/R2/provider status; Dodo webhook/fulfillment errors; backup timestamps; aggregate AI/template metrics; feature flags.

## Authority and write boundary

Read-only by default. May write local reports. No production mutation, restart, migration, queue purge, secret rotation or flag change.

## Procedure

1. Establish current source version/commit and expected deployment topology.
2. Check web/worker readiness and version alignment.
3. Check queue depth, oldest job age, retry/dead-letter/failure indicators and worker heartbeat.
4. Check DB/R2/AI provider/Dodo health using least-privilege/read-only evidence.
5. Check backup freshness and latest restore-rehearsal evidence.
6. Report AI P50/P95, token/cost trends, critic/expand/fallback and Golden benchmark freshness.
7. Check template catalog coverage/health and experiment/feature flags.
8. Rank findings P0-P3 with evidence, impact, next action and whether approval is required.

## Failure / stop conditions

If required evidence is unavailable, report UNKNOWN rather than PASS. Do not “fix” production from the health skill.

## Verification

Report includes timestamp/source version; each finding has evidence; unknowns are explicit; production unchanged.

## Outputs

Severity-ranked health report; evidence matrix; unknowns; recommended next actions.

## References

- `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
