# CardeLume 0.4.3 Step 12 — Managed Template Library, Market Intelligence & Ranking

> **Status:** implementation-backed specification for Step 12.  
> **Product rule:** template intelligence must make CardeLume feel *more curated*, never more Canva-like.  
> **Priority:** AI chooses tastefully by default; manual template browsing is a lightweight escape hatch, not the primary workflow.

---

# 1. Why this system exists

CardeLume needs to support a growing premium design library without requiring a code edit every time the business wants to:

- introduce a new curated template identity,
- introduce a market-specific variant,
- tune a template toward a feeling or occasion,
- archive an underperforming template,
- understand which templates are actually useful,
- let AI choose a better design for each brief,
- preserve historical paid output deterministically,
- show users enough variety without turning the product into a template marketplace.

The system therefore separates:

1. **template identity and targeting** — operator-managed data,
2. **renderer implementation** — code-reviewed and deterministic,
3. **template version** — immutable render choice pinned to orders,
4. **ranking** — deterministic server-side selection before AI,
5. **analytics** — privacy-safe performance evidence,
6. **customer UI** — tightly constrained 4 + 4 + 8 discovery.

---

# 2. Product principles — locked

## 2.1 AI-first, template-browser-second

Normal journey remains:

```text
small brief
   ↓
CardeLume understands context
   ↓
3 premium directions
   ↓
user chooses
   ↓
minimal finishing
   ↓
pay once
   ↓
secure JPG/PDF
```

The user is **not** asked to browse the catalog before generation.

The template browser appears only as:

> Explore more styles / Change style

This is deliberate. A large visible catalog would weaken CardeLume's differentiation.

## 2.2 Maximum choice surface

Initial manual discovery:

```text
4 Recommended
+
4 Market Picks / Curated Picks
=
up to 8 visible templates
```

Then:

```text
Show more
+
up to 8 additional templates
```

Maximum surfaced at once:

> **16 unique templates**

No infinite scroll. No 50-template grid. No marketplace navigation.

## 2.3 Recommended is contextual, not raw-popularity

“Recommended” means best fit for the current card context, considering:

- feeling,
- occasion,
- market,
- locale/script,
- format,
- photo availability,
- text capacity,
- editorial quality,
- normalized historical performance,
- freshness/maturity.

It does **not** mean “most used globally.”

## 2.4 Market Picks are quality-gated

Market targeting is an affinity, not a simplistic `market = JP` boolean.

A template may be:

- globally usable,
- strongly preferred in one market,
- acceptable in another,
- explicitly excluded from a market.

If a market does not have enough strong local candidates, CardeLume fills the remaining slots with strong global candidates and labels the group as curated rather than falsely claiming local specialization.

## 2.5 Product experience remains CardeLume-specific

Managed template infrastructure is reusable in concept, but:

- CardeLume template metadata,
- CardeLume ranking weights,
- CardeLume renderer keys,
- CardeLume art directions,
- CardeLume 3-direction generation behavior,
- CardeLume Studio discovery UI

remain product-specific.

Do not create a “UniversalTemplatePlatform” or generic visual editor.

---

# 3. Core domain model

The model has four primary concepts:

```text
Template Family
    ↓
Template
    ↓
Immutable Template Version
    ↓
Targeting / Performance metadata
```

## 3.1 Template Family

A family groups close visual siblings that should not compete as independent creative directions.

Example:

```text
Quiet Bloom
├── Global Ivory
├── JP Quiet Bloom
└── Midnight Quiet Bloom
```

Purpose:

- prevent AI from returning near-duplicates,
- support market/style variants without catalog clutter,
- make admin duplication safe,
- preserve diversity in the three AI directions.

### Family invariant

For the initial AI result set:

> Prefer at most one template from the same family.

## 3.2 Template

A Template is the operator-managed identity customers may recognize by name.

Important mutable fields include:

- name,
- slug,
- material/finish description,
- lifecycle status,
- health,
- photo mode,
- editorial score,
- maturity,
- targeting affinities.

A Template is **not** raw SVG/HTML/CSS uploaded by an admin.

## 3.3 Template Version

A Template Version is the immutable render contract used by a purchase.

It pins:

- renderer template key,
- visual direction,
- supported formats,
- script support,
- headline text capacity,
- body text capacity,
- validation state,
- version number.

Pixel-affecting changes must create a new version.

## 3.4 Targeting

Targeting is stored as normalized rows:

```text
market
occasion
feeling
exclude_market
```

Each positive targeting row has an affinity from 0 to 1.

Examples:

```text
feeling: Warm → 0.95
feeling: Elegant → 0.78
occasion: Birthday → 0.90
market: VN → 0.96
market: GLOBAL → 0.70
exclude_market: JP → 1.0
```

---

# 4. Database schema

Step 12 adds migration:

```text
0008_managed_templates.sql
```

## 4.1 `template_families`

Fields:

```text
id UUID PK
name TEXT
slug TEXT UNIQUE
created_at
updated_at
```

## 4.2 `templates`

Fields:

```text
id UUID PK
family_id FK → template_families
slug UNIQUE
name
material
status
health
photo_mode
editorial_score
maturity
current_version_id
created_at
updated_at
archived_at
```

### Allowed status

```text
draft
active
archived
```

### Allowed health

```text
healthy
degraded
invalid
```

### Photo mode

Schema supports:

```text
none
optional
required
```

Current production renderer/admin exposure intentionally uses:

```text
none
required
```

`optional` is reserved until a QA-approved renderer genuinely supports optional photo composition.

### Maturity

```text
new
proven
legacy
```

This is a ranking signal, not a customer-facing quality judgment.

## 4.3 `template_versions`

Fields:

```text
id UUID PK
template_id FK
version INT
renderer_template_key
visual_direction
supported_formats JSONB
script_support JSONB
headline_capacity
body_capacity
preview_asset nullable
validation_status
validation_notes
created_at
```

Constraints:

```text
UNIQUE(template_id, version)
UNIQUE(template_id, id)
```

The second unique pair supports composite foreign keys that ensure a version always belongs to the template ID it is paired with.

## 4.4 Exact current-version integrity

`templates.current_version_id` is constrained by:

```text
FOREIGN KEY (id, current_version_id)
REFERENCES template_versions(template_id, id)
```

Therefore an operator cannot accidentally assign another template's version as the current version.

## 4.5 `template_targeting`

Fields:

```text
template_id
dimension
target_key
affinity
```

Primary key:

```text
(template_id, dimension, target_key)
```

No duplicate targeting row for the same dimension/key.

## 4.6 `template_events`

Privacy-safe append-only short-lived event store.

Fields:

```text
id UUID PK
template_id
template_version_id
event_type
source
market
locale
rank_position
created_at
```

