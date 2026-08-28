#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required and should point to an isolated restore-test database}"
: "${RESTORE_FILE:?RESTORE_FILE is required}"
[ "${RESTORE_CONFIRM:-}" = "YES_RESTORE_ISOLATED_DB" ] || { echo "Refusing restore. Set RESTORE_CONFIRM=YES_RESTORE_ISOLATED_DB after verifying the target is isolated." >&2; exit 2; }
if [ -n "${DATABASE_URL:-}" ] && [ "$RESTORE_DATABASE_URL" = "$DATABASE_URL" ]; then echo "Refusing restore: RESTORE_DATABASE_URL matches DATABASE_URL." >&2; exit 2; fi
[ -f "$RESTORE_FILE" ] || { echo "Restore file not found" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "pg_restore is required" >&2; exit 1; }
if [ -f "$RESTORE_FILE.sha256" ]; then (cd "$(dirname "$RESTORE_FILE")" && sha256sum -c "$(basename "$RESTORE_FILE").sha256"); fi
pg_restore --dbname="$RESTORE_DATABASE_URL" --no-owner --no-acl --clean --if-exists "$RESTORE_FILE"
echo "Restore completed. Run migrations/health/integrity checks against this isolated database before considering any production recovery action."
