# HANDOFF — CardeLume Step17J → Pi5 / Step18

## Current state

**Release identity:** `0.4.3-step.17j`
**Baseline:** `STEP17J_MATERIAL_MAGIC_GALLERY_PREMIUM_CONVERGENCE`
**Status:** source/offline validated; production `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES`.

This package is prepared for direct extraction as a Hermes project on Raspberry Pi 5.

## What is complete

- premium consumer flow and Step17I UX convergence;
- AI Creative Director source architecture;
- 28 VisualDirections/render paths at source level;
- production customer template boundary is approved-only;
- payment/recovery/upload/queue source boundaries;
- privacy-minimized funnel analytics;
- template admin + immutable evidence-based launch approval;
- IP/security governance source;
- experiment/staging source isolation;
- Lumer project-local toolkit;
- compressed FAST/RELEASE/STATUS/HEAVY governance entry points.


## Step17J convergence summary

- Keep the 0.4.1-style premium gallery/showroom presentation.
- Target 16 families, prioritizing 10 from 0.4.1; status remains governed.
- Material Magic is automatic progressive enhancement: pointer/touch tilt, dynamic lighting, foil/paper depth, haptics where supported.
- Studio remains brief → 3 AI directions → minimal Finish. No template browser.
- AI ranking/Creative Director now sees material world, color world and energy for stronger diversity.
- Multi-market pricing stays 16 markets; Holiday Bundle logic is retained but UI hidden.
- English flagship typography: Cormorant Garamond + Plus Jakarta Sans.

## Step17J UX invariants

Preserve:

- material/folio hero and restrained signature reveal;
- no customer template marketplace;
- neutral relationship start;
- optional photo/print layout;
- `customerRationale` customer-safe only — no raw `creativeThesis`;
- wording refinement is reversible;
- Finish remains bounded;
- post-pay/recovery explicitly communicates JPG + print-ready PDF;
- no automatic template approval.

## Important current blockers

1. `pnpm-lock.yaml` intentionally absent; create/review a **new candidate lock** in Step18.
2. Full dependency-resolved typecheck/build/test not yet evidenced.
3. Zero production-approved templates by design.
4. Exact font binaries/hashes/licenses and brand asset evidence incomplete.
5. Real premium AI Golden benchmark + human review not run.
6. Staging migrations `0001→0011`, RLS, pg-boss, R2, Dodo and recovery E2E not run.
7. Browser/mobile/accessibility/performance/CSP enforcement not run.
8. Legal/native-language owner review pending.
9. Pi5 + Oracle/VPS HA/failover/restore not run.

## Immediate next actions

Follow `MASTERPLAN.MD`, starting with **PHASE 0**, then **PHASE 18**.

Do not jump to production deployment just because Pi5 can build the app.

## Current template gate

There are **0 approved production templates**. Use the Step17J 16-family portfolio target for owner/human review; do not auto-promote candidates.

## Recommended read order

1. `AGENTS.md`
2. `MASTERPLAN.MD`
3. `tasks.md`
4. `.ai/ARCHITECT.md`
5. `.ai/UI_UX.md`
6. `.ai/KNOWN_BUGS.md`
7. `docs/MASTER_SPEC_V7.md`
8. `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
9. `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`
10. `docs/VALIDATION_REPORT_0.4.3_STEP17I.md`

## Verification commands before editing

```bash
sha256sum -c PROJECT_SHA256SUMS.txt
npm run check:fast
npm run check:release
npm run check:status
```

A NO_GO runtime/owner status is expected until Step18 evidence exists.
