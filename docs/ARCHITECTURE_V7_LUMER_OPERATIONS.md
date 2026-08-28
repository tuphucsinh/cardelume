# CardeLume Architecture V7 — Step 13 Product Core + Lumer Operations

## 0. Document role

This document is the **current technical architecture map** for the V7 / Step 17I baseline.

Use together with:

1. `MASTER_SPEC_V7.md` — product/governance authority.
2. `TEMPLATE_SYSTEM_SPEC_0.4.3_STEP12.md` + Step 13 AI Creative Director docs — detailed template/creative contracts.
3. `GOVERNANCE_COMPRESSION_0.4.3_STEP17G.md` — current validation execution model.
4. `PREMIUM_EXPERIENCE_CONVERGENCE_0.4.3_STEP17I.md` — current customer-experience source delta.
5. `VALIDATION_REPORT_0.4.3_STEP17I.md` — current claims/evidence boundary.
6. `STEP18_CONTROLLED_RUNTIME_RUNBOOK.md` — controlled-runtime execution contract.

Historical Step evidence lives in previously frozen baselines; see `HISTORY_INDEX.md`. Current implementation-backed documents win over superseded plans.

---

# 1. Architectural intent

CardeLume is a premium AI-assisted greeting-card product, not a generic document editor and not a template marketplace.

The architecture optimizes for:

- a tiny customer brief;
- AI doing the composition work;
- three high-quality initial directions;
- optional, bounded style exploration;
- deterministic paid output;
- no account requirement for normal purchase;
- one-time payment;
- private final assets;
- secure paid recovery;
- low operational cost;
- Pi5-first deployment with Oracle/VPS fallback;
- clean infrastructure boundaries that can later support adjacent Lume products without forcing CardeLume itself into a generic SaaS abstraction.

Core rule:

> **Generic infrastructure. Specific product experience.**

---

# 2. System context

```text
Customer browser
      │
      ▼
Cloudflare / public edge
      │
      ├───────────────► Pi5 web node (preferred)
      │
      └───────────────► Oracle/VPS web node (fallback)
                              │
                              ▼
                    CardeLume Next.js web
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
      Postgres             R2 private          Dodo Payments
      / Supabase           object store        checkout/webhook
          │
          ▼
       pg-boss
          │
          ▼
  CardeLume worker(s)
          │
          ├────────► AI provider
          ├────────► Card renderer
          └────────► private R2 finals
```

The browser never becomes the authority for:

- payment state;
- paid entitlements;
- renderer execution;
- R2 clean/final object keys;
- managed template validity;
- managed template current version;
- AI-generated template identity;
- template analytics attribution integrity.

---

# 3. Runtime components

## 3.1 Web application

Location:

```text
apps/web
```

Responsibilities:

- public landing/product experience;
- locale/market presentation;
- anonymous browser session boundary;
- CardeLume Studio UI;
- pricing quote issuance/verification;
- durable generation job creation/status access;
- managed template discovery;
- signed template analytics capabilities;
- trusted photo upload authorization/completion;
- checkout session creation;
- Dodo webhook endpoint;
- paid-return/recovery UX;
- private download authorization;
- admin template management;
- health/readiness APIs.

The web app does **not** perform long-running final rendering in the request path.

## 3.2 Worker

Location:

```text
apps/worker
```

Responsibilities:

- consume durable pg-boss jobs;
- generate AI directions;
- persist generation lifecycle/results;
- render paid JPG/PDF;
- verify trusted photo bytes before final render;
- create idempotent final entitlements;
- run cleanup/retention jobs;
- roll up template metrics;
- expire stale generation/asset state;
- publish readiness heartbeat.

The worker is required for production readiness.

## 3.3 Shared packages

### `@cardelume/card-schema`

Owns CardeLume-specific structured contracts:

- CardBrief / generation brief;
- CardDocument;
- generated directions;
- typography pressure rules;
- photo contrast helpers/shared render-safe data.

This remains CardeLume-specific.

### `@cardelume/templates`

Owns pure managed-template logic:

- `TemplateMeta`;
- eligibility;
- affinity scoring;
- normalized performance;
- ranking;
- surface grouping;
- generation diversity;
- bootstrap trusted renderer-backed catalog.

This package must remain deterministic and provider-independent.

### `@cardelume/db`

Owns server-only persistence boundaries for:

- cards/versions;
- generation jobs;
- payment/orders;
- recovery;
- photo assets/bindings;
- operational heartbeat/rate limits;
- managed templates/versions/targeting/events/metrics.

Browser code must not import server DB connectivity.

### `@cardelume/queue`

Owns queue infrastructure and active CardeLume job definitions.

Infrastructure may remain product-neutral where practical, but CardeLume job payload/business behavior is allowed to be CardeLume-specific.

### `@cardelume/ai`

Owns provider access boundary and structured generation transport.

The provider is not allowed to own product selection policy; template eligibility/ranking remains CardeLume logic.

### `@cardelume/renderer`

Owns deterministic CardeLume rendering and export.

It is deliberately **not** a `UniversalRenderer`.

### `@cardelume/storage`

Owns private object-store operations and signed access primitives.

Storage should not need to know CardeLume visual semantics.

---

# 4. Data stores and ownership

## 4.1 Postgres

Postgres is authoritative for mutable business state.

Main domains:

```text
cards
card_versions

generation_jobs

orders
order_items
payment_events
checkout_return_claims

purchase_recovery
recovery_sessions
download_entitlements

photo_assets
card_asset_bindings

worker_heartbeats
rate_limit_buckets

template_families
templates
template_versions
template_targeting
template_events
template_metrics_daily
```

