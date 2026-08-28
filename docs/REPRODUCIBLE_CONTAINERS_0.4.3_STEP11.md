# CardeLume 0.4.3 Step 11 — Reproducible Containers & HA Preflight

## DONE

- Web and worker Docker builds now require `pnpm-lock.yaml` and use `pnpm install --frozen-lockfile`.
- Added `scripts/freeze-dependencies.sh` to generate/review/freeze the lockfile and its SHA-256 before image build.
- Node base image is pinned to exact Node 22.22.3 Bookworm Slim plus multi-platform index digest.
- Cloudflared is pinned to 2026.8.2 plus its multi-platform index digest.
- Web/worker images remain multi-architecture for Pi5 ARM64 and Oracle/VPS AMD64.
- Added `test:containers` source guard so future edits cannot silently reintroduce floating images or non-frozen installs.

## Intentional build gate

This artifact does **not** invent a `pnpm-lock.yaml`. The current artifact environment cannot reach npm/Corepack. Run `scripts/freeze-dependencies.sh` once in the controlled Hermes/Pi environment with registry access, review the generated lockfile, then commit/use it for all subsequent Docker builds.

A Docker build before that step should fail. This is deliberate: nondeterministic production dependency resolution is worse than an explicit preflight failure.

## Remaining external gates

All remaining work requires the actual runtime/services: dependency resolution, semantic build/tests, migrations, credentials, real E2E, Cloudflare failover, backup restore, legal approval and browser/native-language QA.
