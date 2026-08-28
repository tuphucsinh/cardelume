# CardeLume Template Publish QA

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** creative
- **risk:** high
- **production_authority:** approval-required

## When to use

A template/version is being considered for production publication after creative implementation.

## Allowed data

Exact immutable template/version candidate, renderer evidence, benchmark report, premium review, provenance manifest, localization QA and release evidence.

## Authority and write boundary

May issue GO/NO-GO recommendation and prepare publication diff. **Owner approval checkpoint:** no production activation/publish may occur until owner explicitly approves after every mandatory gate passes.

## Procedure

1. Pin the exact template/version pair and verify the candidate reviewed is the candidate to publish.
2. Require renderer support, format/script/photo capability, sample final JPG/PDF parity and deterministic tests.
3. Require provenance/IP APPROVED for all production dependencies.
4. Require Premium Benchmark evidence and premium creative review; unresolved low-WOW is blocking.
5. Check localization, accessibility/contrast, copy-pressure tolerance and browser/mobile preview parity.
6. Verify no arbitrary asset/runtime code path bypasses the managed template renderer.
7. Prepare publish diff, monitoring signals, kill/archive path and rollback instructions.
8. Return GO_FOR_OWNER_APPROVAL or NO_GO; never self-promote.

## Failure / stop conditions

Any missing mandatory evidence, unknown license, critical render/localization/security defect, benchmark quality regression, or candidate/version mismatch => NO_GO.

## Verification

All gate artifacts point to the same immutable version; approval state is not production-active; rollback is documented.

## Outputs

Gate matrix; evidence links; exact version; NO_GO reasons or GO_FOR_OWNER_APPROVAL package.

## References

- `docs/TEMPLATE_ADMIN_RUNBOOK_0.4.3_STEP12.md`
- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`