No browser redirect, local state or provider URL is authoritative payment state.

## 4.2 R2

R2 is used for private binary objects:

- upload quarantine;
- sanitized/clean customer photo assets;
- final JPG;
- final PDF.

Paid final objects are private.

The browser receives only:

- constrained short-lived upload URLs for quarantine;
- short-lived signed download URLs after entitlement/recovery authorization.

The browser does not provide arbitrary trusted R2 keys to the renderer.

## 4.3 pg-boss

pg-boss provides durable jobs on the same Postgres infrastructure.

Active job surface includes production generation/final/cleanup behavior actually implemented by CardeLume. Unimplemented historical scaffold queues are not advertised as production capabilities.

---

# 5. Identity model

## 5.1 Anonymous customer identity

Normal customer flow does not require account creation.

A server-issued anonymous identifier scopes:

- pricing quote ownership;
- generation job ownership;
- photo asset ownership;
- checkout ownership;
- rate limiting.

Malformed anonymous session state must recover cleanly rather than trapping the customer indefinitely.

## 5.2 Generation capability

Generation polling requires a short-lived/expiring server-signed capability bound to:

```text
jobId
anonymous owner
expiry
```

Knowing a job UUID alone is insufficient.

## 5.3 Template analytics capability

Browser-originated template analytics requires a separate HMAC capability bound to:

```text
templateId
templateVersionId
source
rankPosition
market
locale
anonymousSessionId
surfaceNonce
expiry
```

This prevents arbitrary browser traffic from freely poisoning performance evidence used by ranking. Browser impression/selection replay is additionally deduplicated with a server-HMAC `dedupe_key`; a token from another anonymous session is rejected.

## 5.4 Paid recovery identity

Paid recovery uses a high-entropy recovery secret whose raw durable value is not stored in Postgres.

Recovery browsing uses a separate secure session cookie boundary.

---

# 6. Card lifecycle

```text
Anonymous session
      ↓
Small brief
      ↓
Pricing quote / market normalization
      ↓
Durable generation job
      ↓
Template eligibility + ranking
      ↓
Three trusted template versions
      ↓
AI structured copy generation
      ↓
3 premium directions
      ↓
Customer chooses
      ↓
Optional bounded template exploration
      ↓
Finish / typography guard
      ↓
Checkout snapshot + exact template version
      ↓
Dodo checkout
      ↓
Verified webhook
      ↓
Authoritative PAID
      ↓
Final-render job
      ↓
Deterministic JPG/PDF
      ↓
Private R2
      ↓
Entitlements
      ↓
Secure recovery / signed download
```

---

# 7. Generation architecture

## 7.1 Request boundary

Generation request must:

- be in live mode for production provider behavior;
- have valid anonymous ownership;
- use an idempotency key;
- use a valid price quote;
- normalize market server-side;
- pass rate limiting.

## 7.2 Durable state

The request persists a generation job before relying on long-running provider work.

State is durable across browser refresh/reconnect.

Representative states:

```text
queued
planning
composing
rendering
ready
failed
```

## 7.3 Rank before AI

The worker performs:

```text
brief
↓
managed catalog
↓
hard eligibility
↓
rank
↓
diversity selection
↓
3 exact template versions
↓
AI provider
```

AI does not receive permission to select from arbitrary database rows or invent renderer identities.

## 7.4 AI failure

Provider/network/schema/queue failure must not force the customer to restart the brief.

Step 4 curated fallback remains a customer-experience safety layer.

Fallback is not evidence that live AI is healthy; operational health must remain separately observable.

---

# 8. Managed template architecture

## 8.1 Domain hierarchy

```text
Template Family
      │
      ├── Template A
      │      ├── immutable v1
      │      └── immutable v2
      │
      └── Market/style variant
             └── immutable v1
```

Family is used for product organization and diversity.

Template is mutable identity/targeting/lifecycle metadata.

Template Version is immutable render compatibility identity.

## 8.2 Renderer separation

A managed template does not contain executable design code.

It references:

```text
renderer_template_key
```

which must already exist in the approved CardeLume renderer catalog.

Admin cannot create a new executable renderer implementation.

Admin-declared supported formats/scripts must be equal to or a subset of the approved renderer key capability; metadata cannot expand a renderer into an unvalidated format/script.

## 8.3 Exact version invariant

For a managed card version:

```text
managed_template_id IS NULL
AND managed_template_version_id IS NULL
```

or:

```text
both are non-NULL
AND composite FK matches the same template/version
```

There is no half-bound managed template identity.

Template analytics events also require exact non-NULL version identity.

## 8.4 Lifecycle

Launch lifecycle:

```text
DRAFT
  ↓
ACTIVE
  ↓
ARCHIVED
```

Health is independent:

```text
HEALTHY
DEGRADED
INVALID
```

Selection requires active + healthy + validation-passed current version.

## 8.5 Version rule

Safe mutable metadata includes:

- display name;
- material description;
- editorial score;
- market/occasion/feeling targeting;
- maturity;
- lifecycle/health.

Pixel/output-affecting identity changes create a new immutable version.

Existing orders never float to a newly published current version.

---

# 9. Template eligibility and ranking

## 9.1 Hard eligibility

Before scoring, exclude candidates that fail any required boundary:

- not active;
- not healthy;
- version not validation-passed;
- unsupported card format;
- unsupported script group;
- excluded market;
- photo required but no trusted photo is available.

Hard eligibility is not an LLM decision.

## 9.2 Soft scoring

Step 12 starting weights:

```text
brief relevance / occasion / feeling   35%
market affinity                         20%
editorial quality                       20%
smoothed historical performance        15%
text-fit compatibility                   5%
freshness                                5%
```

Weights are policy/configuration, not irreversible database semantics.

## 9.3 Historical performance

Do not rank by raw usage.

Performance must be normalized by exposure and smoothed for sample confidence so that:

- frequently exposed templates do not win merely because they were already frequent;
- a new template with 3 conversions from 5 impressions does not instantly outrank a proven template with thousands of observations.

## 9.4 Diversity pass

Three AI directions should maximize quality subject to diversity constraints.

Do not surface three near-identical siblings merely because their scores are adjacent.

Family/archetype diversity is a deterministic post-ranking constraint.

---

# 10. Customer template discovery

Template discovery is intentionally bounded.

## 10.1 Primary experience

The primary customer experience remains the three AI-created directions.

## 10.2 Secondary browser

Only after the customer chooses to explore styles:

```text
4 Recommended
+
up to 4 qualified Market Picks / curated fill
```

Then:

```text
Show 8 more
```

returns at most eight additional unique candidates.

Maximum surfaced set is bounded; no infinite scroll.

## 10.3 Market labels

If there is insufficient strong market-specific inventory, global curated candidates fill the slots.

UI must not falsely label global fill as locally designed/market-popular.

---

# 11. Template analytics architecture

## 11.1 Events

Supported evidence includes:

```text
impression
selected
ai_assigned
checkout_started
paid
regenerated
```

## 11.2 Source

Attribution preserves:

```text
ai_direction
recommended
market_pick
show_more
```

and rank position where meaningful.

## 11.3 Server vs browser evidence

Server-authoritative events should be generated server-side when possible:

- AI assignment;
- checkout started;
- paid.

Browser interaction events use signed slot capabilities.

## 11.4 Privacy

Template performance events do not store:

- recipient name;
- card headline/body/message;
- photo bytes;
- recovery secret;
- payment secret.

## 11.5 Retention

Raw events are finite-retention operational evidence.

Daily metrics provide longer-lived aggregate trends without requiring indefinite raw-event storage.

---

# 12. Photo asset architecture

## 12.1 Quarantine

Browser uploads only to a constrained quarantine object via presigned PUT.

Quarantine is never renderer-trusted.

## 12.2 Sanitization

Server/worker must:

- decode supported image format;
- normalize orientation;
- bound dimensions;
- re-encode to a known clean raster form;
- strip metadata;
- record byte count and hash;
- mark asset READY only after sanitation succeeds.

## 12.3 Binding

A trusted photo asset is bound to the exact card resource version.

At checkout/final render, asset ownership/readiness/binding are re-checked.

## 12.4 Paid render

Worker retrieves the clean object and verifies expected byte/hash metadata before supplying it to the renderer.

---

# 13. Typography and contrast architecture

## 13.1 Copy density

Magic Typography rules are shared between browser and renderer where deterministic compatibility matters.

Customer is offered graceful shortening before paid render reaches a hard unsafe boundary.

Renderer fails closed rather than silently truncating paid copy or shrinking below the legibility floor.

## 13.2 Photo contrast

Photo palette/foreground contrast uses shared deterministic color logic.

Preview and final renderer should agree on contrast treatment.

WCAG readability-critical targets are fail-closed rather than decorative best effort.

---

# 14. Checkout/payment architecture

## 14.1 Persist before provider

A valid CardeLume card/version snapshot exists before creating the external payment session.

This avoids charging for an object that the system cannot identify/render.

## 14.2 Checkout idempotency

CardeLume uses a DB request hash and checkout-creation lease to prevent repeated browser actions from creating uncontrolled duplicate external sessions.

Provider idempotency must not be invented when the provider API does not document it.

## 14.3 Payment authority

Browser return redirect is not payment proof.

Only verified provider webhook data can transition the authoritative order to PAID.

## 14.4 Webhook verification

Verify on the raw request body before JSON transformation.

Then reconcile:

- expected order/session identity;
- exact amount;
- exact currency;
- event idempotency.

## 14.5 Paid transition

PAID transition and fulfillment initiation must be idempotent/resumable.

Duplicate provider delivery cannot create duplicate order entitlements/final assets.

---

# 15. Final rendering architecture

Final-render worker loads:

- authoritative PAID order item;
- persisted CardDocument/resource version;
- exact managed template version identity;
- trusted bound photo asset when required.

It does **not** accept arbitrary user-provided SVG/HTML/CSS/JS.

Output properties include:

- production JPG;
- print-ready PDF;
- launch physical dimensions;
- deterministic output behavior;
- clean paid file without preview watermark;
- private storage key;
- idempotent entitlement.

---

# 16. Secure paid recovery architecture

## 16.1 Recovery secret

- high entropy;
- DB stores hash, not raw long-lived bearer secret;
- not persisted in browser localStorage.

## 16.2 Browser recovery session

After redemption, browser uses a scoped HttpOnly/Secure/SameSite session cookie distinct from the original raw recovery secret.

## 16.3 Download

Recovery page lists server-authorized entitlements.

A signed R2 URL is generated only on an authorized download action and expires quickly.

## 16.4 Historical determinism

Template archive/current-version changes must not change files already purchased.

Order/card version and final entitlement history remain authoritative.

---

# 17. Rate limiting and abuse boundaries

Rate limiting is server-side and shared through DB-backed buckets for relevant anonymous operations, including:

- generation;
- photo authorization;
- checkout;
- template analytics.

Rate limiting is not a substitute for:

- payment verification;
- upload sanitation;
- capability authorization;
- Cloudflare edge limits.

---

# 18. Production readiness architecture

## 18.1 Liveness

`/health/live` answers whether the web process can serve a minimal request.

It is not sufficient for accepting traffic.

## 18.2 Readiness

`/health/ready` is fail-closed and includes checks for production configuration and operational dependencies such as:

- DB availability;
- current-version healthy worker heartbeat;
- payment/storage/AI/HMAC configuration;
- legal launch gate;
- managed template catalog coverage.

## 18.3 Template catalog health

Readiness requires enough active healthy catalog coverage for:

- launch card formats;
- supported script groups;
- core visual archetypes including photo where required.

An operator archive mistake can therefore remove a node from traffic instead of silently degrading generation quality.

---

# 19. Worker heartbeat and version compatibility

Workers publish heartbeat state after critical runtime initialization.

Web readiness only accepts workers matching the current `APP_VERSION`.

This prevents an upgraded web node from declaring itself healthy because an old incompatible worker process is still alive.

---

# 20. Deployment topology

Target:

```text
Cloudflare
   │
   ├── Pi5 node
   │     ├── web
   │     ├── worker
   │     └── cloudflared
   │
   └── Oracle/VPS node
         ├── web
         ├── worker
         └── cloudflared
```

Shared managed dependencies:

```text
Postgres/Supabase
R2
Dodo
AI provider
```

The exact active/fallback tunnel policy is an operations concern, but each node must fail readiness when it cannot safely accept/fulfill work.

---

# 21. Reproducible deployment

Production container builds require:

- reviewed `pnpm-lock.yaml`;
- frozen dependency install;
- pinned Node base image/version/digest;
- pinned cloudflared version/digest;
- same application version across web/worker node pair.

Do not allow Docker builds to resolve an unreviewed fresh dependency graph in production.

---

# 22. Backup/restore architecture

Backup helpers create Postgres dumps with restrictive file permissions and checksum evidence.

Restore helper requires:

- a separate/isolated restore database;
- explicit destructive-operation acknowledgement;
- no silent fallback to the live production `DATABASE_URL`.

A backup is not considered operationally proven until a restore rehearsal succeeds.

---

# 23. Security headers and data retention

Launch hardening includes:

- HTTPS production assumption;
- HSTS/security headers;
- sensitive recovery pages `no-store` / `no-referrer` / noindex behavior;
- bounded AI response size/time;
- expiring generation capabilities;
- cleanup of transient generation data;
- bounded template raw analytics retention.

CSP should be observed/report-tested before final enforcing changes to avoid breaking real checkout/render/customer flows.

---

# 24. Admin architecture

Step 12 intentionally does **not** build a general SaaS admin platform.

Template admin is a compact operational tool protected at the web/proxy boundary.

It supports only CardeLume template operations needed at launch.

Future trigger for stronger identity/SSO:

- multiple operators;
- remote team access;
- audit/compliance need;
- Cloudflare Access adoption.

Do not add customer accounts merely to reuse admin infrastructure.

---

# 25. Generic vs CardeLume-specific boundaries

## Reasonably generic infrastructure

```text
anonymous session primitives
storage
queue transport
AI provider transport
orders/payment provider boundary
recovery/session primitives
entitlements
rate limiting
observability
backup/deployment
```

## Must remain CardeLume-specific until evidence says otherwise

```text
CardBrief
CardDocument
CardeLumePlanner
CardRenderer
Template ranking policy
Template archetypes
Magic Typography
Studio UX
3-direction product flow
card-specific photo composition
market-specific card design strategy
```

Do not introduce:

```text
UniversalDocument<any>
UniversalRenderer
UniversalStudio
```

simply for hypothetical future products.

---

# 26. Transaction and idempotency principles

Critical state transitions should be designed so retries are safe.

Examples:

- generation idempotency by owner + idempotency key/request hash;
- checkout creation lease/request hash;
- webhook event idempotency;
- PAID transition is authoritative and repeat-safe;
- final R2 keys deterministic by order/item/version/renderer;
- entitlement creation idempotent;
- template event IDs idempotent;
- template version allocator serialized by transaction advisory lock.

When a provider timeout creates ambiguity, do not silently assume success or unlock value without an authoritative binding/reconciliation path.

---

# 27. Trust-boundary summary

| Boundary | Untrusted input | Required authority |
|---|---|---|
| generation | browser brief | schema + anon owner + quote + server market |
| template choice | browser template IDs | active/healthy exact managed version lookup |
| AI output | model JSON | structured schema + server-preselected templates |
| photo upload | browser bytes | quarantine + decode/re-encode/hash/binding |
| checkout | browser snapshot | server persistence + pricing quote + exact version |
| payment | redirect/webhook body | raw-body signature + exact reconciliation |
| final render | persisted document/assets | PAID order + trusted renderer + bound asset |
| recovery | bearer/session | secret hash + scoped session + entitlement |
| template analytics | browser events | signed slot capability + rate limit |
| admin | browser admin action | protected admin auth + action-header guard |

---

# 28. Failure-mode policy

## AI unavailable

Customer can receive curated fallback directions; operations still report degraded/unready as appropriate.

## Template DB unavailable

Live template browser/generation catalog fails closed; do not silently expose a fake catalog in production.

## Catalog coverage damaged

Readiness fails.

## Photo sanitizer fails

Asset never becomes trusted/READY; photo-required checkout cannot proceed as if it succeeded.

## Dodo webhook invalid

Order does not become PAID.

## Final render fails

Retry deterministic job; do not issue a bogus entitlement.