### Event types

```text
impression
selected
ai_assigned
checkout_started
paid
regenerated
```

### Sources

```text
ai_direction
recommended
market_pick
show_more
```

### Explicit privacy rule

Template analytics must not contain:

- recipient name,
- relationship free text,
- personal detail,
- headline/body content,
- uploaded photo ID/object key,
- payment secret,
- recovery token.

## 4.7 `template_metrics_daily`

Daily aggregate table:

```text
day
template_id
market
source
impressions
selected
ai_assigned
checkout_started
paid
regenerated
updated_at
```

Primary key:

```text
(day, template_id, market, source)
```

## 4.8 Purchase snapshot linkage

`card_versions` gains:

```text
managed_template_id
managed_template_version_id
managed_template_source
```

Composite FK ensures:

```text
(managed_template_id, managed_template_version_id)
```

is a real template/version pair.

This is essential for deterministic recovery.

---

# 5. Template lifecycle

## 5.1 Recommended lifecycle

```text
Draft
 ↓
Review / validation
 ↓
Active
 ↓
Archived
```

Current code models review via `validation_status` on versions rather than a separate template status.

## 5.2 Draft

A newly created template starts as:

```text
status = draft
```

It does not enter customer ranking.

## 5.3 Active

Activation is allowed only when:

- template health is `healthy`,
- current version exists,
- current version validation is `passed`.

## 5.4 Archive, not destructive deletion

Admin “Remove” maps to:

```text
status = archived
archived_at = now()
```

No active selection uses it after archive.

Historical orders remain valid because they retain exact immutable template/version identity.

## 5.5 Hard delete policy

Step 12 production admin does **not** expose hard deletion.

A future maintenance tool may hard-delete only templates that have never been:

- published,
- referenced by card versions,
- used in orders,
- referenced by analytics worth retaining.

That tool is intentionally not part of launch scope.

---

# 6. Immutable versioning policy

## 6.1 Changes that require a new Template Version

Any change capable of affecting rendered output or fit contract:

- renderer template key,
- layout implementation,
- geometry,
- typography layout behavior,
- supported formats,
- script compatibility,
- headline/body capacity,
- pixel-affecting renderer configuration.

## 6.2 Changes that do not require a new version

Operator metadata may change in place:

- display name,
- material/finish description,
- editorial score,
- maturity,
- market affinity,
- occasion affinity,
- feeling affinity,
- exclusions,
- active/archive status,
- health.

These do not change historical paid rendering.

## 6.3 Exact-version checkout

The browser sends:

```text
templateId
templateVersionId
templateSource
```

Checkout verifies the **exact version that was previewed** rather than resolving “current version” again.

This prevents the race:

```text
customer previews v1
admin activates v2
customer pays
```

from silently changing the purchased output to v2.

## 6.4 Historical recovery invariant

A paid order must continue to point at the version it purchased even if:

- the template is later archived,
- v2/v3 is published,
- metadata changes,
- ranking changes,
- performance score changes.

---

# 7. Renderer trust boundary

This is a critical architecture decision.

## 7.1 Admin does not upload arbitrary renderer code

A managed template can only bind to a renderer key already present in the QA-approved CardeLume renderer catalog.

Current approved keys are derived from the bootstrap renderer set.

If admin attempts an unknown renderer key:

```text
renderer_template_key_not_approved
```

## 7.2 New visual renderer implementation still requires code review

A brand-new layout cannot become production-safe simply because a DB row exists.

Required path:

```text
implement renderer
↓
renderer QA/stress
↓
add to approved renderer catalog
↓
deploy
↓
create managed template/version using that key
```

This preserves Step 2/3/5 deterministic export and typography guarantees.

## 7.3 Photo compatibility is fail-closed

Current rule:

```text
photo-story renderer ↔ photo_mode = required
all current non-photo renderers ↔ photo_mode = none
```

Admin cannot label a non-photo renderer as photo-required or vice versa.

---

# 8. Eligibility filter

Before any scoring, a template must pass hard constraints.

A template is ineligible when:

1. `status != active`
2. `health != healthy`
3. current version not validated
4. requested format unsupported
5. locale script unsupported
6. market explicitly excluded
7. photo required but user has no trusted/usable photo

Eligibility is deterministic.

AI never gets to override this filter.

---

# 9. Script compatibility

Step 12 maps locale to broad render script category:

```text
JA / ZH → cjk
KO      → hangul
others  → latin
```

A version declares supported script groups.

Reason:

A layout that looks excellent with short Latin copy may not be art-directed correctly for:

- Japanese,
- Simplified Chinese,
- Korean.

Script support is therefore a hard filter, not merely a score.

---

# 10. Text capacity

Template versions declare:

```text
headline_capacity: short | medium | long
body_capacity: short | medium | long
```

The ranker may receive body pressure derived from the CardeLume typography model.

The score decreases when dense copy is paired with a low-capacity layout.

This integrates template intelligence with the existing Magic Typography guard rather than creating a second competing typography system.

---

# 11. Feeling and occasion affinities

Feeling and occasion are soft dimensions.

Example:

```text
Elegant 0.95
Warm 0.80
Romantic 0.65
Fun 0.20
```

This is intentionally richer than a binary tag list.

A template can be excellent for one feeling and still acceptable for another.

Current relevance formula:

```text
relevance = feelingAffinity × 0.55
          + occasionAffinity × 0.45
```

Weights are launch defaults and may be tuned later based on evidence.

---

# 12. Market affinity model

Market targeting is a soft preference with global fallback.

Pseudo-rule:

```text
marketScore = direct market affinity
              OR GLOBAL affinity × 0.55
```

A direct market affinity therefore outranks a generic global fallback when quality is otherwise similar.

## 12.1 Market-specific does not mean cultural stereotype

Affinity should be set based on:

- real design review,
- typography suitability,
- density,
- local research,
- observed selection/conversion,
- art-direction confidence.

Do not encode simplistic assumptions about nationality/culture.

## 12.2 Exclusion

`exclude_market` is a hard stop.

Use it when a template is technically or editorially unsuitable for that market/script pack.

---

# 13. Editorial score

Each template has:

```text
editorial_score 0–100
```

Purpose:

- provide a strong human quality prior,
- protect early-stage ranking when data is sparse,
- prevent low-quality high-click novelty from automatically dominating.

Editorial score is not shown as a star rating to customers.

---

# 14. Historical performance model

Raw usage count is deliberately **not** a ranking feature.

Why:

```text
template shown often
↓
gets more usage
↓
looks popular
↓
shown even more
```

This feedback loop is undesirable.

Step 12 uses normalized rates with smoothing.

## 14.1 Signals

