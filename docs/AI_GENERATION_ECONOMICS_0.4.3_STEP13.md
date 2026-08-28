# CardeLume Step 13 — Premium Quality / Latency / Cost Contract

## Priority order

1. Premium/wow quality
2. Correctness and safety
3. Personal relevance / freshness
4. Latency
5. AI cost

Cost optimizations that measurably reduce premium quality are rejected.

## Expected normal call graph

```text
0 AI calls: hard filtering/ranking/history
1 premium AI call: creative director + copy for all 3 directions
0 critic calls: normal PASS path
```

Conditional path:

```text
+1 premium expanded-director call when the first AI explicitly requests more creative range
+1 premium critic/reconsideration call when the local quality gate detects risk
```

Both may occur in the same difficult generation, so the bounded worst case is **3 premium calls total**. There is no unbounded retry/reflection loop.

Avoid default three-template/three-call generation and default critic chains.

## Usage ledger fields

Per provider call when available:

- generation job ID
- phase (`creative_director`, `expanded_director`, `critic_repair`)
- provider/model
- input tokens
- output tokens
- latency ms
- estimated cost micros (optional/configured pricing)
- success/failure code

Never store provider API keys or raw prompts in the usage ledger.

## Operational KPIs

- P50/P95 generation latency
- average calls per successful generation
- input/output tokens per generation
- critic rate
- expansion rate
- curated fallback rate
- immediate regeneration rate
- first-generation selection rate
- checkout/paid rate by generation strategy

A lower token number is not a win if regeneration/fallback rises.


## Premium gate outcome

Cost does not justify accepting a weak result. After critic/reconsideration CardeLume re-runs the local gate. Persistent `creative_range`, `copy_risk`, materially low confidence or low wow fails into the curated reliability fallback.
