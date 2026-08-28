#!/usr/bin/env bash
set -euo pipefail

echo "== CardeLume doctor =="
uname -a || true
echo
command -v docker >/dev/null && docker --version || echo "WARN: docker missing"
command -v node >/dev/null && node --version || echo "INFO: node not required on host when using Docker"
command -v curl >/dev/null && curl --version | head -1 || echo "WARN: curl missing"

echo
if [ -f .env ]; then
  echo ".env: present"
else
  echo "WARN: .env missing (copy .env.example)"
fi

echo
if curl -fsS --max-time 2 http://127.0.0.1:3000/health/live >/dev/null 2>&1; then
  echo "web /health/live: OK"
else
  echo "web /health/live: not reachable"
fi
if curl -fsS --max-time 3 http://127.0.0.1:3000/health/ready >/dev/null 2>&1; then
  echo "web /health/ready: OK (DB + worker fleet)"
else
  echo "WARN: web /health/ready: not ready"
fi
if curl -fsS --max-time 3 http://127.0.0.1:3000/health/worker >/dev/null 2>&1; then
  echo "worker heartbeat: OK"
else
  echo "WARN: worker heartbeat missing/stale"
fi

echo
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null || true
