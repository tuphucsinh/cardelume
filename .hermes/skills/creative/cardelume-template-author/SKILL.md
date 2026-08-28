# CardeLume Template Author

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** creative
- **risk:** medium
- **production_authority:** approval-required

## When to use

Create or materially revise an original CardeLume template family or controlled variant for experiment/staging evaluation.

## Allowed data

Product specs, approved market research notes, renderer contracts, synthetic Golden briefs, approved-font/asset manifests, aggregate benchmark results. Never customer photos/messages as design references.

## Authority and write boundary

May create source files, tests, render fixtures, experiment branches/worktrees and staging candidates. May not publish a template to production, alter production catalog state, or introduce unverified assets. **Owner approval checkpoint:** production publish occurs only after publish-QA, IP, benchmark and release evidence are complete.

## Procedure

1. Define the business/market need and the emotional job of the card; do not start from a competitor layout.
2. Convert research into abstract design principles, then write an original creative thesis and one recognisable signature move.
3. Choose or create a template family; specify design DNA, negative-space strategy, typography hierarchy, photo mode, scripts/formats and bounded controlled variants.
4. Implement only through renderer-safe, typed capabilities. Never inject arbitrary model-authored CSS/SVG into the trusted production renderer.
5. Build a sample stress matrix: short/medium/long copy; EN/VI and relevant CJK/Hangul; photo/no-photo; mobile preview; JPG/PDF final.
6. Run typography, overflow, contrast/WCAG, renderer parity and deterministic-output checks.
7. Record provenance for every font/image/illustration/ornament/texture dependency. Unknown provenance means stop.
8. Run the Premium Benchmark subset and premium-review skill. Compare portfolio similarity and anti-sameness metrics.
9. Produce a publish candidate with explicit reference-similarity check and rollback/archive plan.

## Failure / stop conditions

Stop on unknown license/provenance, renderer incompatibility, critical localization/overflow defect, substantial similarity to a reference, missing benchmark evidence, or any request to bypass publish approval.

## Verification

Template/version IDs are immutable where required; renderer tests pass; sample matrix has evidence; IP verdict is approved; premium review has no blocking finding; benchmark result is attached; production remains unchanged.

## Outputs

Template family/name; creative thesis; design DNA; signature move; target priors; photo/text/script/format capability; controlled variants; provenance declaration; render matrix; benchmark/premium-review report; publish-candidate decision.

## References

- `docs/LUMER_SKILLS_TOOLKIT_SPEC_V1.md`
- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`
- `docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md`
