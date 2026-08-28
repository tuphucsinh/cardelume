#!/usr/bin/env bash
set -euo pipefail
echo "CardeLume Pi5 bootstrap helper"
echo "Architecture: $(uname -m)"
if [ "$(uname -m)" != "aarch64" ] && [ "$(uname -m)" != "arm64" ]; then
  echo "WARN: expected ARM64 for Raspberry Pi 5."
fi
command -v docker >/dev/null || { echo "Install Docker Engine + Compose plugin first."; exit 1; }
[ -f .env ] || cp .env.example .env
echo "1) Fill .env with production values."
echo "2) docker compose up -d --build web"
echo "3) docker compose --profile worker --profile tunnel up -d --build"
echo "4) install infra/watchdog/cardelume-watchdog.service after validating tunnel."