## R2 download signing fails

Keep entitlement, return controlled temporary failure; do not make final object public.

## DB/worker unavailable

Readiness removes node from eligible public traffic.

---

# 29. Observability principles

Useful telemetry:

- generation latency/failure category;
- queue age/depth;
- worker heartbeat/active jobs;
- renderer duration/failure;
- checkout creation/webhook transition;
- R2 upload sanitation failure;
- template selection/conversion by market/source;
- template regeneration/change-style signal;
- catalog coverage/readiness.

Do not log:

- raw recovery secrets;
- cookies;
- provider secrets;
- card message/recipient content unless explicitly required and privacy-reviewed;
- raw photo bytes.

---

# 30. Template system evolution policy

Start with deterministic SQL + pure ranking.

Do not add vector search, embeddings or ML ranking until there is enough inventory/data and a measurable limitation.

Potential future additions only when justified:

- experimentation allocation;
- automated confidence-based weight tuning;
- richer admin audit history;
- template renderer certification pipeline;
- additional market-specific families;
- optional-photo renderer variants;
- template preview asset pipeline;
- family-level performance analysis.

Each future feature must preserve exact versioning and deterministic paid recovery.

---

# 31. Controlled-runtime launch gate

Code-side source validation is not equivalent to production validation.

Before launch, controlled Pi/Hermes runtime must complete:

1. freeze/review dependency lockfile;
2. full install/typecheck/build/test;
3. migrations 0001–0008;
4. real Postgres/pg-boss behavior;
5. real R2 photo/final paths;
6. real AI provider generation;
7. Dodo test checkout/webhook/PAID;
8. exact-version final render/recovery;
9. template admin browser QA;
10. template analytics tamper/expiry QA;
11. catalog readiness break/recover test;
12. backup/restore rehearsal;
13. Pi5 load/temperature/resource QA;
14. Oracle/VPS failover rehearsal;
15. legal approval;
16. mobile/browser/native-language visual QA.

---

# 32. Architectural definition of done

CardeLume is launch-ready only when the following chain is proven with real services:

```text
brief
→ durable generation
→ server-ranked managed template versions
→ 3 premium directions
→ optional bounded style exploration
→ exact version selection
→ trusted photo if needed
→ verified payment
→ authoritative PAID
→ deterministic private JPG/PDF
→ entitlement
→ secure recovery
```

and both production nodes demonstrate readiness/failover without weakening payment, asset, template-version or recovery trust boundaries.

---

# 33. Step 12 request/sequence architecture

## 33.1 AI generation sequence

```text
Browser
  │ POST /api/generate + idempotency key
  ▼
Web
  │ verify anonymous session + pricing quote + rate limit
  │ persist durable generation job
  ▼
pg-boss
  ▼
Worker
  │ load managed active catalog
  │ hard eligibility
  │ deterministic rank + diversity
  │ select exact 3 template versions
  │ call AI provider with fixed template slots
  │ validate structured result
  │ persist result with exact template/version identity
  ▼
Web status route
  │ verify generation owner/status capability
  │ attach short-lived, anonymous-session-bound template event capabilities
  ▼
Browser
```

Authority boundaries:

- browser owns brief intent, not template authority;
- worker/ranker owns template choice for AI-assigned directions;
- AI owns language/content generation within fixed safe slots;
- renderer identity is never accepted from model output as free-form authority.

## 33.2 Manual template discovery sequence

```text
Browser chooses "Explore more styles"
  │
  │ GET /api/templates(context)
  ▼
Web
  │ require anonymous session
  │ derive trusted market from edge
  │ load active managed catalog
  │ hard eligibility
  │ deterministic ranking
  │ reserve Market Picks
  │ allocate Recommended
  │ allocate +8 More
  │ sign each slot capability for this anonymous session
  ▼
Browser
  │ shows max 8
  │ optional +8
```

The public API never returns the entire administrative catalog.

## 33.3 Manual selection → checkout sequence

```text
Browser selects exact template version
  │
  │ stores templateId + templateVersionId + source in card state
  ▼
Checkout API
  │ schema pair guard
  │ exact-version DB validation
  │ persist exact managed identity on card_version/order snapshot
  │ record server-side checkout_started
  │ create/reuse verified payment session
  ▼
Dodo
  │ verified raw-body webhook
  ▼
DB authoritative PAID
  │ record server-side paid attribution
  ▼
final_render worker
  │ load exact CardDocument/version
  ▼
private JPG/PDF + entitlement + recovery
```

## 33.4 Admin publish sequence

```text
Operator
  │ authenticated /admin/templates
  ▼
Create Draft / family variant
  │
  ▼
approved renderer key only
  │
  ├── metadata/targeting review
  ├── optional immutable vN creation
  └── validation must be passed
  ▼
Publish Active
  │
  ▼
/health/ready catalog coverage
```

An operator cannot create code/render capability from database metadata.

---

# 34. Data ownership matrix

| Data | Browser may propose? | Server authority | AI authority | Historical immutable? |
|---|---:|---:|---:|---:|
| Occasion/feeling/brief | yes | validates | interprets | card snapshot after checkout |
| Market | no in live mode | edge/server | consumes context | pricing/order snapshot |
| Template ID for AI direction | no | ranker | no | yes once card/version persisted |
| Template ID for manual choice | chooses from signed returned options | validates exact pair | no | yes |
| Template current version | no | admin/DB | no | no; pointer mutable |
| Template version render contract | no | source + DB | no | yes |
| Renderer key | no | approved source inventory | no | yes per version |
| Template targeting | no | admin/DB | no | mutable editorial metadata |
| Template metrics | emits limited evidence | server/DB | no | aggregated history |
| Payment state | no | verified Dodo webhook/DB | no | authoritative ledger |
| Final R2 object | no | worker/storage | no | entitlement-pinned |