Current ranking can use:

- impressions,
- selections,
- paid outcomes,
- regenerated outcomes.

## 14.2 Bayesian-style smoothing

Approximate implementation:

```text
paidRate   = (paid + prior) / (impressions + prior mass)
selectRate = (selected + prior) / (impressions + prior mass)
```

Evidence grows with impressions.

For a new template:

```text
performance ≈ editorial prior
```

For a mature template with substantial exposure:

```text
performance ≈ observed normalized behavior
```

This prevents a template with 3 purchases from 5 impressions from immediately outranking a stable template with thousands of observations.

---

# 15. Ranking formula — launch default

After hard eligibility:

```text
35% brief relevance
20% market affinity
20% editorial quality
15% historical normalized performance
 5% text-fit compatibility
 5% freshness / maturity
```

Then apply photo-fit adjustment.

This is intentionally deterministic and explainable.

No vector DB. No learning-to-rank model. No opaque recommendation service in launch scope.

---

# 16. Maturity / freshness

Current maturity signal:

```text
new    → strongest freshness boost
proven → moderate
legacy → reduced
```

Purpose:

- allow excellent new templates to receive some exposure,
- avoid a static catalog dominated forever by old winners.

This is not yet a full experimentation engine.

---

# 17. Diversity pass

Ranking score alone is not sufficient.

A result like:

```text
Botanical Cream
Botanical Ivory
Botanical Beige
```

is undesirable even if all three score highly.

Step 12 therefore applies diversity across:

- family,
- visual direction/archetype.

## 17.1 AI archetypes

Current AI slots:

### Without photo

```text
editorial
midnight
quiet
```

### With photo

```text
editorial
midnight
photo
```

This gives the customer meaningfully different directions.

## 17.2 Archetype mapping

Examples:

```text
photo / required photo → photo
midnight/deco/quiet-noir/celestial → midnight
minimal/letterpress → quiet
remaining art directions → editorial
```

---

# 18. AI integration

AI does not search the entire template library.

Pipeline:

```text
GenerationBrief
      ↓
managed template catalog
      ↓
hard eligibility
      ↓
deterministic ranker
      ↓
3 diverse trusted templates
      ↓
AI copy planner
      ↓
3 directions pinned to template IDs/versions
```

## 18.1 AI responsibilities

AI may generate:

- kicker,
- headline,
- body.

AI is instructed to adapt copy to the assigned trusted template slot.

## 18.2 AI may not

AI may not:

- invent a template ID,
- replace assigned template,
- choose an archived template,
- bypass photo/format/script rules,
- supply arbitrary renderer code,
- alter template version identity.

## 18.3 Failure behavior

If catalog selection or AI provider fails:

- generation job fails safely,
- Step 4 curated fallback remains available in Studio,
- customer is not exposed to provider diagnostics.

---

# 19. Customer template browser

## 19.1 Opening behavior

Triggered only after the 3 initial directions are visible.

Call to action is intentionally lightweight:

> Explore more styles

## 19.2 First surface

```text
Recommended — up to 4
Market Picks — up to 4
```

Market candidates are reserved during allocation so the Recommended row cannot consume the entire local pack.

## 19.3 Market row labeling

If genuine direct-market candidates exist:

> Market Picks / localized equivalent

If the row had to be filled primarily by global candidates:

> Curated Picks / localized equivalent

Never imply local specialization that is not present.

## 19.4 Show more

A single explicit action exposes:

```text
up to 8 additional unique templates
```

No endless pagination in customer Studio.

## 19.5 Dedupe

The same template ID cannot appear in multiple visible groups.

## 19.6 Graceful small catalogs

If only 11 templates are compatible:

```text
8 initial
+3 more
```

If only 6 are compatible:

```text
show 6
```

Do not duplicate to fill quota.

---

# 20. User-selected template lock

When a user manually chooses a template:

- selected template ID/version is retained,
- subsequent finishing changes do not silently swap template,
- checkout uses that exact version.

AI should only change style again after an explicit style/regeneration action.

This avoids surprising the customer after deliberate selection.

---

# 21. Admin Template Library

Route:

```text
/admin/templates
```

Protected by template-admin authentication at the request proxy boundary.

## 21.1 Launch admin capabilities

- list templates,
- search/filter,
- create draft,
- reuse an existing family for a variant,
- duplicate into a variant form,
- edit metadata,
- edit market/occasion/feeling affinities,
- exclude markets,
- create immutable version,
- publish,
- return to draft,
- archive/remove,
- inspect 30-day high-level performance.

## 21.2 Create behavior

New template:

```text
status = draft
```

Only approved renderer keys are accepted.

## 21.3 Duplicate / market variant

Admin may reuse the original `familyId`.

This is recommended for:

- JP edition,
- KR edition,
- alternate material treatment,
- closely related stylistic sibling.

Family grouping prevents near-duplicate AI output.

## 21.4 Edit metadata

Editable without new version:

- name,
- material,
- editorial score,
- feelings,
- occasions,
- markets,
- excluded markets,
- lifecycle metadata.

## 21.5 New version

Creates an immutable `vN` using an approved renderer key and fit contract.

Activation requires validation passed.

---

# 22. Admin security

## 22.1 Authentication

Launch implementation uses HTTP Basic protection for:

```text
/admin/templates/*
/api/admin/templates/*
```

Credentials come from:

```text
TEMPLATE_ADMIN_USERNAME
TEMPLATE_ADMIN_PASSWORD
```

Production readiness requires both.

Password minimum policy is enforced by live configuration validation.

## 22.2 Mutation guard

Non-GET admin API mutations require:

```text
x-cardelume-admin-action: 1
```

This provides an additional browser request boundary on top of authentication.

## 22.3 TLS requirement

Basic Auth is only acceptable behind production HTTPS/TLS.

Do not expose admin origin directly over plaintext HTTP.

## 22.4 Future upgrade trigger

Move from Basic Auth to identity-aware admin auth when any of these become true:

- multiple operators,
- role separation required,
- audit identity required,
- external contractors,
- public-facing admin surface,
- compliance requires named operator identity.

Do not build that complexity prematurely for a one-operator launch.

---

# 23. Template analytics

## 23.1 Why source attribution matters

A template shown at position 1 naturally gets more interaction than a template only visible after “Show more.”

Therefore every event records source and rank position.

Without this, “popular template” data is biased.

## 23.2 Source examples

```text
ai_direction
recommended
market_pick
show_more
```

## 23.3 Paid attribution

Checkout persists template source into the card version.

When authoritative PAID occurs, server-side code can emit a paid template event using the exact purchased template/version/source.

The browser is not trusted to claim a payment conversion.

## 23.4 AI assignment

