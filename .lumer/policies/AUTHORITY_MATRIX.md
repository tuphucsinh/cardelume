# Lumer Authority Matrix

| Layer | Examples | Default authority | Required evidence |
|---|---|---|---|
| Observe | source, public research, aggregate metrics/logs | autonomous | source/time/context |
| Prepare | docs/code/tests/branches/worktrees/reports | autonomous | tests/diff |
| Experiment | isolated experiment/staging within quotas | autonomous | isolation + budget + kill switch |
| Promote production | deploy, production migration, payment/DNS/routing/config | **owner approval required** | release audit + rollback/backup |
| Irreversible | delete production data, secret rotation, disable controls | **explicit owner approval + recovery evidence** | recovery proof + blast radius |

## Fail-closed rule

Missing evidence is `UNKNOWN`, not PASS. A skill may prepare a `GO_FOR_OWNER_APPROVAL` package but never reinterpret it as permission to deploy.

## Least privilege

General interactive Lumer sessions should not hold broad database superuser or unrestricted production credentials. Use narrow, time-bounded/operation-specific access where the deployment environment supports it.
