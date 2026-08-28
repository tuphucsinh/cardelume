# CardeLume Step 13 — Migration / Rollout / Rollback

## Migration

Apply after 0008:

```text
0009_ai_creative_director.sql
```

Creates:

- `style_fingerprints`
- `generation_ai_usage`

Both are server-only/RLS-enabled.

## Controlled runtime order

1. freeze dependencies per Step 11;
2. full `pnpm typecheck`;
3. full build/tests;
4. DB backup;
5. apply migrations 0001 → 0009 in order on staging;
6. run template readiness;
7. run Step 13 candidate/AI source tests;
8. configure premium AI provider/model;
9. configure optional cost rates;
10. E2E generation without photo;
11. E2E generation with photo where AI uses photo;
12. E2E generation with photo where AI chooses no-photo direction;
13. force expansion response in staging;
14. force critic trigger in staging;
15. verify Step 4 fallback if provider fails;
16. verify style history affects subsequent generation without hard-excluding good templates;
17. verify checkout/final render for AI-recommended accents and photo modes.

## Launch observation

Monitor:

- generation success/fallback rate;
- calls per generation;
- expansion rate;
- critic rate;
- P50/P95 latency;
- token/cost estimate;
- first-result selection;
- regeneration rate;
- paid conversion;
- visual/family concentration.

High critic/expansion rate indicates shortlist/recipe/model quality problems; do not simply add more automatic calls.

## Rollback

Application rollback to Step 12 is safe if migration 0009 remains present. Do not drop new tables during an incident. Step 12 code ignores them.

If Step 13 creative orchestration misbehaves:

1. roll app/worker back to Step 12 image;
2. keep migrations/data;
3. preserve Step 4 fallback;
4. investigate offline;
5. redeploy Step 13 after correction.

No destructive DB rollback is required.
