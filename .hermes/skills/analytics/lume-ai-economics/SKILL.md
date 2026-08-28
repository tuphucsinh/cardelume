# Lume AI Economics

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** analytics
- **risk:** low
- **production_authority:** approval-required

## When to use

Compare AI model/provider/prompt economics while preserving premium/WOW and reliability floors.

## Allowed data

Golden benchmark quality/human review, model/provider telemetry, tokens, calls, latency, critic/expand/fallback, estimated cost and aggregate paid conversion.

## Authority and write boundary

May analyze and propose experiments/model routing in experiment/staging. Production model/provider changes require explicit owner approval through the release path.

## Procedure

1. Compare candidate models on the same Golden protocol and constants where practical.
2. Report premium/WOW and human quality dimensions before cost.
3. Report consistency, latency P50/P95, input/output tokens, calls/generation, critic/expand/fallback and estimated cost/generation.
4. Segment failures by locale/script/photo/difficulty to avoid averages hiding weak markets.
5. Estimate business impact using aggregate selection/paid outcomes only when exposure/confounders are understood.
6. Recommend cost optimization only when measurable quality remains above approved floor.

## Failure / stop conditions

Never choose model purely from internet benchmarks or cost. If human premium/WOW review is incomplete, quality winner is UNKNOWN.

## Verification

Same Golden Set/protocol; quality and cost both shown; premium/WOW separate; recommendation respects quality floor.

## Outputs

Model comparison table; quality/cost frontier; segment weaknesses; experiment/recommendation.

## References

- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
- `docs/AI_GENERATION_ECONOMICS_0.4.3_STEP13.md`