---

# 35. Template analytics trust architecture

Step 12 analytics capability is intentionally narrower than authentication.

```text
Web creates surface slot
  │
  ├─ exact template/version
  ├─ source/rank
  ├─ market/locale
  ├─ anonymous session UUID
  ├─ random surface nonce
  └─ expiry
       ↓
   HMAC SHA-256
       ↓
Browser token
       ↓
POST browser event
       ↓
server verifies same anonymous session + slot
       ↓
HMAC replay dedupe key for impression/selected
       ↓
template_events UNIQUE(dedupe_key)
```

This limits easy metric poisoning without adding login friction.

Server-authoritative commercial events bypass this browser capability and are derived from durable state.

---

# 36. Concurrency invariants

## 36.1 Current version

`templates.current_version_id` is constrained as `(template_id, current_version_id)` → `template_versions(template_id,id)`.

It is therefore impossible for Template A to point at Template B's version.

## 36.2 Card snapshot

`card_versions(managed_template_id, managed_template_version_id)` must point to the same exact template/version pair.

The application also enforces pair completeness.

## 36.3 Checkout race

Checkout never resolves "latest" after user selection. It validates the exact version already in the card state.

## 36.4 Version allocation

New version number allocation is transactional/serialized per template so concurrent admin requests cannot both become the same vN.

## 36.5 Analytics replay

A repeated browser event with the same anonymous session + event type + signed surface token results in the same dedupe key; unique DB conflict turns the replay into a no-op.

---

# 37. Caching architecture

## Public discovery

Short **private** cache is acceptable.

Reasons not to use long shared cache:

- market/query context changes;
- catalog is operationally mutable;
- signed tokens are session-bound and short-lived.

## Admin

No-store.

## Generation status

No-store because it carries owner-protected status and signed slot capabilities.

## Metrics

Operator aggregate queries may later use server cache, but raw event ingestion must remain uncached.

---

# 38. Catalog-readiness architecture

Readiness is not just “templates table exists.”

A production node should fail readiness when the active catalog cannot provide the minimum technical/art-direction coverage CardeLume promises.

Coverage dimensions include:

- all launch formats;
- Latin;
- CJK;
- Hangul;
- core non-photo archetypes;
- photo archetype.

This protects against operational mistakes such as archiving an entire required archetype.

Readiness is a launch safety signal, not a ranking signal.

---

# 39. Failure containment

## Catalog query failure

Live discovery/generation path must fail closed or use the existing curated generation fallback where safe. It must not silently expose a stale hard-coded catalog as if production DB were healthy.

## Analytics storage failure

Do not block card creation/checkout. Metrics are secondary to customer success.

## Admin mutation failure

Return explicit conflict/unavailable result; never partially expand renderer capability.

## Template becomes invalid

Set health `invalid`/archive; new ranking excludes it. Historical exact versions remain for paid recovery.

## Bad market configuration

Strong global fallback is preferable to lowering hard eligibility or presenting weak local inventory.

---

# 40. Privacy architecture for template intelligence

Template intelligence does not require storing customer card content in analytics.

Allowed aggregate context is deliberately narrow:

- template/version;
- event type;
- source;
- rank position;
- market;
- locale;
- timestamp.

The anonymous session identifier is bound cryptographically to a short-lived event token but is not stored directly in `template_events` by Step 12.

Raw events are time-bounded; daily aggregates are retained for product trend analysis.

---

# 41. Market-intelligence architecture

Market intelligence is an editorial/performance input, not a demographic personalization engine.

```text
trusted edge country
      ↓
market affinity / exclusion
      ↓
rank adjustment
```

Never derive market preference from protected personal traits.

Local-market template variants should be introduced only when there is concrete design/typography/editorial reason.

---

# 42. Deployment/rollout compatibility

Step 12 adds DB migration `0008_managed_templates.sql` and application code expecting it.

Recommended controlled rollout:

```text
backup
→ migrate DB
→ deploy matching worker + web APP_VERSION
→ readiness/catalog smoke
→ limited E2E
→ normal traffic
```

Do not destructively downgrade migration 0008 after exact version references have been written. Roll forward with compatible code.

---

# 43. Architecture acceptance invariants

The architecture is considered intact only if all remain true:

1. customer does not need to browse templates to get a result;
2. AI cannot invent catalog identity;
3. admin cannot upload arbitrary renderer code;
4. exact template version is commerce/recovery identity;
5. active/passed/healthy and compatibility gates happen before ranking/checkout;
6. market affinity is quality-gated and can fall back global;
7. raw popularity does not directly rank templates;
8. analytics attribution retains source and position;
9. browser analytics is session-bound, signed and replay-deduped;
10. archive never destroys historical paid render identity;
11. readiness notices broken catalog coverage;
12. template subsystem does not weaken Step 1–11 payment, recovery, photo, AI, renderer, security or HA boundaries.

---

# Step 13 architecture delta — Creative Orchestration

```text
GenerationBrief
  ├── RecentStyleFingerprint[] (bounded, content-free)
  └── Template catalog
          ↓
Hard eligibility
          ↓
Soft ranking + novelty prior
          ↓
CandidatePack { fit[<=6], wildcards[<=2] }
          ↓
Premium Creative Director
   ├── selects exactly 3 supplied immutable versions
   ├── may request bounded expansion
   ├── creative thesis / signature move / accent mode
   └── premium copy
          ↓
Deterministic Creative Quality Gate
          ↓
conditional targeted critic/repair
          ↓
GenerationResult → Studio
```

