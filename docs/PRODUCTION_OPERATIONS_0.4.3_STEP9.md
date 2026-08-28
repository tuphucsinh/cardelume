# CardeLume 0.4.3 Step 9 — Production Operations Hardening

## Objective

Make the existing Pi5 + Oracle/VPS deployment fail closed when the shared production dependencies cannot safely accept/fulfil new purchases, without introducing paid infrastructure or a platform rewrite.

## Implemented

### DB-backed worker health

- Worker writes a heartbeat only after provider/R2 configuration preflight, deterministic renderer font preflight, pg-boss start, queue creation and cleanup schedule setup.
- Heartbeat contains node ID, release version and active tracked job count.
- AI generation, final rendering and cleanup jobs are activity-tracked.
- Graceful SIGTERM/SIGINT removes the heartbeat; crashed workers naturally become stale.
- Old heartbeat rows are cleaned by the maintenance job.
- Web readiness only accepts workers with the **same `APP_VERSION`** as the web release.

### Fail-closed readiness

`/health/live` remains process liveness only.

`/health/ready` now requires:

- `APP_MODE=live`,
- production DB + R2 + payment + generation secrets/config,
- supported non-mock AI provider,
- Dodo dynamic-price acknowledgement and product IDs for currencies CardeLume can expose,
- legal content approval gate,
- reachable database,
- at least one fresh same-version worker heartbeat.

Production health output intentionally does **not** enumerate missing secrets/configuration.

`/health/worker` is DB-backed and also suppresses fleet detail in production.

### App-level abuse guard

A server-only fixed-window DB limiter was added for expensive/financial entry points:

- generation start: default 12/hour per anonymous session,
- photo upload authorization: default 8/hour,
- checkout start: default 12/hour.

Limits are configurable. The limiter is atomic at the shared database so Pi and VPS enforce one shared count. Expired buckets are cleaned by the worker. This complements — it does not replace — Cloudflare edge rate limiting.

### Deployment / failover

- Local watchdog now probes `/health/ready` instead of `/health/live`.
- Web container healthcheck uses `/health/ready`; cloudflared therefore does not start before DB/worker/config readiness.
- `cloudflared` is pinned to `2026.7.3` instead of floating `latest`.
- Docker application tags and `APP_VERSION` are Step 9.
- `NODE_ID` is explicit in `.env.example` so Pi/VPS can be distinguished.

### Fail-closed dormant feature

Holiday Bundle remains intentionally OFF. If accidentally enabled before its multi-card purchase boundary exists, production config is not ready and checkout returns a launch-not-ready error rather than an implementation stub.

### Backup / restore rehearsal

- `scripts/backup-db.sh`: custom-format pg_dump, restrictive umask/permissions, SHA-256 sidecar.
- `scripts/restore-db.sh`: never defaults to `DATABASE_URL`; requires a separate `RESTORE_DATABASE_URL` and the exact confirmation string `YES_RESTORE_ISOLATED_DB`.
- Restore is for isolated rehearsal first; no script silently overwrites production.

## Explicit public-launch gates

`LEGAL_CONTENT_APPROVED=true` must not be set while the privacy/terms/refund pages are still placeholder or unapproved. This is intentionally an owner/legal-content decision, not something implementation code guesses.

Before public traffic, also configure Cloudflare edge rate limits for generation/upload/checkout/recovery and run the real HA failover matrix.

## Not claimed

This artifact environment cannot resolve `registry.npmjs.org`, so it cannot install pnpm/workspace dependencies or perform the full workspace semantic build. It also has no CardeLume production credentials. Therefore the following remain controlled-runtime validation, not claimed as complete:

- apply migrations through `0007_production_operations.sql`,
- `pnpm install`, lockfile generation/review, typecheck/build/full test suite,
- real Supabase/Postgres + pg-boss execution,
- real AI provider request,
- real R2 upload/sanitize/final render/download,
- real Dodo sandbox/live webhook/payment reconciliation,
- legal content replacement/approval,
- Cloudflare rules/tunnel/HA and backup restore rehearsal.
