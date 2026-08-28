#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
command -v pg_dump >/dev/null || { echo "pg_dump is required" >&2; exit 1; }
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/cardelume-$stamp.dump"
umask 077
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$out"
sha256sum "$out" > "$out.sha256"
chmod 600 "$out" "$out.sha256" 2>/dev/null || true
echo "Backup created: $out"
echo "Keep backups outside the public web root and test restore to an isolated database."