`ai_assigned` is recorded server-side by the generation worker.

## 23.5 Signed browser analytics

Because performance contributes to ranking, browser analytics is treated as untrusted input.

Step 12 issues a short-lived HMAC capability for each surfaced template slot.

The token binds:

```text
template ID
template version ID
source
rank position
market
locale
anonymous session ID
surface nonce
expiry
```

Events for impressions/selections are accepted only when the token matches those exact fields **and the current anonymous session**. Impression/selection replay of the same signed surface is additionally deduplicated by a server HMAC `dedupe_key` stored under a DB unique constraint.

This prevents a normal browser client from freely claiming:

- another template,
- another source,
- a better rank position,
- another market,
- another anonymous session,
- an expired surface,
- repeated inflation of the same impression/selection surface token.

Production requires:

```text
TEMPLATE_EVENT_SECRET
```

minimum 32 characters.

## 23.6 Abuse guard

Template events use a server-side rate bucket:

```text
TEMPLATE_EVENT_RATE_LIMIT_PER_HOUR
```

Default:

```text
120 / anonymous session / hour
```

Edge-level abuse controls remain recommended before public launch.

---

# 24. Analytics retention

Raw `template_events` are intentionally temporary.

Default:

```text
TEMPLATE_EVENT_RETENTION_DAYS = 90
```

Worker maintenance:

1. rolls completed prior days into `template_metrics_daily`,
2. removes raw events older than retention.

Long-lived decision data should come from aggregates, not an indefinitely growing behavioral event table.

---

# 25. Admin performance interpretation

Do not rank or judge a template by raw usage alone.

Useful views include:

```text
impressions
selected
AI assigned
checkout started
paid
paid / impression
selection / impression
regeneration rate
```

Future UI may add 7/30/90-day and market filters, but launch admin deliberately remains compact.

---

# 26. Catalog readiness and fail-closed launch behavior

Template management can become a production dependency: an operator could theoretically archive too much of the catalog.

`/health/ready` therefore includes catalog coverage.

Current required coverage is checked across:

```text
5 formats
×
latin / cjk / hangul
×
editorial / midnight / quiet / photo archetypes
```

If required coverage is missing:

```text
/health/ready → 503 template_catalog_invalid
```

In production, detailed missing configuration/coverage is not publicly leaked.

This allows the existing node watchdog to withdraw an unhealthy deployment from the shared Cloudflare Tunnel.

---

# 27. Bootstrap catalog

Migration 0008 seeds the existing 16 trusted CardeLume render directions as managed records.

Properties:

- stable UUIDs,
- stable family IDs,
- stable version IDs,
- version 1,
- validated renderer keys,
- initial targeting metadata,
- existing renderer behavior preserved.

Seed inserts use non-destructive conflict behavior so operator-managed metadata is not overwritten by ordinary re-application.

---

# 28. Market strategy

## 28.1 Launch strategy

Do not require every market to have a large local catalog immediately.

Recommended progression:

```text
Global core catalog
↓
measure market behavior
↓
add 2–4 high-confidence market variants
↓
observe normalized outcomes
↓
expand only where quality evidence exists
```

## 28.2 Market variant checklist

Before labeling a template strongly market-preferred, review:

- script composition,
- local whitespace expectations,
- typography density,
- occasion norms,
- image prominence,
- color/ornament sensitivity,
- localization quality,
- real performance when available.

## 28.3 No forced quota

The product UI may aim for 4 market picks, but the system must never lower quality purely to satisfy a quota.

Global fill is preferable to a weak “local” template.

---

# 29. Ranking tuning policy

Weights are configuration-by-code at launch, not admin-editable knobs.

Reason:

- ranking changes affect every user,
- accidental weight edits are high-blast-radius,
- early traffic is too small for constant optimization,
- deterministic code changes are easier to review and rollback.

Change ranking weights only when there is enough evidence and include regression examples.

---

# 30. Exploration / experimentation

Step 12 does not implement a full multi-armed bandit or experimentation platform.

Launch approach:

- strong editorial prior,
- small freshness signal,
- deterministic ranking,
- observe data.

A later controlled exploration percentage may be introduced after traffic volume justifies it.

Do not build an ML ranking platform prematurely.

---

# 31. Relationship targeting — deliberately deferred

Relationship remains part of the CardeLume brief and copy planner, but Step 12 does not add a dedicated relationship affinity dimension to template targeting.

Reason:

- relationship currently influences language more strongly than layout,
- market/occasion/feeling already provide sufficient useful selection dimensions,
- adding dimensions without evidence increases admin complexity.

Add relationship targeting later only if data demonstrates material design preference differences.

---

# 32. Color targeting — deliberately secondary

Color/mood tags may exist editorially in future, but launch ranking does not depend on detailed color preference metadata.

Photo Palette already handles image-derived color behavior for Photo Story.

Do not duplicate that system inside template ranking.

---

# 33. API architecture

## Public discovery

```text
GET /api/templates
```

Input:

- occasion,
- feeling,
- format,
- locale,
- photo availability,
- optional body pressure.

Market comes from trusted edge headers in live mode.

Output:

```text
recommended[]
marketPicks[]
more[]
marketSpecificCount
```

Each option contains only safe presentation/identity data plus a short-lived analytics capability.

## Public template events

```text
POST /api/templates/events
```

Accepts bounded batches of privacy-safe events.

Requires:

- anonymous session,
- rate-limit allowance,
- valid signed event capability.

## Admin catalog

```text
GET  /api/admin/templates
POST /api/admin/templates
```

## Admin template mutation

```text
PATCH  /api/admin/templates/:templateId
DELETE /api/admin/templates/:templateId
```

DELETE means archive.

## Admin versions

```text
GET  /api/admin/templates/:templateId/versions
POST /api/admin/templates/:templateId/versions
```

---

# 34. Checkout architecture

Customer selection passes:

```text
templateId
templateVersionId
templateSource
```

Checkout:

1. validates pair completeness,
2. loads exact managed version,
3. verifies active/healthy/validated state,
4. verifies format/script/photo compatibility,
5. maps trusted renderer key into CardDocument,
6. persists template/version/source on card version,
7. proceeds to the existing verified Dodo flow.

No payment or rendering trust decision is delegated to browser metadata.

---

# 35. Interaction with secure recovery

Secure recovery continues to operate on paid order entitlements and immutable resource versions.

Template management does not weaken recovery.

Important invariant:

```text
archiving a template must never invalidate an old paid recovery link
```

Because the purchased card version retains the exact renderer/template version identity, future catalog ranking state is irrelevant to recovery.

---

# 36. Interaction with trusted photo upload

Photo eligibility is based on whether the card has a usable trusted photo path.