Trust boundaries:

- Browser never chooses or invents AI candidate IDs during generation.
- Provider output template IDs must be a subset of server-supplied candidate IDs/versions.
- AI cannot override template health, format, script, photo or renderer compatibility.
- Style memory stores no copy, recipient, detail or photo.
- AI usage ledger stores metrics, not raw secrets/prompts.


# Step 13 final orchestration state machine

```text
safe catalog
  ↓ hard eligibility
ranked candidates + recent-style prior
  ↓
6 fit + 2 wildcards
  ↓
Creative Director #1
  ├─ select 3 → local premium gate
  └─ expand_pool(reason, traits)
          ↓
      <=16 pool (~75% fit / ~25% exploration)
          ↓ carries prior AI critique
      Creative Director #2
          ↓
      local premium gate

local gate PASS → persist result
local gate RISK → conditional critic
  ├─ ordinary risk: exact template/version locked
  └─ creative_range: may replace risky direction from supplied pool
          ↓
      local premium gate again
          ├─ PASS → persist result
          └─ critical risk remains → Step 4 curated fallback
```

The deterministic layer never parses free-form `desiredTraits` into new hard rules. Those traits are returned to the premium model with the expanded safe candidate context. This deliberately keeps semantic creativity with AI while the engine retains only safety/compatibility authority.


# 44. V7 operating-system context

V7 adds an **internal operating plane** around the Step 13 product core. It does not put Hermes/Lumer in the request path for customer generation, checkout or fulfillment.

```text
                         PUBLIC / CUSTOMER PLANE
Browser → Cloudflare → CardeLume Web → Postgres / Queue / Worker / R2 / Dodo / AI
                                      │
                                      │ metrics, health, curated admin APIs
                                      ▼
                         INTERNAL OPERATING PLANE
             Lumer profile on Pi5 / approved operator host
               │      │       │       │        │
             skills  Lab   Research  Audit   Control Center
               │      │       │       │        │
               └──────────── approval boundaries ────────────┐
                                                             ▼
                                                     Production changes
                                                    (owner approval gated)
```

Lumer failure must never make the public site unavailable.

# 45. Lumer profile isolation architecture

Use one dedicated Hermes profile named logically **Lumer** (recommended CLI slug: `lumer`). Hermes profiles are isolated homes with their own config, environment, memory, sessions and skills. Do not run multiple concurrent agents against the same Lumer profile state.

Recommended bootstrap:

```bash
hermes profile create lumer
lumer config set terminal.cwd <LUME_WORKSPACE_ROOT>
```

Do not clone unrelated personal memories into Lumer by default. Configure models/providers/tools explicitly.

Profile-owned state:

```text
~/.hermes/profiles/lumer/
├── config.yaml
├── .env                 # secrets; never commit
├── SOUL.md              # Lumer operating identity
├── memories/
├── sessions/
└── state...
```

Project-owned CardeLume procedures:

```text
<cardelume>/.hermes/skills/
```

The repo-local directory is the preferred home for CardeLume procedures because the skills are versioned, reviewable and active only in the trusted project.

# 46. Lumer skill architecture

Skills must be narrow procedures, not giant permanent prompts. This preserves progressive disclosure and token efficiency.

Core CardeLume skill groups:

```text
creative/
  cardelume-template-author
  cardelume-premium-review
  cardelume-template-portfolio
  cardelume-market-adaptation
  cardelume-publish-qa

operations/
  lume-project-health
  lume-release-audit
  lume-experiment-manager
  lume-incident-response
  lume-backup-restore-audit

research/
  lume-market-intelligence
  lume-competitive-pricing
  lume-visual-reference-scout

assurance/
  lume-ip-copyright-audit
  lume-security-audit
  lume-localization-qa

analytics/
  lume-ai-economics
  lume-product-effectiveness
```

Any skill that can write production state must call an approval-gated mechanism rather than embedding production credentials or bypasses.

# 47. Premium Benchmark Lab architecture

Benchmark artifacts must be reproducible and separate from customer data.

```text
benchmarks/
├── golden-briefs/
├── rubrics/
├── fixtures/
├── runs/
└── reports/
```

Minimum benchmark dimensions:

- representative market/locale/occasion coverage;
- no-photo and photo cases;
- short/medium/long copy pressure;
- ambiguous and emotionally difficult briefs;
- repeated simulated-user sequences for novelty;
- 3+ reruns per brief for variance;
- human/editorial review as final premium authority;
- model/prompt/template/ranking comparison without changing multiple major variables at once.

Benchmark output is evidence, not production telemetry.

# 48. Experiment and staging architecture

Use four conceptual lanes:

```text
DEV → EXPERIMENT → STAGING → PRODUCTION
```

Experiment and staging must not write to production customer/order tables or production object prefixes.

Required isolation:

- separate DB/project/schema with explicit environment identity;
- separate R2 bucket or strongly isolated prefix/credentials;
- Dodo test mode only;
- isolated analytics namespace;
- AI daily/run budget caps;
- feature flags default OFF;
- synthetic/anonymized test fixtures;
- separate admin/access policy;
- rollback and kill switch for every promoted experiment.

Production promotion is a release operation, not a git merge alone.

# 49. IP/provenance architecture

Every production creative asset must resolve to a provenance record.

