# Lume Product Effectiveness

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** analytics
- **risk:** low
- **production_authority:** none

## When to use

Assess whether CardeLume reduces effort while improving first-generation satisfaction, purchase and recovery reliability.

## Allowed data

Aggregate/privacy-minimized funnel, first-direction selection, regeneration/critic/fallback, paid conversion, errors, latency and benchmark quality.

## Authority and write boundary

Read-only analytics/reporting; may propose experiments. Does not change production behavior or pricing.

## Procedure

1. Define the product question and denominator before reading metrics.
2. Report brief→generation→direction selection→finish→checkout→verified paid→download/recovery funnel.
3. Pair conversion with creative-quality indicators so weak premium output is not rewarded by a short-term metric alone.
4. Analyze first-generation selection, regeneration/repair, fallback, errors and latency by locale/device/occasion only at privacy-safe aggregate levels.
5. Identify friction that makes the customer think/design more, and propose the smallest experiment.
6. State attribution limits and avoid causal claims from observational changes.

## Failure / stop conditions

Do not expose customer message/photo content; do not treat correlation as causation or raw conversion as the sole product objective.

## Verification

Metric definitions/denominators explicit; privacy minimized; quality and business outcomes considered together.

## Outputs

Effectiveness scorecard; funnel/friction findings; quality-business synthesis; experiment candidates.

## References

- `docs/MASTER_SPEC_V7.md`
- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