A Photo Story template still relies on Step 7:

```text
browser upload
↓
private quarantine
↓
server sanitize/re-encode
↓
trusted asset binding
↓
paid renderer
```

Template metadata never permits raw client object keys to enter the renderer.

---

# 37. Interaction with typography

Ranking may use copy pressure to prefer higher-capacity templates.

Final safety remains Step 3:

- typography floor,
- overflow guard,
- fail-closed paid renderer behavior.

Template capacity is a preference signal, not permission to bypass typography safety.

---

# 38. Interaction with Photo Palette WCAG

Managed template identity does not replace Step 5 contrast rules.

Any photo-compatible renderer continues to use shared browser/renderer contrast logic.

A template cannot opt out of accessibility contrast guarantees through metadata.

---

# 39. Observability

Useful structured operational events include:

```text
template catalog unavailable
template catalog readiness failure
AI template candidates insufficient
template analytics write failure
admin mutation failure
```

Do not log:

- template analytics HMAC secret,
- full signed event capability,
- user card content,
- recovery secrets,
- payment credentials.

---

# 40. Performance constraints

Template discovery should remain cheap.

Launch catalog scale assumption:

```text
~20–200 active templates
```

SQL fetch + deterministic in-process scoring is sufficient.

Do not introduce:

- vector DB,
- external recommendation service,
- Elasticsearch,
- Redis ranking cache,
- ML serving infrastructure

without measured need.

---

# 41. Indexing / cache behavior

Customer template API may use short private browser caching because output is personalized by query/market context and carries expiring capabilities.

Admin APIs use `no-store`.

Health endpoints use `no-store`.

Do not CDN-share a market/person-context template response across users without redesigning token/cache semantics.

---

# 42. Failure modes

## DB catalog unavailable

Live mode:

```text
GET /api/templates → 503 template_catalog_unavailable
```

Do not silently expose a fake catalog in production.

Mock/dev mode may use bootstrap templates for review.

## Catalog coverage broken

```text
/health/ready → 503
```

Node watchdog removes node from serving path.

## AI candidate pool insufficient

Generation job fails safely and Studio Step 4 fallback remains available.

## Analytics unavailable

Customer design flow should continue. Analytics failure must not block selection or purchase.

## Template archived while customer is viewing

Checkout validates exact version and current eligibility. If operator has intentionally archived it before purchase, checkout may reject and customer must select an active design.

Paid historical orders remain unaffected.

---

# 43. Admin operational rules

1. Create as Draft.
2. Reuse family for close variants.
3. Do not create a new family merely for a different market if the visual design is substantially the same.
4. Use direct market affinity only when editorially justified.
5. Prefer Archive over deleting history.
6. Never edit an old render version in place.
7. Do not publish an unknown renderer key.
8. Keep at least one healthy template per required readiness archetype/script/format.
9. Review performance as rate + source + position, not raw count.
10. Do not overreact to low-sample performance.

---

# 44. Suggested market rollout process

For each priority market:

```text
1. review current global candidates
2. inspect native-language rendering
3. identify gaps
4. create 2–4 variants if justified
5. assign market affinity
6. publish only validated versions
7. observe 30+ days or sufficient traffic
8. tune affinity/editorial score conservatively
9. archive weak variants only after checking sample/source bias
```

---

# 45. Customer-facing copy principles

Do not expose ranking jargon.

Good:

- Recommended for your card
- Popular styles for your market
- Curated for you
- Explore more styles

Avoid:

- Algorithm score
- Conversion winner
- AI ranking confidence
- Template ID/version
- Market affinity 0.93

The system should feel editorial, not analytical.

---

# 46. Accessibility

Template browser must maintain:

- keyboard-accessible selection controls,
- readable names/material descriptions,
- no color-only selection state,
- preview contrast from existing WCAG engine,
- bounded motion consistent with reduced-motion settings.

Admin controls should remain usable with standard keyboard/navigation even though launch admin is intentionally utilitarian.

---

# 47. Localization

Template UI strings live in localized copy infrastructure.

Template display names may remain branded/curated names unless a future market requires localized public names.

Do not automatically machine-translate named template identities without editorial approval.

Market is separate from locale:

```text
market → merchandising/ranking
locale → language/script/copy
```

This separation is preserved from Smart Locale architecture.

---

# 48. QA matrix for a new renderer-backed template

Before a brand-new renderer key enters the approved set, validate at least:

## Formats

- portrait 5×7,
- folded 5×7,
- square 5×5,
- landscape 7×5,
- postcard 6×4.

## Scripts

- representative Latin,
- Japanese/Chinese where supported,
- Korean where supported.

## Copy

- short,
- medium,
- dense but allowed,
- overflow rejection.

## Photo

- required/none contract,
- sanitized asset only,
- orientation,
- cropping,
- WCAG contrast.

## Export

- deterministic JPG,
- deterministic PDF,
- 300-DPI metadata/physical dimensions,
- no watermark in paid final.

## Security

- no raw markup injection,
- no external renderer URL,
- no client R2 key trust.

---

# 49. Automated Step 12 regression requirements

At minimum verify:

- managed schema tables exist,
- 16 bootstrap templates + versions seed correctly,
- current-version pair FK exists,
- card-version template pair FK exists,
- archive-only admin behavior,
- ranking excludes archived/invalid templates,
- photo-required excluded without photo,
- 3 AI archetypes differ,
- family diversity,
- 4 + 4 + up to 8 has no duplicates,
- exact version is carried to checkout,
- ranking occurs before AI call,
- paid source attribution is server-side,
- raw analytics contains no card text/photo fields,
- template events are rate limited,
- template event capabilities are signed/expiring/exact-slot bound,
- daily metrics rollup wired,
- raw event retention wired,
- catalog readiness wired,
- Step 6–11 regressions still pass.

---

# 50. Non-goals — Step 12

Do **not** add now:

- Canva-style canvas editor,
- public template marketplace,
- customer template uploads,
- arbitrary admin HTML/SVG/CSS renderer uploads,
- vector similarity database,
- ML recommendation training pipeline,
- relationship-specific targeting dimension,
- complex role-based admin system,
- automated cultural stereotype generation,
- unlimited browse pagination,
- user favorites/accounts,
- template subscription/credits.

---

# 51. Future extensions — only when justified

Possible later additions:

## 51.1 Rich admin analytics

- 7 / 30 / 90 day filters,
- market filter,
- source filter,
- template detail trend chart,
- confidence/sample indicator.

## 51.2 Controlled exploration

Small bounded exploration for new high-editorial templates once traffic volume supports useful inference.

## 51.3 Automatic health downgrade

If deterministic renderer smoke tests fail after deployment, mark relevant versions/templates degraded before catalog readiness goes green.

