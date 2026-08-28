# Premium Quality Benchmark Lab Specification v1

## 1. Objective

Step 14 exists to measure the actual question that matters most:

> **Does CardeLume reliably produce cards that feel premium, personal and wow-worthy?**

Do not add another creative architecture layer before benchmark evidence identifies a real problem.

## 2. Golden Card Set

Launch baseline: **at least 120 synthetic/reference-safe briefs**, stratified across launch markets/locales and representative use cases.

Required dimensions:

- birthday, anniversary, thank-you, congratulations and other launch occasions;
- parent/partner/friend/colleague/client-type relationship tones where relevant;
- warm/elegant/playful/romantic/quiet/formal emotional range;
- no-photo and photo;
- short/medium/long text pressure;
- Latin/CJK/Hangul scripts as applicable;
- easy, ambiguous and emotionally difficult prompts;
- explicit "use photo" and "photo optional" cases;
- market-prior conflict cases where user preference must win;
- repeat-user sequences for anti-sameness.

Use synthetic names/messages/photos with clear rights. Do not use customer production data.

## 3. Repetition / variance

Each Golden Brief should normally run **3 independent generations** for launch benchmarking. This measures variance, not merely one lucky output.

Model comparisons must hold other variables as constant as practical.

## 4. Human premium rubric

Score 0–10:

| Dimension | Weight |
|---|---:|
| Personal relevance | 20% |
| Emotional resonance | 20% |
| Premium art direction | 20% |
| Originality / Wow | 15% |
| Copy quality | 10% |
| Visual-copy harmony | 10% |
| Market/language naturalness | 5% |

Human/editorial review is the final authority for premium/wow. AI judges may assist triage/comparison but cannot certify launch quality alone.

## 5. Launch quality floors

Initial proposed floors (review after the first real baseline):

- median weighted premium score >= **8.5/10**;
- 10th percentile >= **7.5/10**;
- no critical rendering/copyright/security/localization defect;
- no repeated-family/style collapse across a diverse Golden Set;
- no clearly offensive/culturally inappropriate creative direction;
- unresolved low-wow output must fall back rather than be presented as premium.

These are product-quality gates, not statistical claims of customer preference.

## 6. Creative diversity metrics

Track:

- top-1 family share;
- top-3 family share;
- visual archetype concentration;
- palette/accent concentration;
- photo-used/veto mix;
- copy-structure similarity;
- cross-run similarity for the same brief;
- simulated returning-user novelty distance.

Do not turn concentration targets into simplistic runtime quotas. Use them to detect ranker/catalog/prompt bias.

## 7. Creative Director challenge tests

Mandatory scenarios:

1. A lower-ranked candidate is clearly better → AI can select it.
2. Initial 8 candidates lack creative range → AI requests one expansion.
3. Expansion carries the AI's original critique/desired traits.
4. Copy-only critic cannot change template/version.
5. Creative-range critic may change only the weak direction and only to a supplied exact candidate.
6. Persistent risk → curated fallback.
7. Uploaded photo is deliberately vetoed when it harms the brief.
8. Strong explicit user preference overrides market/freshness priors.
9. Recent style memory reduces repetition without rejecting the best current fit.

## 8. Model evaluation

Compare candidate premium models using the same benchmark protocol.

Report:

- premium/wow score;
- reviewer preference;
- variance;
- critic/expand/fallback rate;
- P50/P95 latency;
- tokens/calls;
- estimated cost.

Model choice rule:

> Choose the lowest-cost/latency option that does **not materially compromise the premium floor**. If the best model creates a meaningful wow advantage, quality wins.

## 9. Prompt/template experiment discipline

Change one major variable at a time when possible:

- model;
- Creative Director prompt;
- template recipe;
- candidate weighting;
- wildcard policy;
- critic thresholds.

Every run stores source commit/config hash/model identifier and benchmark-set version.

## 10. Output

Each benchmark produces:

```text
benchmark run ID
commit/config hash
Golden Set version
model/provider
aggregate rubric
per-market rubric
creative concentration
critic/expand/fallback
latency/token/cost
critical failures
reviewer notes
GO / TUNE / NO-GO recommendation
```

## 11. Promotion gate

Any major creative/model/template-ranking change that can materially alter customer output should show benchmark evidence before production promotion.
