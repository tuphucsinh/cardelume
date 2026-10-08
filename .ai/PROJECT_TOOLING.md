# PROJECT_TOOLING — CardeLume (Mika-owned project data, not authority)

Bindings used by the mika-v3 execution protocol. Runner/reviewer never edit this file.
Updated: 2026-10-08 (CL2)

| Item | Project value |
|---|---|
| Control lock / atomic state | `flock /home/pi5/projects/cardelume/.state/control.lock` (atomic JSON write via python `os.replace`); single-Mika-writer fallback permitted |
| Authoritative state | `/home/pi5/projects/cardelume/.state/agent-state.json` (`BASE_SHA` source) |
| Task test wrapper | `pnpm run test` (turbo test, 11 packages). Focused: `TSX_DISABLE_CACHE=1 node --import tsx scripts/<file>` (`.ts`) or `node scripts/<file>` (`.mjs`) |
| Lint/static | `pnpm run lint` |
| Typecheck | `pnpm run typecheck` |
| Build | `pnpm run build` |
| Browser verify | Playwright (python, `HOME=/home/pi5 python3`), harness kept OUTSIDE repo under the declared evidence dir; real Chrome `/usr/bin/google-chrome` |
| Secret scan | `node scripts/security-governance.mjs secret-scan` (+ literal grep of owned diff) |
| Disposable verification paths (allowlist) | `.next/`, `.turbo/`, `apps/*/.next/`, `packages/*/.turbo/`, `node_modules/`, `.tmp/`, `coverage/`, `*.tsbuildinfo` |
| Runner watchdog (tri-state) | `pgrep -af 'agy-run|opencode|coder|commandcode'` + task-WT readability → `LIVE/DEAD/UNKNOWN` |
| `PUBLISH_REFRESH_TIMEOUT` | 15m |
| Exclusive-all lock | `MACHINE_EXCLUSIVE` (unused) |
| `CANONICAL_BRANCH` | `cl2-release` (release line, forked from `origin/main` = `e476ad7`). Local `main` (`a73546a`) is frozen/diverged pending OWNER-01 |
| `RUNNER_WT_ROOT` | `/home/pi5/projects/cardelume-worktrees` |
| `INTEGRATION_WT_ROOT` | `/home/pi5/projects/cardelume-integration` |
| Evidence destination | `/home/pi5/hermes-artifacts/cardelume-cl2/<TASK-ID>/` |
| `MAX_PARALLEL_RUNNERS` | 1 (Pi5 8GB, headroom-checked; max 2 only if `free -m` available ≥ 2500MB and temp < 70°C) |
| `MAX_CANDIDATE_VERIFIERS` | 1 |
| `CHROME_BIN` | `/usr/bin/google-chrome` |
| Runtime checkout (deployed) | `/home/pi5/projects/cardelume-fastship-clone` (systemd `cardelume-web.service`, `cardelume-worker.service`) |
| Local DB (read-only probes) | `docker exec cardelume-db-local psql -U cardelume_dev -d cardelume_dev` (wrap in `BEGIN READ ONLY`) |