## 51.4 Optional-photo renderer

Expose `photo_mode = optional` only after a renderer is specifically designed and validated for both photo and no-photo compositions.

## 51.5 Named operator admin auth

Upgrade when multiple people manage the catalog.

## 51.6 Market-pack editorial workflow

Dedicated review queue per market if template inventory grows materially.

---

# 52. Architecture diagram

```text
                                  CARDELUME STUDIO
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                     Generate                      Explore styles
                         │                               │
                         ▼                               ▼
                 Durable Generation                GET /api/templates
                         │                               │
                         ▼                               ▼
               Managed Template Catalog          eligibility + ranking
                         │                               │
                         ▼                               ├── 4 Recommended
                    hard filter                          ├── 4 Market Picks
                         │                               └── +8 More
                         ▼
                 deterministic ranker
                         │
                         ▼
              diversity / archetype pass
                         │
                         ▼
                  3 trusted versions
                         │
                         ▼
                     AI Planner
                         │
                         ▼
               3 premium directions
                         │
                         └───────────────┐
                                         ▼
                              User selects exact
                              template + version
                                         │
                                         ▼
                                     Checkout
                                         │
                              verified Dodo PAID
                                         │
                                         ▼
                            deterministic renderer
                                         │
                                         ▼
                                private JPG / PDF
                                         │
                                         ▼
                                 secure recovery
```

Admin side:

```text
/admin/templates
      │
      ├── create draft
      ├── duplicate / family variant
      ├── edit targeting
      ├── new immutable version
      ├── publish
      └── archive
              │
              ▼
      managed template DB
              │
              └── /health/ready catalog coverage
```

Analytics side:

```text
server AI assignment ─────┐
signed browser events ────┼──> template_events
server paid attribution ──┘          │
                                     ▼
                              daily rollup
                                     │
                                     ▼
                          template_metrics_daily
```

---

# 53. Source-of-truth precedence

For Step 12 behavior, precedence is:

```text
1. database constraints / current source implementation
2. this Step 12 template spec
3. MASTER_SPEC_V7
4. older MASTER_SPEC_V4 / earlier roadmap documents
```

Older documents remain historical context but must not override Step 12 invariants.

---

# 54. Final product decision

The correct mental model is:

> **CardeLume owns the taste. The template library is an internal intelligence system, not a customer design tool.**

The ideal customer experience is still:

> “I told CardeLume who this is for and how I want it to feel. It immediately showed me a few beautiful choices.”

The ideal operator experience is:

> “I can add, target, version, publish, archive and measure premium designs without editing business logic, while paid output remains deterministic.”

That is the Step 12 contract.

## Appendix — exact version database invariant

Step 12 enforces the managed template reference as an all-or-nothing pair: both `managed_template_id` and `managed_template_version_id` are NULL for legacy/unmanaged rows, or both are non-NULL and the composite foreign key must match the same template/version. Template analytics events require a non-NULL exact template version. This prevents ambiguous attribution and the race where a customer previews one version but a later current version is substituted.

## Appendix — approved renderer capability subsets

Admin-created templates and versions may only reuse a QA-approved renderer key. Their declared format/script support must be equal to or a subset of that renderer key’s approved capabilities; an admin request cannot expand a renderer into an unvalidated script or format. This matters especially for market variants such as Japanese/Korean inventory.

---

# 55. Canonical feature contract — complete launch scope

This section is the compact, implementation-level feature checklist that MUST remain true unless a later version explicitly supersedes Step 12.

## 55.1 Customer-facing behavior

The public product does **not** start with a template catalog.

The default experience is:

```text
Brief
  ↓
3 AI-curated premium directions
  ↓
Choose / minimal finishing
  ↓
Optional: Explore more styles
```

When the customer chooses to explore templates:

```text
Recommended          max 4
Market/Curated Picks max 4
Show more            max 8 additional
---------------------------------------
Maximum surfaced     16 unique templates
```

Rules:

- no infinite scroll;
- no public “all templates” marketplace;
- no duplicate template identity across the three visible groups;
- no `required` photo template when the current card has no trusted photo;
- do not claim “Popular in {market}” or similar market language when the row is only global fallback inventory;
- customer manual selection locks the **exact** template/version shown;
- regeneration must preserve a user-locked template unless the user explicitly requests style change/surprise behavior;
- a later admin publish must never silently replace the version the customer previewed.

## 55.2 Operator-facing behavior

Launch admin supports only the operations needed to curate a premium catalog:

```text
Create Draft
Duplicate / create family variant
Edit safe metadata / targeting
Create immutable render version
Publish
Return to Draft
Archive / Remove
Inspect performance
```

Operator does **not** upload arbitrary HTML/CSS/SVG/JS or a renderer implementation.

A genuinely new visual renderer remains a normal source-code feature with renderer tests and controlled deployment.

## 55.3 AI behavior

The AI provider never receives authority to select arbitrary catalog identity.

The server pipeline is:

```text
managed active catalog
      ↓
hard eligibility
      ↓
deterministic score
      ↓
diversity/archetype selection
      ↓
exact 3 template versions
      ↓
AI writes/composes copy FOR those fixed slots
```

If the managed catalog or provider path cannot produce the safe three-direction contract, Step 4 curated fallback remains the safety net. The system must not invent a fake template ID.

## 55.4 Commerce behavior

A managed card snapshot carries:

```text
managed_template_id
managed_template_version_id
managed_template_source
```

`template ID + version ID` is an all-or-nothing pair and must be enforced in application validation and the database.

The paid path remains:

```text
exact card version
→ exact managed template version
→ verified Dodo PAID
→ deterministic renderer key
→ private final JPG/PDF
→ entitlement
→ secure recovery
```

Archive/current-version changes do not alter historical paid output.

---

# 56. Canonical data dictionary

## 56.1 `template_families`

Purpose: group variants close enough that they should not dominate the three initial directions.

| Field | Meaning | Mutable? |
|---|---|---|
| `id` | stable UUID | no |
| `slug` | operator-friendly stable family key | normally no |
| `name` | operator-facing family name | yes |
| timestamps | audit timestamps | system |

A family is **not** a render version. It exists for editorial grouping and diversity.

## 56.2 `templates`

Purpose: managed template identity and business/editorial state.

| Field | Meaning | Rule |
|---|---|---|
| `id` | stable template UUID | immutable |
| `family_id` | diversity family | required |
| `slug` | stable unique identity | unique |
| `name` | customer/operator display name | mutable |
| `material` | short premium finish description | mutable, non-authoritative |
| `status` | `draft / active / archived` | lifecycle |
| `health` | `healthy / degraded / invalid` | eligibility gate |
| `photo_mode` | `none / optional / required` | current launch inventory uses `none` or `required` |
| `editorial_score` | 0–100 curated quality prior | not a popularity count |
| `maturity` | `new / proven / legacy` | ranking prior |
| `current_version_id` | currently promoted immutable version | composite-template scoped |

