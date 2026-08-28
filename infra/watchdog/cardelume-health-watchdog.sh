#!/usr/bin/env bash
set -u

HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/health/ready}"
TUNNEL_CONTAINER="${TUNNEL_CONTAINER:-cardelume-cloudflared}"
INTERVAL="${WATCHDOG_INTERVAL:-3}"
FAIL_THRESHOLD="${FAIL_THRESHOLD:-3}"
RECOVERY_THRESHOLD="${RECOVERY_THRESHOLD:-3}"

fails=0
successes=0

log(){ logger -t cardelume-watchdog "$*" 2>/dev/null || echo "cardelume-watchdog: $*"; }

while true; do
  if curl -fsS --max-time 1.5 "$HEALTH_URL" >/dev/null 2>&1; then
    fails=0
    successes=$((successes+1))
    if [ "$successes" -ge "$RECOVERY_THRESHOLD" ]; then
      if ! docker inspect -f '{{.State.Running}}' "$TUNNEL_CONTAINER" 2>/dev/null | grep -q true; then
        log "app stable; starting tunnel replica"
        docker start "$TUNNEL_CONTAINER" >/dev/null 2>&1 || true
      fi
      successes="$RECOVERY_THRESHOLD"
    fi
  else
    successes=0
    fails=$((fails+1))
    if [ "$fails" -ge "$FAIL_THRESHOLD" ]; then
      if docker inspect -f '{{.State.Running}}' "$TUNNEL_CONTAINER" 2>/dev/null | grep -q true; then
        log "app unhealthy; stopping tunnel replica so the other node can serve"
        docker stop -t 2 "$TUNNEL_CONTAINER" >/dev/null 2>&1 || true
      fi
      fails="$FAIL_THRESHOLD"
    fi
  fi
  sleep "$INTERVAL"
done
