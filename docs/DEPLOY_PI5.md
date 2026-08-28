# Deploy — Raspberry Pi 5

## Assumptions

- Pi 5 8 GB
- 64-bit OS
- NVMe
- active cooling
- Ethernet
- Docker Engine + Compose plugin
- UPS recommended

## Extract

Recommended destination:

```bash
sudo mkdir -p /opt/cardelume
sudo chown "$USER":"$USER" /opt/cardelume
unzip CARDELUME_BASELINE_0.4.0_LAUNCH_POLISH_HERMES_HANDOFF.zip -d /opt/cardelume
cd /opt/cardelume/CARDELUME_BASELINE_0.4.0_LAUNCH_POLISH
cp .env.example .env
```

Fill `.env`.

Pi initial concurrency:

```text
AI_PLAN_CONCURRENCY=3
ARTWORK_CONCURRENCY=1
PREVIEW_RENDER_CONCURRENCY=2
FINAL_RENDER_CONCURRENCY=1
```

Benchmark before raising.

## Bring up web first

```bash
docker compose up -d --build web
curl -fsS http://127.0.0.1:3000/health/live
```

## Start worker + shared tunnel

After DB/R2/Tunnel credentials are valid:

```bash
docker compose --profile worker --profile tunnel up -d --build
```

## Watchdog

After tunnel failover is manually verified, edit the systemd service path so `ExecStart` points to the extracted project, then:

```bash
sudo cp infra/watchdog/cardelume-watchdog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cardelume-watchdog
```

## Firewall

Do not expose app port 3000 publicly.

The compose host binding is:

```text
127.0.0.1:3000
```

Cloudflared creates outbound connections.

## Verify

```bash
bash scripts/doctor.sh
docker logs --tail 100 cardelume-web
docker logs --tail 100 cardelume-cloudflared
```