## 56.3 `template_versions`

Purpose: immutable render contract.

Fields that affect render/eligibility:

- `renderer_template_key`;
- `visual_direction`;
- `supported_formats`;
- `script_support`;
- `headline_capacity`;
- `body_capacity`;
- `preview_asset`;
- `validation_status`;
- `validation_notes`.

The pair `(template_id, id)` is unique and is used for composite referential integrity.

A version can exist while the parent Template remains Draft.

## 56.4 `template_targeting`

Normalized targeting dimensions:

```text
market
occasion
feeling
exclude_market
```

Positive dimensions use `affinity ∈ [0,1]`.

`exclude_market` is a hard guard and therefore conventionally stores affinity `1`.

Targeting metadata describes suitability, not identity and not customer demographics.

## 56.5 `template_events`

Raw, privacy-reduced evidence used for short-horizon analysis and rollup.

Allowed event types:

```text
impression
selected
ai_assigned
checkout_started
paid
regenerated
```

Allowed sources:

```text
ai_direction
recommended
market_pick
show_more
```

Raw event rows intentionally do **not** contain:

- recipient name;
- relationship free text;
- message/body/headline;
- user photo bytes/key;
- payment details;
- IP address;
- email address.

`dedupe_key` is optional. Browser `impression/selected` events use an HMAC-derived dedupe key so replaying the same signed surface token does not inflate evidence. Server-authoritative events may remain without this browser dedupe key.

## 56.6 `template_metrics_daily`

Purpose: inexpensive long-lived aggregated evidence for operator visibility and ranking evolution.

Primary dimensions:

```text
day + template + market + source
```

Metrics:

- impressions;
- selected;
- AI assigned;
- checkout started;
- paid;
- regenerated.

This table is an aggregate, not a customer ledger.

---

# 57. Ranking algorithm — normative semantics

The implementation launch weights are:

```text
brief relevance        35%
market affinity        20%
editorial quality      20%
historical performance 15%
text fit                5%
freshness/maturity      5%
```

Photo compatibility applies as an additional multiplicative fit factor after the weighted sum.

## 57.1 Brief relevance

Brief relevance combines:

```text
feeling affinity 55%
occasion affinity 45%
```

Missing explicit affinity contributes zero rather than guessing cultural meaning.

## 57.2 Market affinity

Preferred lookup:

1. exact normalized market affinity;
2. otherwise a reduced GLOBAL affinity fallback.

A market exclusion eliminates the template before scoring.

Market affinity must never be inferred from race, ethnicity or another protected personal attribute.

## 57.3 Editorial score

Editorial score is the curated quality prior and is especially important while behavioral data is sparse.

Operators should change it intentionally and infrequently. It is not a manual “force this to #1” knob.

## 57.4 Historical performance

Historical performance uses normalized rates, evidence confidence and Bayesian-style smoothing.

Raw counts such as `usage_count` must not be directly added to ranking.

The implementation uses:

- smoothed paid rate;
- smoothed selection rate;
- a regeneration penalty;
- an evidence factor that grows with impressions;
- editorial score as the low-evidence prior.

This prevents:

```text
AI shows A often
→ A accumulates usage
→ usage makes A rank higher
→ AI shows A even more
```

## 57.5 Text fit

The ranking input may include body pressure from the existing Magic Typography density model.

High copy pressure penalizes templates with smaller body capacity. It does not override the renderer’s final hard overflow guard.

## 57.6 Maturity/freshness

Launch semantics:

- `new` receives enough freshness to gather evidence;
- `proven` remains stable;
- `legacy` gradually loses ranking priority but remains usable while healthy/active.

Do not implement an experimentation platform merely to tune this field.

## 57.7 Deterministic ordering

For an identical catalog snapshot + rank input + metrics snapshot, ranking is deterministic.

Tie breakers must not use random client state. This makes behavior debuggable and avoids unexplained market drift.

---

# 58. Surface allocation — normative 4 + 4 + 8 behavior

The ranker first builds one compatible ordered pool.

Allocation then applies:

1. reserve up to four strong market candidates;
2. select up to four Recommended from remaining inventory;
3. fill an undersized Market row with best remaining global/curated inventory;
4. fill an undersized Recommended row if necessary;
5. take up to eight additional unused candidates for Show more.

This reservation order prevents a market with four genuinely strong local candidates from having those same candidates consumed entirely by the Recommended row.

The UI order remains:

```text
Recommended
Market/Curated
Show more
```

Allocation order and UI order are intentionally different concerns.

## 58.1 Market label rule

The API returns evidence such as `marketSpecificCount`/`marketMatch`.

UI rule:

- if the row contains genuine market-affinity inventory, local/market wording may be used;
- if the row is only fill, use neutral “Curated” language.

Never fabricate cultural localization to make the UI look richer.

---

# 59. Three-direction AI diversity contract

Three initial directions are not simply the top three scores.

Launch archetypes:

### Without photo

```text
editorial
midnight
quiet
```

### With photo

```text
editorial
midnight
photo
```

The system should also prefer one template per family and avoid duplicate visual directions where enough inventory exists.

If the exact target archetype is unavailable, a future implementation may use a documented deterministic fallback, but must not silently return three near-identical templates and call that “three directions.”

---

# 60. Admin publish/version governance

## 60.1 Safe mutable metadata

May change without a new render version:

- customer display name;
- material/finish copy;
- status;
- health;
- editorial score;
- maturity;
- feeling/occasion/market affinity;
- excluded market metadata.

## 60.2 Version-required changes

Create an immutable vN for changes that affect render or compatibility, including:

- renderer template key;
- visual direction;
- format set;
- script set;
- text capacity assumptions;
- render geometry/layout behavior represented by a new approved renderer contract.

## 60.3 Validation/publish gate

An Active template must point to a version whose `validation_status = passed` and whose parent health is `healthy`.

An admin-created version can only declare a subset of the capability already approved for its renderer key. Metadata cannot expand a renderer from Latin-only to CJK or from one format to another unsupported format.

## 60.4 Recommended publish QA

Before promoting a genuinely new renderer-backed version, controlled-runtime QA SHOULD execute:

```text
schema validation
renderer smoke render
all declared formats
all declared script groups
short / representative / dense copy
photo path when applicable
300-DPI JPG dimensions
PDF physical dimensions
WCAG photo treatment when applicable
deterministic hash/retry behavior
no external resource fetch
no raw SVG/HTML/CSS/JS injection
```

