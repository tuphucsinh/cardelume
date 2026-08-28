# CardeLume — Hermes-ready Step17J Project

**Release:** `0.4.3-step.17j`
**Baseline:** Material Magic, Gallery Power & Premium Convergence
**Status:** source/offline validated; production `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES`.

CardeLume is a premium international AI greeting-card product:

```text
small brief
→ CardeLume intelligence
→ 3 genuinely different premium directions
→ choose
→ minimal finishing
→ preview
→ pay once
→ secure JPG/PDF
```

## Hermes project structure

This repository is already scaffolded for direct attachment as a Hermes Desktop Project:

```text
cardelume/
├── AGENTS.md
├── README.md
├── HANDOFF.md
├── MASTERPLAN.MD
├── tasks.md
├── .ai/
│   ├── MASTER_PLAN.md
│   ├── DECISIONS_LOG.md
│   ├── ARCHITECT.md
│   ├── UI_UX.md
│   └── KNOWN_BUGS.md
├── .hermes/
├── .lumer/
├── apps/                 # monorepo applications: web + worker
├── packages/             # shared core/db/renderer/templates/etc.
├── tests/
├── public/               # app-level public assets live under apps/web/public
├── data/
└── .tmp/
```

CardeLume is a monorepo, so `apps/ + packages/` intentionally replace a generic single `src/` folder. Do **not** restructure merely to fit a generic scaffold.

## Start here on Pi5

1. `AGENTS.md`
2. `HANDOFF.md`
3. `MASTERPLAN.MD`
4. `tasks.md`
5. `docs/PI5_HERMES_SETUP.md`
6. `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`

Quick verification:

```bash
sha256sum -c PROJECT_SHA256SUMS.txt
npm run check:fast
npm run check:release
npm run check:status
```

## Governance commands

```bash
npm run check:fast
npm run check:release
npm run check:status
npm run check:heavy
```

The registry in `governance/check-registry.mjs` is the execution authority. Historical Step-specific command lists are not the normal workflow.

## Important current state

- 0 templates are production-approved by design.
- `pnpm-lock.yaml` is intentionally absent until Step18 candidate-lock generation/review.
- full build/runtime/provider/browser/HA claims are intentionally not made yet.
- current migration head: `0011_funnel_and_launch_approvals.sql`.

## Detailed specifications

Canonical documents include:

- `docs/MASTER_SPEC_V7.md`
- `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
- `docs/PREMIUM_EXPERIENCE_CONVERGENCE_0.4.3_STEP17I.md`
- `docs/AI_CREATIVE_DIRECTOR_0.4.3_STEP13.md`
- `docs/TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md`
- `docs/PREMIUM_BENCHMARK_LAB_SPEC_V1.md`
- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`
- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
- `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`
- `docs/DEPLOY_PI5.md`
- `docs/DEPLOY_VPS.md`
- `docs/FAILOVER_TEST_PLAN.md`

See `docs/SPEC_INDEX_V7.md` and `docs/HISTORY_INDEX.md` for the broader documentation map.

## Step17J current product delta

- `docs/MATERIAL_MAGIC_GALLERY_PREMIUM_CONVERGENCE_0.4.3_STEP17J.md`
- `docs/VALIDATION_REPORT_0.4.3_STEP17J.md`
- `docs/STEP17J_HERMES_LUMER_HANDOFF.md`
- `quality/template-audit/STEP17J_PORTFOLIO_TARGET.md`

Step17I remains historical source evidence. Step17J is the current product/UX authority before Step18 runtime validation.
