# Lume Performance Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** medium
- **production_authority:** none

## When to use

Investigate latency, throughput, memory/CPU, render duration, queue staleness or provider performance without trading away premium quality.

## Allowed data

Aggregate timings, resource metrics, traces, queue metrics, benchmark latency/cost and synthetic load-test results.

## Authority and write boundary

May benchmark/profile in dev/experiment/staging and propose code/config changes. No production load test or config tuning without explicit scope/approval.

## Procedure

1. Define user-visible SLO/metric and baseline; separate web, AI, queue, render, storage and payment latency.
2. Measure P50/P95/P99 and concurrency/resource saturation with synthetic/reference-safe workloads.
3. Correlate regressions with release/model/template/render changes.
4. Optimize the dominant bottleneck first; preserve deterministic render, security and premium model quality floors.
5. Re-run Golden/quality checks for AI/model/prompt optimizations.
6. Document expected capacity on ARM64 Pi5 and AMD64 fallback separately when possible.

## Failure / stop conditions

Do not recommend a cheaper/weaker model solely for latency if premium quality floor regresses; do not stress production destructively.

## Verification

Before/after metrics are comparable; quality/security gates unchanged; performance claim has measured evidence.

## Outputs

Latency/resource breakdown; bottleneck hypothesis; experiment proposal; measured before/after result.

## References

- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
- `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
