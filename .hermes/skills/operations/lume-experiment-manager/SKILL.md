# Lume Experiment Manager

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** medium
- **production_authority:** none

## When to use

Create/manage a bounded CardeLume experiment for template, model, prompt, ranking, threshold, Studio UI or pricing work.

## Allowed data

Experiment spec, synthetic/staging data, feature flags, staging service scopes, benchmark inputs and bounded AI budgets.

## Authority and write boundary

May create branch/worktree, registry entry, experiment flags, isolated fixtures and staging changes within configured quotas. Cannot promote experiment behavior to production.

## Procedure

1. Write hypothesis, primary quality/business metric, guardrails and stop criteria.
2. Create unique experiment ID, branch/worktree and registry entry.
3. Confirm non-production DB/storage/analytics/payment mode and AI budget ceiling before execution.
4. Add a default-off feature flag and kill switch.
5. Run relevant source tests, Golden benchmark subset/full set and staging checks.
6. Record cost, quality, risks, sample sizes and confounders.
7. End with PROMOTE_CANDIDATE, ITERATE or ARCHIVE. Promotion means prepare release evidence only.

## Failure / stop conditions

Stop if isolation cannot be proven, budget guard is missing, production credentials/objects may be touched, or experiment lacks a kill switch.

## Verification

Experiment ID/branch/flag/scopes are documented; no production state changed; results are reproducible; promotion path is approval-gated.

## Outputs

Experiment registry entry; hypothesis; isolation proof; result report; promotion/iterate/archive recommendation.

## References

- `docs/EXPERIMENT_STAGING_LAB_SPEC_V1.md`
- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
