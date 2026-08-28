# Lume Competitive Pricing Research

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** research
- **risk:** low
- **production_authority:** approval-required

## When to use

Compare current public competitor pricing/packaging and inform CardeLume pricing experiments.

## Allowed data

Current official pricing/checkout pages, taxes/fees where publicly clear, public promotions with dates, review/customer feedback and CardeLume aggregate economics.

## Authority and write boundary

Research and experiment proposal only. Large or production pricing changes require owner approval and payment/config release controls.

## Procedure

1. Record competitor, country/currency, product type, unit/bundle/subscription structure, date and source.
2. Normalize carefully: digital vs physical, per-card vs subscription/credits, taxes/shipping, promotional vs standard price.
3. Separate list price from effective customer checkout price when verifiable.
4. Compare CardeLume value promise and unit economics without price-matching reflexively.
5. Propose bounded pricing experiments with guardrails and rollback; do not directly change production Dodo/payment config.

## Failure / stop conditions

If price cannot be verified for the target market/date, mark UNKNOWN; never infer checkout totals from unrelated countries.

## Verification

Sources and normalization assumptions are explicit; recommendations preserve premium positioning/economics; production price unchanged.

## Outputs

Pricing comparison; normalization notes; value-positioning insight; experiment candidate.

## References

- `docs/LUMER_SKILLS_TOOLKIT_SPEC_V1.md`
- `docs/EXPERIMENT_STAGING_LAB_SPEC_V1.md`
