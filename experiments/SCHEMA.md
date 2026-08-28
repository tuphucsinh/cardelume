# Experiment Record Contract

Every experiment must record:

- `id`
- `owner` (`Lumer` or human owner)
- `hypothesis`
- `scope`
- `branchWorktree`
- `featureFlag`
- `startAt` / optional `endAt`
- `allowedEnvironments`
- `aiBudget.maxCallsPerRun`
- `aiBudget.maxBenchmarkGenerations`
- `aiBudget.dailyCostUsd`
- `successMetric`
- `premiumBenchmarkImpact`
- `securityIpReviewRequirements`
- `rollbackKillSwitch`
- `status`

Allowed statuses: `draft`, `running`, `candidate`, `staging`, `archived`, `rejected`, `promoted`.

`promoted` is a historical record only. The experiment CLI cannot perform production promotion.
