# Cloudflare Shared Tunnel — Phase-1 Free HA

Goal:

> Pi5 OR VPS alive → public web remains available.

## Model

```text
Cloudflare
   |
shared Tunnel UUID
  / \
Pi5  VPS
```

Both machines run `cloudflared` with the same remotely-managed Tunnel token.

## Dashboard setup

Create one production Tunnel, for example:

```text
cardelume-prod
```

Configure the public hostname:

```text
cardelume.com
```

Service URL for the Docker topology in this package:

```text
http://web:3000
```

Why `web`:

- `cloudflared` and `web` are on `cardelume-net`
- Docker DNS resolves the Compose service name `web`
- application port stays private

Before using production DNS, test with a temporary hostname/subdomain.

## Pi5

Set:

```text
TUNNEL_TOKEN=<same production tunnel token>
```

Then:

```bash
docker compose --profile tunnel up -d cloudflared
```

## VPS

Use the same Tunnel token:

```text
TUNNEL_TOKEN=<same production tunnel token>
```

Then:

```bash
docker compose --profile tunnel up -d cloudflared
```

Verify the Tunnel dashboard shows multiple connected replicas/connectors.

## Application-aware failover

Shared replicas protect connector/host/network availability. To cover:

```text
host alive
cloudflared alive
Next.js dead
```

install the local watchdog.

It checks:

```text
http://127.0.0.1:3000/health/live
```

After consecutive failures it stops local `cardelume-cloudflared`, forcing that node to leave the shared Tunnel.

When the local web app is stable again, watchdog starts cloudflared and the node rejoins.

## Important limitation

This free architecture does not guarantee:

```text
Pi primary
VPS standby
```

When both are connected, either may receive requests.

Therefore:

- no correctness depends on sticky sessions
- no in-memory user session as source of truth
- files not local-only
- durable jobs in DB
- payments/idempotency in DB

## Paid upgrade

When deterministic origin steering becomes necessary:

```text
shared Tunnel
↓
Pi independent Tunnel
VPS independent Tunnel
↓
Cloudflare Load Balancer
```

No application rewrite required.
