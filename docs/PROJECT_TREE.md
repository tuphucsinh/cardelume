# CardeLume Current Project Map — Step 17I

This file intentionally shows **current operational structure**, not every historical document. Historical status/validation copies are indexed in `HISTORY_INDEX.md` and preserved in prior frozen baselines.

```text
apps/
  web/                 customer UI, APIs, admin, health/readiness
  worker/              AI generation, final render, cleanup, heartbeat
packages/
  ai/                  provider + Creative Director orchestration
  card-schema/         structured CardDocument contracts
  core/                product/domain utilities
  db/                  migrations + authoritative persistence
  queue/               durable pg-boss boundary
  renderer/            deterministic SVG/JPG/PDF rendering
  storage/             trusted upload/R2/final asset boundary
  templates/           managed catalog, ranking, renderer capabilities
  ui/                  shared UI primitives
benchmarks/premium/     Golden Set + benchmark fixtures/results schema
experiments/            non-production concepts/registry
security/               ASVS/IP/SBOM/provenance policies and reports
governance/             FAST / RELEASE / HEAVY check registry + execution standard
scripts/                focused probes + operational tools + unified governance runner
.hermes/                project-local operator skills/workflows/context
.lumer/                 canonical Lumer policies/bundle templates
infra/                  tunnel/watchdog/deployment support
docs/                   current specs/runbooks + retained detailed domain docs
quality/
  governance/           consolidated latest suite reports
  standards/            template/font quality standards
  template-audit/       current human review/preview evidence
```

## Current entry points

- Product authority: `docs/MASTER_SPEC_V7.md`
- Architecture: `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`
- Governance execution: `governance/README.md`
- Current validation: `docs/VALIDATION_REPORT_0.4.3_STEP17I.md`
- Runtime next step: `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`
- Historical evidence policy: `docs/HISTORY_INDEX.md`
