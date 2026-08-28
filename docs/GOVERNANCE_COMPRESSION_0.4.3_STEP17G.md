# CardeLume 0.4.3 Step 17G — Governance Compression

## Objective

Reduce developer/release ceremony without weakening production safety.

Step 17F accumulated many Step-specific aliases, status reports, handoffs and per-check logs. The underlying focused probes were useful; the duplicated orchestration around them was becoming a source of drift.

## Decision

Governance now has three stable execution tiers:

- **FAST** — frequent source-change invariants;
- **RELEASE** — authoritative source/offline promotion coverage;
- **HEAVY** — RELEASE plus deterministic render stress and optional frozen build checks in a dependency-ready runtime.

The single registry is `governance/check-registry.mjs`; the runner is `scripts/governance-runner.mjs`.

## What changed

- Root command surface compressed to `check:fast`, `check:release`, `check:heavy`, `check:status`.
- Step-specific aggregate aliases (`test:step17c/d/e/f`, etc.) removed.
- Focused payment/upload/queue/template/IP/security/operations probes remain independent for failure isolation.
- Consolidated reports are written under `quality/governance/`; one-log-per-probe output is no longer persisted by default.
- Superseded `UPGRADE_STATUS_*`, old Step validation copies, freeze summaries and handoffs were removed from the current baseline. Prior frozen archives remain the historical evidence source.
- Validators that encoded release names instead of invariants were corrected. Deployment now derives release identity from `package.json`; Lumer validates governance-registry coverage rather than requiring a dedicated package alias.
- Dodo webhook contract import was made directly runnable under Node strip-types for offline RELEASE coverage.

## Coverage preserved

RELEASE continues to cover:

- customer/product integration;
- AI Creative Director authority;
- exact payment boundary + Dodo signature contract;
- trusted photo upload;
- durable generation queue/fallback/recovery;
- managed template catalog/version/event capability;
- font/template standards, multilingual V2 and experiment templates;
- IP/provenance;
- security/retention;
- experiment/staging isolation;
- operations/readiness/backup/container/deployment;
- Lumer toolkit;
- Premium Benchmark source contract.

HEAVY additionally contains renderer/typography/photo stress probes; dependency-requiring probes are explicitly `BLOCKED_RUNTIME` until Step18 frozen install rather than being misreported as source failures.

## Safety invariant

Compression removes duplication, **not gates**.

`SOURCE PASS` remains distinct from frozen build, staging E2E, human Premium/WOW/originality review, legal approval, exact font provenance, real-model benchmark, CSP/browser validation, payment/R2/pg-boss E2E, backup restore and Pi5/Oracle HA.
