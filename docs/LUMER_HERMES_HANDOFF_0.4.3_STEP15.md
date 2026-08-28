# Lumer / Hermes Handoff — 0.4.3 Step 15

## Start here on Pi5

1. Read `docs/SPEC_INDEX_V7.md`, `docs/MASTER_SPEC_V7.md`, `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`.
2. Read `docs/VALIDATION_REPORT_0.4.3_STEP17I.md` and do not upgrade any NOT EXECUTED gate to PASS without evidence.
3. Review `.lumer/policies/` and `.hermes/skills/` before trusting them.
4. Follow `docs/LUMER_BOOTSTRAP_RUNBOOK_V1.md` + `.hermes/project-context/LUMER_BOOTSTRAP_CHECKLIST.md` to create the dedicated profile.
5. Keep profile-local `.env`, SOUL, memories/sessions/state outside the repo; never package secrets.
6. Restore/generate and review a real `pnpm-lock.yaml`, then use frozen install and execute full typecheck/build/test.
7. Run real-model Step 14 Golden benchmark with `--require-real-model`, repeated generations and human/editorial review. Do not treat CLI smoke fixtures as premium evidence.
8. Run a read-only `/lume-daily`/project-health session to verify Lumer understands source truth and authority before allowing experiment/staging writes.
9. Continue Step 16 Experiment/Staging Lab. Production remains owner-approval gated.

## Production authority

A toolkit PASS or release `GO_FOR_OWNER_APPROVAL` is never production permission. Lumer may prepare and validate; the owner explicitly approves production-impacting actions.
