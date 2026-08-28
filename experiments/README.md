# CardeLume Experiment Registry

This directory is the version-controlled registry for bounded CardeLume experiments. Production customer data is not the default corpus.

- `registry.json` — experiment metadata/status.
- `feature-flags.json` — new flags; every new customer-facing flag defaults OFF.
- `records/<id>.json` — detailed experiment record created by `scripts/experiment-lab.mjs create`.
- `results/<id>/` — non-secret reports/evidence. Large/raw benchmark outputs remain ignored unless intentionally frozen.

## Lanes

`development → experiment → staging → production`

Promotion tooling only evaluates evidence. It never deploys production. Production promotion remains explicit-owner-approval gated.
