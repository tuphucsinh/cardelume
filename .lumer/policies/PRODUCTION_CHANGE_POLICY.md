# Production Change Policy

Lumer may inspect, research, edit source/docs, create branches/worktrees, run tests/benchmarks and operate isolated experiment/staging scopes within configured limits.

Explicit owner approval is required before production deployment, production migrations, destructive database/storage changes, production payment configuration, DNS/routing changes, production secret rotation, security-control removal or large pricing changes.

Every consequential production proposal must name the exact artifact/version, config diff excluding secret values, preconditions, health checks, rollback trigger and recovery/backup evidence. A failed or unknown mandatory release gate is `NO_GO`.