```text
creative asset
    ↓
content hash
    ↓
license/provenance record
    ├── source / creator
    ├── acquisition date
    ├── license + evidence
    ├── commercial-use permission
    ├── derivative permission
    ├── redistribution/embedding terms
    ├── attribution requirement
    └── approval status
```

Unknown/unverifiable provenance fails closed.

Competitor/reference research stores links and abstract observations by default. It is not an asset-import pipeline.

# 50. Security governance architecture

Security baseline:

- OWASP ASVS 5.0 Level 2 target for the application;
- selected Level 3-style/high-assurance review for payment, recovery, admin and secrets based on risk;
- OWASP Top 10:2025 awareness coverage;
- frozen dependency graph + image digest pinning;
- SBOM generation for release artifacts;
- dependency vulnerability review and remediation SLA;
- secret scanning;
- SAST/source boundary tests;
- upload fuzz/security tests;
- RLS/authz checks;
- webhook cryptographic tests;
- CSP/header validation;
- logging/privacy review;
- backup/restore drill;
- staging red-team-lite before major launch changes.

The Lumer profile must not hold broad production credentials in project files or skill content.

# 51. Lume Control Center architecture

The Control Center is an internal, privacy-minimized read/operate surface, not a customer dashboard.

Modules:

```text
Overview
Creative Quality
Templates
AI Economics
Commerce
Infrastructure
Security/IP
Experiments
Research
Releases/Incidents
```

Default APIs are read-only. Mutating actions use narrow capability endpoints and the authority matrix. Do not expose raw customer messages/photos merely because they are convenient for operations.

# 52. Optional Lume Account architecture

Anonymous identity remains the default first interaction. Optional account is a later layer.

```text
Anonymous create/pay/recover
          │
          └── optional claim/save
                  ↓
             Lume Account
              ├ My Cards
              ├ purchase history
              ├ secure cross-device recovery
              ├ favorites
              └ opt-in style memory
```

Prefer passwordless authentication initially. Linking an existing paid card to an account must require proof derived from the paid/recovery entitlement, not matching an email string alone.

Style memory must be explicit opt-in, compact and resettable. Raw historical card copy and photos are not default hidden-memory inputs.

# 53. V7 failure containment

- Lumer unavailable → public product continues normally.
- Control Center unavailable → public product continues normally.
- benchmark/research tooling unavailable → block promotion if evidence is required; do not block existing public traffic.
- experiment service fails → feature flag/kill switch returns users to production path.
- license evidence missing → asset/template publish blocked.
- security release gate fails → production promotion blocked.
- optional account auth unavailable → anonymous purchase/recovery remains available where safe.

# 54. V7 architectural acceptance invariants

1. Lumer is isolated from unrelated Hermes profiles.
2. CardeLume project-local skills are version-controlled and trusted explicitly.
3. No Lumer dependency exists in the public request path.
4. Production mutations are least-privilege and owner-approval gated.
5. Experiment/staging cannot silently target production data/services.
6. Unknown asset/font/template license cannot publish.
7. Benchmark human review remains the final premium/wow authority.
8. ASVS 5.0 Level 2 is the security baseline target; higher assurance is risk-selected.
9. Anonymous create/pay/recover remains first-class after optional accounts.
10. Style memory is content-minimized and explicit when account-linked.

## Step 17B implemented governance boundary

The repository now contains machine-readable IP provenance and security governance gates. These gates are deliberately fail-closed and remain separate from creative authority.

```text
source/catalog discovery
→ provenance + security audit
→ exact release/runtime evidence
→ IP/security release checks
→ GO_FOR_OWNER_APPROVAL only
→ explicit owner production approval
```

A source governance PASS never implies production security or copyright clearance. Unknown rights, missing lock/SBOM/vulnerability evidence, unresolved selected ASVS controls or missing runtime evidence remain hard release failures.


## Step 17E portfolio promotion boundary

CardeLume separates template technical runtime state from launch approval. `status/health/version` continue to protect renderer/runtime correctness; `launch_status` protects product/IP/quality promotion. Held/retired families are excluded. Production catalog reads require `launch_status=approved`; experiment/staging may evaluate `experiment`/`candidate` families inside their isolated lanes. This never converts a soft creative score into a hard aesthetic rule: once a candidate is production-approved and objectively compatible, Step 13 Premium AI remains the final creative decision-maker.

Font family license eligibility is also separate from exact shipped-binary approval. Source may select a candidate such as Plus Jakarta Sans, but production still requires pinned package/artifact evidence, hashes, retained license evidence and browser/final-render QA.

---

## Step 17F customer / operator integration layer

```text
Customer brief
  ↓
Step 13 Creative Director (unchanged authority)
  ↓
3 exact immutable directions
  ↓
Customer chooses
  ├─ Finish → checkout
  └─ none feel right → bounded regeneration with prior directions as SOFT novelty evidence

Customer funnel
  ↓
server-validated / browser-minimized events
  ↓
HMAC pseudonymous subject
  ↓
funnel_events (RLS, no public policy)
  ↓
compact admin/Lumer operating pulse

Template technical state
  ↓
active + healthy + validation passed
  ↓
benchmark/IP/human evidence
  ↓
explicit owner launch action
  ↓
append-only template_launch_approvals
  ↓
launch_status=approved
  ↓
production catalog eligible
```

Security additions:

- `/admin/*` and `/api/admin/*` share one protected namespace boundary;
- production requires Cloudflare Access plus existing Basic Auth/mutation guard;
- trusted edge actor identity is propagated internally for approval audit evidence;
- CSP uses per-request nonce + `strict-dynamic`; enforcement remains a Step18 browser gate;
- analytics pseudonymization uses a dedicated HMAC key required in production.
