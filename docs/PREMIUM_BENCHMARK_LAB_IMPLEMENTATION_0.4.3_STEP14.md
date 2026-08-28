# CardeLume 0.4.3 Step 14 — Premium Quality Benchmark Lab Implementation

## Objective

Measure whether the Step 13 Creative Director reliably produces premium, personal and WOW-worthy output before model/prompt/template/ranking changes are promoted.

## Golden Set

`benchmarks/premium/golden-set-v1.json` contains 150 synthetic/reference-safe briefs:

- 10 launch locales: EN, VI, JA, KO, ZH-CN, ES, FR, DE, PT-BR, IT;
- Latin, CJK and Hangul;
- birthday, anniversary, thank-you, congratulations and ambiguous/other cases;
- short/medium/long copy pressure;
- easy, emotional, typography-stress, ambiguous, market-prior conflict and repeat-user cases;
- photo none/optional/required;
- synthetic semantic photo fixtures: excellent portrait, busy, dark and imperfect-but-usable.

No customer production data is included.

## Runner

`scripts/premium-benchmark-runner.ts`

Default launch protocol: 3 independent generations per brief.

The runner exercises the same Step 13 primitives used by the production worker:

1. `buildCreativeCandidatePack`;
2. `generateCreativeDirectorDirections`;
3. optional one bounded `expandedCreativeCandidatePool` pass;
4. `creativeQualityRisks`;
5. conditional `criticRepairDirections`;
6. post-critic premium-critical fail closed.

It records:

- model/provider;
- source commit and config hash;
- Golden Set version;
- expand/critic/fallback-required state;
- call latency and total latency;
- input/output tokens;
- estimated cost when price env variables are supplied;
- selected immutable template/version and family metadata;
- creative thesis, visual direction and accent;
- photo-use behavior;
- repeat-user style-memory simulation.

By default it uses the current 16 source seed templates. `--catalog-json` may point to an exported managed-template catalog so staging/production-equivalent inventory can be benchmarked without changing the runner.

Use `--require-real-model` for launch-quality runs so a mock provider cannot be mistaken for premium evidence.

## Human review

`scripts/premium-benchmark-lab.mjs review-sheet` creates one review row per generated direction.

Scores remain separate for:

- personal relevance;
- emotional resonance;
- premium art direction;
- originality;
- WOW;
- copy quality;
- visual/copy harmony;
- market/language naturalness.

Originality and WOW are collected separately, then share the approved 15% rubric component. Premium art direction and WOW are also reported separately in summaries; they are not hidden inside one aggregate.

Human/editorial review is required for GO/TUNE/NO-GO. Without completed human scores the tool reports `REVIEW_REQUIRED`.

## Concentration / anti-sameness metrics

Summary output includes:

- top family share / top-3 family share;
- visual direction and visual archetype concentration;
- accent concentration;
- top repeated creative-thesis pattern share;
- copy-shape concentration;
- mean same-brief cross-run template-set similarity;
- repeat-customer same-lead-family rate;
- photo-used versus photo-veto/unused mix.

These are diagnostics, not runtime quotas.

## Model comparison

Generate a summary for each model using the same Golden Set/config discipline, then run:

`node scripts/premium-benchmark-lab.mjs compare summary-a.json summary-b.json ...`

The comparison exposes premium/WOW, variance proxies, critic/expand/fallback rates, P50/P95 latency, token/cost and reviewer recommendation side by side.

## Commands

```text
node scripts/premium-benchmark-lab.mjs validate
pnpm benchmark:run -- --repeat 3 --require-real-model
pnpm benchmark:review-sheet -- benchmark-results/<run>.jsonl
pnpm benchmark:summarize -- benchmark-results/<run>.jsonl benchmark-results/<run>.review.csv benchmark-results/<run>.summary.json
pnpm benchmark:compare -- <summary-a.json> <summary-b.json>
```

## Promotion gate

A major model/prompt/template/ranking change must carry benchmark evidence before production promotion. Benchmark evidence does not bypass renderer, copyright, security, migration, staging or owner-approval gates.
