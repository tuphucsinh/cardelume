# Pi5 + Hermes Setup — CardeLume Step17I

## Recommended directory

```bash
mkdir -p ~/projects
cd ~/projects
unzip CARDELUME_STEP17J_HERMES_PI5_PROJECT.zip
cd cardelume
```

The ZIP already contains the `cardelume/` project root. Do not nest it inside another `cardelume/cardelume` folder.

## Hermes

Attach `~/projects/cardelume` as the project. Prefer the dedicated **Lumer** profile described in:

- `docs/LUMER_PROFILE_SPEC_V1.md`
- `docs/LUMER_BOOTSTRAP_RUNBOOK_V1.md`
- `.hermes/project-context/*`
- `.lumer/*`

## First commands

```bash
sha256sum -c PROJECT_SHA256SUMS.txt
npm run check:fast
npm run check:release
npm run check:status
```

Then follow `MASTERPLAN.MD` Phase18.

## Dependency lock warning

This package intentionally does not include an authoritative `pnpm-lock.yaml`. Create a **new candidate lockfile** during Step18, review it, commit it, then prove frozen installation. Never describe the new lock as historical/recovered.

## Environment

```bash
cp .env.example .env
chmod 600 .env
```

Use staging/test values first. `.env` is ignored by Git.

## Do not do yet

- do not deploy public production traffic;
- do not use production Dodo credentials;
- do not approve templates automatically;
- do not change DNS/routing/destructive production DB state without explicit owner approval.
