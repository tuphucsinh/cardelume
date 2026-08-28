#!/usr/bin/env bash
set -euo pipefail
echo "CardeLume VPS bootstrap helper"
echo "Architecture: $(uname -m)"
command -v docker >/dev/null || { echo "Install Docker Engine + Compose plugin first."; exit 1; }
[ -f .env ] || cp .env.example .env
echo "Set low worker concurrency in VPS .env if the VPS is small."
echo "Then: docker compose --profile worker --profile tunnel up -d --build"
