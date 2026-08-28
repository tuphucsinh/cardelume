# CardeLume 0.4.3 Step 12 — Ranking & Template Analytics Model

> Normative explanation of how CardeLume chooses templates and how performance evidence may influence future ranking.

---

# 1. Why deterministic ranking exists

LLMs are good at interpreting emotional context and writing copy, but they should not own catalog governance.

A deterministic ranker gives CardeLume:

- predictable eligibility;
- explainable market behavior;
- safe version identity;
- bounded candidate count;
- lower AI prompt complexity;
- easier regression testing;
- no arbitrary archived/invalid template selection.

---

# 2. Hard eligibility

A template is removed before scoring if any required condition fails:

```text
status == active
health == healthy
format supported
script supported
market not excluded
photo requirement satisfied
current version validation passed (DB catalog load boundary)
```

Hard eligibility protects correctness. Soft scoring must never “outvote” an invalid hard constraint.

---

# 3. Script resolution

Launch grouping:

```text
ja / zh → cjk
ko      → hangul
others  → latin
```

This is a technical typography compatibility grouping, not a cultural ranking category.

---

# 4. Launch score formula

For each eligible candidate:

```text
relevance = feeling * .55 + occasion * .45

baseScore =
    relevance   * .35
  + market      * .20
  + editorial   * .20
  + performance * .15
  + textFit     * .05
  + freshness   * .05

finalScore = baseScore * photoFit
```

Weights are launch defaults and must be changed only with a documented release/test, not silently through mutable DB fields.

---

# 5. Market score

```text
exactMarketAffinity
OR
GLOBAL affinity × reduced fallback factor
```

Exact market preference is therefore useful but not mandatory.

A strong GLOBAL candidate can beat a mediocre market-targeted candidate.

---

# 6. Performance score

The implementation deliberately uses smoothed rates and evidence confidence.

Conceptually:

```text
smoothed paid rate
+
smoothed selection rate
-
regeneration penalty
```

Then:

```text
observed performance × evidence confidence
+
editorial prior × (1 - evidence confidence)
```

This means a template with 3 paid outcomes from 5 impressions does not instantly beat a proven template with thousands of impressions.

---

# 7. Recommended evidence windows

Launch implementation uses recent evidence (current DB catalog query uses a recent rolling window).

Operational interpretation should consider:

- 7 days: anomaly/current change;
- 30 days: launch ranking/recent performance;
- 90 days: broader trend via daily metrics;
- lifetime: editorial/history only, not automatically the ranking window.

Avoid letting very old behavior permanently lock the catalog.

---

# 8. Text fit

Text fit connects Step 12 to Magic Typography rather than creating a second typography system.

When body pressure is high:

- `long` body-capacity templates are preferred;
- `medium` receives a moderate penalty;
- `short` receives a stronger penalty.

The ranker only improves selection. Final renderer still owns hard text safety/fail-closed behavior.

---

# 9. Photo fit

Without a photo:

- `required` is hard-excluded.

With a photo:

- `required` receives strongest photo fit;
- `optional` is reserved for future validated renderers;
- `none` remains usable because the user may choose a non-photo direction even after uploading a photo.

This ensures uploading a photo does not force all three directions into Photo Story.

---

# 10. Diversity

Two layers exist.

## Customer discovery surface

Prefer family and visual-direction diversity while filling groups.

## Initial AI directions

Use target archetypes so three top scores do not collapse into three similar looks.

Without photo:

```text
editorial + midnight + quiet
```

With photo:

```text
editorial + midnight + photo
```

---

# 11. Why market picks are reserved before Recommended

Suppose a market has exactly four strong local candidates and all rank near the top globally.

If Recommended is filled first, it could consume all four, leaving no distinct Market row.

Step 12 therefore reserves market candidates first at allocation time, while still rendering Recommended first in the UI.

This preserves the requested 4 + 4 experience without duplicates.

---

# 12. Analytics taxonomy

## `impression`

Template card was actually surfaced to the user.

## `selected`

User manually selected that exact surface slot/template version.

## `ai_assigned`

Server ranker assigned the version to one of the three AI direction slots.

## `checkout_started`

Server accepted checkout for a card snapshot carrying that template/version.

## `paid`

Verified authoritative PAID transition was attributed to the exact template/version from persisted order/card state.

## `regenerated`

User requested regeneration/change after exposure/selection. Treat as context-sensitive negative evidence, not absolute rejection.

---

# 13. Attribution source

Every event is labeled one of:

```text
ai_direction
recommended
market_pick
show_more
```

Source matters because selection/conversion is heavily affected by placement and customer intent.

Never aggregate all sources together and call the result an unbiased template quality score.

---

# 14. Rank position

Browser surfaces preserve position.

Examples:

```text
recommended position 1
market_pick position 3
show_more position 7
```

Position is necessary to understand exposure bias.

Server events that do not have a meaningful browser position may omit it.

---

# 15. Browser analytics security

Step 12 token v2 prevents easy mutation/replay:

- signed HMAC SHA-256;
- exact version/source/position/market/locale;
- anonymous session binding;
- expiry;
- random surface nonce;
- timing-safe signature comparison;
- server HMAC dedupe key for impression/selection replay.

Analytics remains low-stakes; this protection is designed to make metrics reliable enough for product decisions without creating a full authentication requirement for customers.

---

# 16. Daily rollup and retention

Raw events are temporary evidence.

The worker rolls events into `template_metrics_daily` and cleans raw rows past the configured retention window.

Reasons:

- bound DB growth;
- reduce long-term linkability;
- admin reports remain fast;
- preserve useful aggregate trend data.

No raw content from a card is needed for template performance analysis.

---

# 17. How ranking should evolve

Do not jump directly to ML.

Recommended stages:

## Stage 1 — launch

Deterministic score + strong editorial prior.

## Stage 2 — enough traffic

Tune weights based on normalized/cohort evidence.

## Stage 3 — optional controlled exploration

Very small exploration quota only if new templates cannot collect enough exposure organically.

## Stage 4 — only if justified

Consider more sophisticated contextual ranking/experimentation.

A vector DB, embedding search or black-box ML ranker is explicitly unnecessary for the expected early catalog size.

---

# 18. Ranking change governance

Any change to weights/formula/archetypes should include:

1. reason/data motivating change;
2. before/after test fixtures;
3. representative market cases;
4. no-photo/photo cases;
5. dense-copy cases;
6. diversity assertions;
7. source/runtime regression;
8. release-note entry.

Do not change the ranker because one operator dislikes one isolated result; adjust template metadata first if the issue is actually catalog curation.
