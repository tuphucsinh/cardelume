# CardeLume 0.4.3 Step 12 — Template Admin & Editorial Runbook

> Operational guide for the person curating the CardeLume template catalog.

---

# 1. Goal

The admin system exists so CardeLume can continuously improve its premium visual inventory without turning the customer product into a marketplace or allowing unsafe renderer code uploads.

The operator controls **which trusted designs are offered, where they are preferred, and how they perform**.

---

# 2. Roles at launch

Launch assumes one or a very small number of trusted operators sharing the protected admin boundary.

Operational responsibilities:

- curate template identity/names;
- assign market/feeling/occasion affinity;
- adjust editorial score;
- create variants within a family;
- publish/archive inventory;
- review performance;
- ensure enough healthy catalog coverage.

The operator is **not** expected to edit source code or renderer geometry through the UI.

---

# 3. Template creation decision tree

Before creating a new DB template, decide which case applies.

## Case A — Same renderer, different market/editorial positioning

Example:

```text
Existing: Botanical Poise
New: Botanical Poise — Vietnam Edition
```

If actual rendered layout is the same approved renderer:

- reuse the renderer key;
- usually duplicate into the same family;
- tune market/feeling/occasion affinities;
- keep Draft until visual/editorial review;
- do not create a new source renderer merely because the marketing identity differs.

## Case B — Same template identity, new immutable capability/render choice

Create a new vN when renderer key/format/script/text-capacity assumptions change.

Do not overwrite v1.

## Case C — Truly new visual renderer

The Admin UI is intentionally insufficient.

Required path:

```text
design approval
→ renderer source implementation
→ renderer security QA
→ format/script/typography/export tests
→ approved renderer inventory
→ DB template/version can reference it
```

---

# 4. Naming rules

Customer-visible template names should be:

- short;
- premium;
- emotionally evocative;
- globally understandable where possible;
- not stuffed with internal implementation names.

Good:

```text
Quiet Bloom
Washi Elegance
Soft Seoul
Classic Letterpress
```

Avoid:

```text
Template 42
JP-Renderer-v3
High Conversion Birthday Template
```

Internal renderer identity stays separate in `renderer_template_key`.

---

# 5. Family rules

Use the same family when two templates are visually close enough that showing both in the same initial three directions would feel repetitive.

Ask:

> Would a normal customer perceive these as meaningfully different art directions?

If no, same family.

Examples:

```text
Quiet Bloom — Ivory
Quiet Bloom — JP
Quiet Bloom — Midnight
```

may share one family if the compositional DNA is clearly the same.

Do not create giant families merely because templates share “elegant” feeling.

---

# 6. Feeling affinity

Affinity scale:

```text
0.00 = effectively incompatible
0.25 = weak
0.50 = usable
0.75 = strong
0.90+ = signature fit
```

A template can score strongly on several feelings.

Example:

```text
Romantic 0.90
Elegant  0.82
Warm     0.63
Fun      0.12
```

Do not force a single feeling label when the design naturally spans several.

---

# 7. Occasion affinity

Use occasion affinity as suitability, not absolute categorization.

Example:

```text
Birthday        0.95
Anniversary     0.80
Thank You       0.70
Congratulations 0.55
New Baby        0.30
```

A score of zero or omitted targeting means the ranker receives no positive affinity evidence; it does not mean the renderer itself is technically incapable unless another hard constraint excludes it.

---

# 8. Market affinity

Market is a **design-performance/editorial preference layer**, not an identity stereotype.

Use exact market boost when:

- the layout/typography was intentionally designed for that market;
- native editorial review supports the design choice;
- observed performance supports the preference;
- local format/script behavior is known to work.

Always prefer a strong global template over a weak local template.

## Exclusion

Use `exclude_market` only for a concrete reason, such as:

- unsupported cultural/editorial context;
- known typography/composition problem;
- legal/licensing restriction;
- native-market QA rejection.

Record the reason in operational notes outside the score itself.

---

# 9. Editorial score

Suggested interpretation:

```text
95–100 signature CardeLume quality
90–94  excellent launch-quality
85–89  good / useful variety
80–84  acceptable but not preferred
<80    keep Draft/deprioritized unless there is a specific reason
```

Do not continuously tune this number to chase weekly conversion noise.

Editorial score is a quality prior, especially for templates without enough evidence.

---

# 10. Maturity

## `new`

Newly introduced template needing evidence.

## `proven`

Established template with strong QA and enough operational confidence.

## `legacy`

Still valid for customers/history but no longer preferred as primary inventory.

Archive if it should not appear in new discovery at all.

---

# 11. Photo mode

Launch modes:

```text
none
required
```

`optional` remains reserved in the type/domain for a future renderer specifically validated to look premium both with and without a photo.

Do not mark a non-photo renderer as optional just because the customer uploaded an image; that creates false AI/ranking capability.

---

# 12. Publish checklist

Before switching Draft → Active:

- [ ] name/material copy approved;
- [ ] correct family;
- [ ] renderer key approved;
- [ ] current version validation = passed;
- [ ] template health = healthy;
- [ ] photo mode matches renderer;
- [ ] declared formats are supported;
- [ ] declared scripts are supported;
- [ ] feeling/occasion affinities reviewed;
- [ ] market affinities reviewed by someone familiar with that market when local-specific;
- [ ] no unsupported stereotype in targeting/copy;
- [ ] preview visually checked in representative locale/script;
- [ ] `/health/ready` retains catalog coverage after lifecycle change.

For a new renderer-backed behavior, also run the full renderer QA matrix in the main Step 12 spec.

---

# 13. Archive checklist

Before Archive:

1. confirm why new customers should no longer receive it;
2. check whether archiving removes a required format/script/archetype from readiness coverage;
3. do not delete historical versions/order links;
4. confirm historical recovery test remains valid;
5. consider first lowering editorial score/maturity if the goal is gradual retirement rather than immediate removal.

---

# 14. Reading performance safely

Always interpret metrics by context.

## Selection rate

Useful for visual appeal after exposure.

## Paid conversion

Stronger commercial signal but requires enough sample size and consistent denominator.

## Regeneration rate

Useful negative signal: the template may be selected/assigned but fail to satisfy the user.

## AI assignment share

Not quality by itself. High assignment may simply mean the ranker exposes it often.

## Position/source bias

Never compare position 1 Recommended with position 8 Show more as if exposure were equal.

Use market/source/time filters and confidence/sample size.

---

# 15. Market rollout workflow

For a new market:

1. start with strong GLOBAL inventory;
2. verify locale/script technical coverage;
3. identify 2–4 existing templates with strong editorial market fit;
4. add market affinity conservatively;
5. introduce market-specific variants only where design differences are real;
6. native-review visuals and wording;
7. collect normalized data;
8. adjust affinities/editorial score slowly;
9. never create four weak “local” templates just to fill a quota.

---

# 16. Incident actions

## Template renders badly in production

Immediately:

```text
health → invalid/degraded
or status → archived
```

This removes it from new ranking while preserving history.

Then diagnose renderer/version separately.

## Market row suddenly empty

Check:

- active/healthy state;
- script support;
- format support;
- exclusions;
- photo requirement;
- market affinity;
- readiness coverage.

Do not bypass eligibility just to make the row look full.

## Analytics looks suspicious

Check:

- source/rank distribution;
- repeated event volume;
- rate-limit logs;
- token validation errors;
- daily rollup;
- whether a UI placement change altered exposure.

Do not immediately rewrite ranking weights from one anomalous day.

---

# 17. Things the operator must never do

- hard-delete a historically referenced template;
- edit a published render version in place;
- mark unsupported scripts/formats as supported;
- upload untrusted SVG/HTML/JS as a renderer;
- turn a market affinity into a demographic/protected-attribute rule;
- force a low-quality market template just to fill four slots;
- use raw usage count as “best template”;
- change ranking weights from the admin UI during launch;
- expose a giant public template catalog to “show more choice.”
