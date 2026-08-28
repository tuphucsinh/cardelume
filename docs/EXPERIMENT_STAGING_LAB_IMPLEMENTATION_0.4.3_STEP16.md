# CardeLume 0.4.3 Step 16 — Experiment / Staging Lab Implementation

## Objective

Provide enforceable `development → experiment → staging → production` lanes so Lumer can test new templates, prompts, models, ranking, thresholds, UI and pricing without treating production customers or production services as the default experiment environment.

## Environment identity and runtime guard

`packages/core/src/environment.ts` requires explicit:

```text
APP_ENV=development|experiment|staging|production
```

The application does not infer lane authority from a URL or `NODE_ENV`.

### Production

- `APP_MODE=live`;
- Dodo must be `live_mode`;
- DB/R2/analytics/recovery-secret/AI-budget scope tags must be `production`;
- `EXPERIMENT_ID` is forbidden.

### Experiment / staging

- `APP_MODE=live` for production-like integration;
- Dodo must be `test_mode`;
- DB/R2/analytics/recovery/AI budget scopes must explicitly match the lane;
- Cloudflare hostname scope must match the lane;
- R2 object prefix is mandatory and lane-prefixed;
- analytics namespace must identify the lane;
- `ALLOW_PRODUCTION_WRITES` is rejected;
- optional guard variables detect accidental reuse of the known production DB/bucket.

The worker asserts isolation before queue startup. Web readiness includes isolation validation. The Dodo checkout path independently asserts APP_ENV/payment-mode compatibility.

## R2 namespace enforcement

`@cardelume/storage` now supports `R2_OBJECT_PREFIX`. All private put/get/head/delete/signed-upload/signed-download operations go through the same scoped-key function.

Production may retain the existing unprefixed layout. Experiment/staging must provide an explicit lane prefix such as:

```text
experiment/<experiment-id>/...
staging/cardelume/...
```

## Feature flags

`packages/core/src/experiment.ts` provides a bounded evaluator:

- every new definition has `defaultEnabled: false`;
- explicit environment allowlist;
- optional allowlist subject;
- deterministic percentage rollout;
- expiration date;
- per-flag kill switch;
- global `EXPERIMENT_KILL_SWITCH`;
- explicit environment variable enablement.

Flags do not grant production authority; production promotion remains a release/owner decision.

## Experiment registry and CLI

Version-controlled registry:

```text
experiments/
├── registry.json
├── feature-flags.json
├── records/
├── fixtures/
└── results/
```

`scripts/experiment-lab.mjs` supports:

- `create` — creates a record + default-OFF flag + bounded AI budget + kill switch;
- `validate` — validates registry/flag invariants;
- `worktree-create` — safely creates `exp/<id>` Git worktree under `.worktrees/` when used in an actual Git checkout;
- `promotion-check --to staging|production` — evaluates evidence only;
- `archive` — records the end state/reason.

The CLI never deploys production. A complete production evidence set yields at most `READY_FOR_OWNER_APPROVAL`.

## Promotion evidence contract

For staging/production promotion checks, non-secret evidence is stored under:

```text
experiments/results/<id>/promotion-evidence.json
```

Production preflight requires:

- objective build/tests;
- premium benchmark for creative changes;
- IP/provenance;
- security;
- migration/rollback plan;
- isolated staging E2E;
- production config diff review;
- verified kill switch;
- explicit owner approval after the preflight.

Missing mandatory evidence produces `NO_GO`.

## Test data

`experiments/fixtures/README.md` prohibits copying production customer photos/card copy/PII/recovery/payment content into convenience staging datasets. Synthetic/reference-safe fixtures are the default.

## AI budgets

Experiment/staging benchmark execution now requires explicit budget attribution and caps:

- `AI_EXPERIMENT_MAX_GENERATIONS_PER_RUN`;
- `AI_EXPERIMENT_MAX_CALLS_PER_RUN`;
- `AI_EXPERIMENT_DAILY_COST_USD`;
- `EXPERIMENT_ID` or `BENCHMARK_BUDGET_ID`.

The runner checks Step 13 worst-case bounded calls (director + one expansion + critic), records a local cost ledger, and stops future work when the local daily cap is exhausted. Provider/project-level caps remain recommended because local ledgers are not a substitute for provider-side account controls.

## Environment templates

Non-secret templates live under `config/environments/` for experiment, staging and production. Actual credentials remain outside Git.
