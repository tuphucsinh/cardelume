# CardeLume Step17I — Hermes / Lumer Handoff

## Current baseline

Release identity:

```text
0.4.3-step.17i
```

Current source/offline baseline:

```text
STEP17I_PREMIUM_EXPERIENCE_CONVERGENCE
```

Step17I is the current source authority before controlled Step18 runtime validation.

## Read first

1. `docs/MASTER_SPEC_V7.md`
2. `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
3. `docs/PREMIUM_EXPERIENCE_CONVERGENCE_0.4.3_STEP17I.md`
4. `governance/README.md`
5. `docs/VALIDATION_REPORT_0.4.3_STEP17I.md`
6. `docs/KNOWN_ISSUES.md`
7. `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`
8. `docs/HISTORY_INDEX.md`

## Source validation commands

Use the compressed governance entry points rather than replaying historical Step command lists:

```bash
npm run check:fast
npm run check:release
npm run check:status
npm run check:heavy
```

`check:fast` and `check:release` are source/offline gates. `check:status` reports unresolved runtime/owner evidence. `check:heavy` may legitimately report runtime blockers in an artifact environment without the frozen workspace/runtime dependencies.

Focused scripts remain available for debugging a failing invariant.

## Step17I product invariants

Preserve all of the following:

- small brief → three directions → minimal finish → pay once → secure final;
- production customer/marketing template surfaces are approved-only;
- raw `creativeThesis` is internal and must not be shown to customers;
- only bounded customer-safe `customerRationale` may be displayed;
- relationship starts neutral/optional;
- photo remains optional;
- no template browsing/marketplace in the customer flow;
- Finish remains bounded and reversible after automated wording edits;
- no automatic template approval;
- no hosted-share promise without a secure entitlement-aware backend;
- payment/recovery authority remains server-side and unchanged.

## Owner/human gates

Do not auto-close or fabricate evidence for:

- template Premium/WOW/originality approval;
- font/brand/template IP provenance;
- legal/native-language approval;
- real-model Golden human scoring.

There are currently zero production-approved templates by design.

## Next step: Step18 controlled runtime validation

Step18 should use this Step17I baseline and, on a controlled environment with registry/services available:

1. generate/review `pnpm-lock.yaml` and freeze the dependency graph;
2. install frozen dependencies, full `typecheck/build/test`, resolved SBOM/vulnerability scan;
3. apply migrations `0001 → 0011` on isolated staging and validate RLS;
4. run real pg-boss/R2/photo/final-render/recovery paths;
5. run Dodo test-mode checkout → signed webhook → PAID → fulfillment/replay cases;
6. run premium-model Golden benchmark + human Premium/WOW/diversity scoring;
7. capture exact shipped font version/binary/hash/license evidence;
8. perform native-language, browser/mobile, keyboard/screen-reader/zoom and performance QA;
9. measure real generation/render latency and capacity;
10. validate CSP enforcement and production admin edge identity.

Do not mark any of these PASS from source appearance alone.

## Production boundary

Step17I remains:

```text
SOURCE/OFFLINE candidate until final validation is recorded
PRODUCTION NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES
```
