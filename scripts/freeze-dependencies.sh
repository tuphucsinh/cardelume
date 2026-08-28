#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v corepack >/dev/null || { echo "corepack is required" >&2; exit 1; }
corepack enable
corepack pnpm install --lockfile-only
[ -s pnpm-lock.yaml ] || { echo "pnpm-lock.yaml was not generated" >&2; exit 1; }
corepack pnpm install --frozen-lockfile
sha256sum pnpm-lock.yaml > pnpm-lock.yaml.sha256
echo "Dependency lock frozen. Review pnpm-lock.yaml and its checksum before building images."
