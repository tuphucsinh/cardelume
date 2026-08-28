# Deploy — VPS Replica

The VPS is an independent replica, not a mandatory public gateway.

## Security baseline

- SSH key-only.
- Disable password login.
- Disable direct root login.
- App port 3000 stays loopback-only.
- Cloudflared outbound tunnel.
- Firewall default deny where practical.
- Production secrets remain only in host `.env` / secret manager.

## Small VPS worker tuning

Start with:

```text
AI_PLAN_CONCURRENCY=1
ARTWORK_CONCURRENCY=1
PREVIEW_RENDER_CONCURRENCY=1
FINAL_RENDER_CONCURRENCY=1
```

## Start

```bash
docker compose --profile worker --profile tunnel up -d --build
curl -fsS http://127.0.0.1:3000/health/live
```

Use the same Phase-1 Tunnel token/UUID as Pi5.

## Limitation of free shared-tunnel HA

When both replicas are healthy, shared Tunnel routing does not guarantee:

```text
Pi = primary
VPS = standby
```

Correctness must not depend on origin affinity.

Upgrade later to independent tunnels + Cloudflare Load Balancer if deterministic primary/fallback is required.