A DB-only variant that reuses a renderer already approved for those exact capabilities may inherit renderer validation, but still requires editorial preview/targeting review.

---

# 61. Template analytics integrity model

Template analytics are decision support. They must not be easy to poison accidentally or by simple replay.

## 61.1 Server-authoritative events

Prefer server authority for:

- `ai_assigned`;
- `checkout_started`;
- `paid`.

These events should be derived from durable generation/card/order state rather than trusted client claims.

## 61.2 Browser events

Browser-originated launch events are limited to:

- `impression`;
- `selected`;
- `regenerated`.

A customer-visible slot receives a short-lived HMAC capability token.

Step 12 token v2 binds:

```text
template id
template version id
surface source
rank position
market
locale
anonymous session id
surface nonce
expiry
```

Properties:

- HMAC SHA-256;
- timing-safe verification;
- short TTL;
- cross-anonymous-session replay rejected;
- tampering with source/position/market/locale/template/version rejected;
- signed surface token is not a payment or download capability.

## 61.3 Replay dedupe

For browser `impression/selected`, server computes a deterministic HMAC dedupe key from:

```text
anonymous session
+ event type
+ exact signed surface token
```

The DB unique constraint turns repeat submission of that same event/surface into a no-op.

A new discovery response receives a new surface nonce/token and may produce new legitimate evidence.

`regenerated` may remain repeatable because repeat regeneration is itself useful negative-signal evidence.

## 61.4 Rate limiting

Event ingestion remains separately rate-limited by anonymous session. Capability validity does not replace abuse rate limits.

---

# 62. KPI definitions and interpretation

No single KPI is “the best template.”

Recommended operator indicators:

```text
selection rate      = selected / impressions
checkout rate       = checkout_started / relevant exposure or selection
paid conversion     = paid / impressions (or selection, depending report)
regeneration rate   = regenerated / selected
AI assignment share = ai_assigned / total AI assignments in cohort
```

Reports must always state the denominator.

Compare by:

- market;
- source;
- time window;
- optionally locale/occasion once sample size supports it.

A template appearing in `recommended` position 1 should not be compared naively to a `show_more` position 7 template without considering placement bias.

Low-sample results should be displayed as low confidence rather than treated as decisive.

---

# 63. API contract summary

Detailed operational examples are maintained in `TEMPLATE_API_CONTRACTS_0.4.3_STEP12.md`.

Launch endpoints:

```text
GET    /api/templates
POST   /api/templates/events
GET    /api/admin/templates
POST   /api/admin/templates
PATCH  /api/admin/templates/:templateId
DELETE /api/admin/templates/:templateId   # archive semantics
GET    /api/admin/templates/:templateId/versions
POST   /api/admin/templates/:templateId/versions
```

Admin mutations require both protected admin authentication and the Step 12 admin-action header enforced at the proxy boundary.

Public discovery must fail closed in live mode if the managed catalog is unavailable. Bootstrap in-memory templates are a mock/development fallback, not a production shadow catalog.

---

# 64. Caching, concurrency and race policy

## 64.1 Public discovery cache

Template discovery may use a short private response cache because:

- the result is query-context dependent;
- analytics tokens are short-lived capabilities;
- the catalog can change operationally.

Do not put signed event-token responses into a shared public CDN cache unless token/session semantics are redesigned for it.

## 64.2 Admin/current-version race

The checkout browser sends the exact version previewed. Server validates that exact active/healthy/passed version rather than resolving `current_version_id` again.

Therefore:

```text
preview v1
admin activates v2
checkout still purchases v1
```

is expected behavior.

## 64.3 Archive race

If a customer has already previewed a template and it is archived before checkout, current launch server validation may refuse new checkout because archived templates are no longer eligible for a new sale. The UI should refresh/recommend another style rather than silently substitute a different version.

Paid historical orders are unaffected.

---

# 65. Migration, rollback and rollout contract

## 65.1 Migration order

Apply database migrations sequentially:

```text
0001 ... 0007
0008_managed_templates.sql
```

Do not apply 0008 before the code that understands managed template IDs is ready for controlled rollout.

## 65.2 Seed semantics

The bootstrap seed uses stable UUIDs and `ON CONFLICT DO NOTHING` so migration re-execution does not overwrite operator-managed targeting/editorial state.

The seed establishes the trusted launch bridge from existing renderer keys into the managed catalog.

## 65.3 Pre-activation checks

Before setting production traffic to Step 12:

1. confirm all seed family/template/version counts;
2. confirm every Active template has a valid current version;
3. confirm template catalog readiness returns healthy coverage;
4. run 4+4+8 discovery in representative markets/scripts;
5. run exact-version race test;
6. run archive-history test;
7. run analytics token tamper/session/replay tests;
8. verify admin is unreachable without HTTPS/auth;
9. verify Dodo paid final/recovery with exact managed version.

## 65.4 Rollback principle

Application rollback must **not** delete managed-template tables or historical template identity.

If Step 12 application code must be rolled back during controlled launch:

- preserve migration 0008 data;
- stop new Step 12 traffic;
- do not destroy exact version references already written;
- restore forward with a compatible Step 12+ build rather than attempting destructive schema downgrade.

Historical paid records are more important than returning the schema to an earlier cosmetic shape.

---

# 66. Step 12 Definition of Done

Step 12 is code-complete only when all of the following are true:

### Product

- 3 AI directions remain primary.
- optional template discovery is capped at 8 then +8.
- market row labeling cannot make false localization claims.
- manual selection preserves exact version.

### Catalog

- family/template/version/targeting model exists.
- archive replaces destructive removal.
- current version is template-scoped by DB constraint.
- renderer capability cannot be expanded from admin metadata.

### AI

- ranking happens before provider generation.
- AI cannot invent renderer/template IDs.
- diversity contract is enforced deterministically.
- Step 4 fallback remains intact.

### Analytics

- normalized evidence, not raw usage count, feeds performance.
- source/rank attribution is preserved.
- token is short-lived, HMAC-signed and anonymous-session bound.
- repeat impression/selection replay is DB-deduped.
- raw events have bounded retention and daily rollup.

### Commerce

- checkout validates exact template/version pair.
- paid attribution is server-authoritative.
- historical render/recovery remains deterministic after archive/new versions.

### Operations

- production readiness checks catalog coverage.
- admin requires HTTPS/auth/mutation guard.
- live catalog failure is fail-closed.
- migration/rollback instructions preserve historical identity.

### Validation boundary

A source/runtime-targeted PASS does not equal a full production PASS. Full workspace build, real DB migration, real Dodo/R2/AI integration, native visual QA and Pi/Oracle failover remain controlled-runtime launch gates.
