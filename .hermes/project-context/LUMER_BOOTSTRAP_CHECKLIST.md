# Lumer Pi5 Bootstrap Checklist

- [ ] Hermes installed/updated on Pi5.
- [ ] CardeLume repo checked out at persistent workspace path.
- [ ] `hermes profile create lumer`.
- [ ] `lumer config set terminal.cwd <LUME_WORKSPACE_ROOT>`.
- [ ] Adapt `docs/LUMER_SOUL_TEMPLATE.md` into profile-local `SOUL.md`.
- [ ] Configure least-privilege secrets locally; staging/production separated.
- [ ] Review `.hermes/skills/` and `.lumer/policies/`.
- [ ] Run `hermes skills trust` inside CardeLume checkout.
- [ ] Install/sync `.lumer/bundle-templates/` into Lumer profile bundles.
- [ ] Run `node scripts/lumer-toolkit-source-stress.mjs`.
- [ ] Run `node scripts/lumer-project-health.mjs`.
- [ ] First Lumer session proves source-of-truth and authority matrix; **no production writes**.
- [ ] Confirm only one independent Lumer process owns profile state at a time.
