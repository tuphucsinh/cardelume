# CardeLume 0.4.3 Step 12 — Template API Contracts

> Implementation-backed API reference for managed templates.  
> These endpoints are CardeLume product APIs, not a public template marketplace API.

---

# 1. Security model

## Public/customer API

Customer APIs rely on the CardeLume anonymous session cookie created by the web proxy/session boundary.

Public template browsing does **not** grant authority to:

- publish/archive templates;
- choose arbitrary renderer keys;
- modify template targeting;
- override payment state;
- read R2 object keys;
- access another user's generation status.

## Admin API

Admin routes are protected by:

1. HTTPS in production;
2. Basic Auth credentials from `TEMPLATE_ADMIN_USERNAME` / `TEMPLATE_ADMIN_PASSWORD`;
3. `x-cardelume-admin-action: 1` for non-GET template admin requests;
4. server-side validation and approved renderer capability checks.

The Basic Auth boundary is intentionally minimal for launch. If multiple named operators/audit requirements emerge, upgrade to Cloudflare Access/SSO rather than building a custom account system inside CardeLume.

## Analytics capability

Customer-visible template events use short-lived HMAC capabilities signed by `TEMPLATE_EVENT_SECRET`.

Token v2 binds:

```text
template ID
version ID
source
rank position
market
locale
anonymous session ID
surface nonce
expiry
```

This token is only permission to submit limited template analytics evidence. It is not reusable as an order/recovery/payment credential.

---

# 2. `GET /api/templates`

Purpose: return a bounded ranked template surface for **the current card context** after the user chooses to explore styles.

## Request query

```text
occasion     required string <= 80
feeling      required string <= 80
format       required string <= 40
locale       required locale string <= 20
hasPhoto     "0" | "1"
bodyPressure optional numeric 0..8
```

Market comes from trusted edge country headers in live mode. Mock/review mode may permit the documented review override.

A valid CardeLume anonymous session is required because returned event tokens are session-bound.

## Example

```text
GET /api/templates?occasion=Birthday&feeling=Warm&format=portrait-5x7&locale=vi&hasPhoto=1&bodyPressure=0.74
```

## Success response

Conceptual shape:

```json
{
  "market": "VN",
  "marketSpecificCount": 4,
  "recommended": [
    {
      "id": "template-uuid",
      "versionId": "version-uuid",
      "name": "Botanical Poise",
      "material": "Letterpress · Botanical",
      "visualDirection": "botanical",
      "photoMode": "none",
      "source": "recommended",
      "position": 1,
      "marketMatch": true,
      "archetype": "editorial",
      "eventToken": "<short-lived HMAC capability>"
    }
  ],
  "marketPicks": [],
  "more": []
}
```

Limits:

- `recommended.length <= 4`;
- `marketPicks.length <= 4`;
- `more.length <= 8`;
- no duplicate template IDs across the returned groups.

## Failure

```text
400 template_query_invalid
401 anonymous_session_required
503 template_catalog_unavailable
```

Live mode fails closed if DB-backed managed catalog cannot be loaded. In-memory bootstrap fallback is for mock/development review only.

## Cache policy

Short private caching is acceptable. Signed, session-bound token responses must not be converted into a shared public CDN cache without redesigning token semantics.

---

# 3. `POST /api/templates/events`

Purpose: receive low-risk browser analytics for template surfaces.

## Allowed browser event types

```text
impression
selected
regenerated
```

Events such as `ai_assigned`, `checkout_started` and `paid` are recorded server-side and are not trusted from this endpoint.

## Request

```json
{
  "events": [
    {
      "templateId": "template-uuid",
      "templateVersionId": "version-uuid",
      "eventType": "impression",
      "source": "recommended",
      "rankPosition": 1,
      "locale": "vi",
      "eventToken": "..."
    }
  ]
}
```

Batch constraints:

- min 1;
- max 24 events;
- each event must carry a valid token matching the exact slot.

## Server validation

Server derives/validates:

- current anonymous session;
- current trusted edge market;
- token signature/expiry;
- exact template/version;
- source;
- rank position;
- locale;
- anonymous session binding.

For `impression` and `selected`, server creates a deterministic HMAC dedupe key based on the anonymous session, event type and exact surface token. Replaying the same signed surface evidence becomes a DB no-op.

A new discovery response has a new surface nonce/token and may legitimately create a new event.

`regenerated` is intentionally repeatable because repeated regeneration is useful negative evidence.

## Failure

```text
400 template_events_invalid
401 anonymous_session_required
403 template_event_forbidden
429 rate_limited
503 template_events_unavailable
```

Analytics failures must not block the customer from designing/buying a card.

---

# 4. `GET /api/admin/templates`

Purpose: list managed templates including inactive inventory for operators.

Requires admin authentication.

Response includes managed template identity, current version metadata, targeting and recent performance evidence.

No-store response.

---

# 5. `POST /api/admin/templates`

Purpose: create a **Draft** managed template using an already QA-approved renderer key.

Requires:

```text
Authorization: Basic ...
x-cardelume-admin-action: 1
```

## Input

Conceptual fields:

```json
{
  "name": "Quiet Bloom — Vietnam",
  "slug": "quiet-bloom-vn",
  "familyId": "optional-existing-family-uuid",
  "material": "Cotton · Botanical",
  "rendererTemplateKey": "botanical-poise",
  "photoMode": "none",
  "editorialScore": 90,
  "maturity": "new",
  "feelings": [
    {"key": "Warm", "score": 0.95}
  ],
  "occasions": [
    {"key": "Birthday", "score": 0.9}
  ],
  "markets": [
    {"key": "VN", "score": 0.98}
  ]
}
```

If `familyId` is omitted, a new family is created. If supplied, it must exist.

GLOBAL targeting is added at a conservative fallback affinity if omitted.

## Renderer guard

`rendererTemplateKey` must exist in CardeLume's approved renderer inventory.

The new version inherits the renderer's approved format/script capability. The admin request may not claim arbitrary capability expansion.

Photo renderer compatibility is fail-closed.

## Output

```json
{
  "templateId": "...",
  "versionId": "...",
  "status": "draft"
}
```

## Failure examples

```text
400 template_input_invalid
409 renderer_template_key_not_approved
409 photo_mode_not_supported_by_renderer
409 template_slug_exists
409 template_family_not_found
409 template_create_failed
```

---

# 6. `PATCH /api/admin/templates/:templateId`

Purpose: edit mutable metadata/targeting/lifecycle state.

Supported mutable concepts:

- name;
- material;
- status;
- health;
- photo mode within renderer compatibility;
- editorial score;
- maturity;
- feeling affinities;
- occasion affinities;
- market affinities;
- excluded markets.

Activating a template requires:

```text
current version validation_status = passed
AND effective template health = healthy
```

Targeting updates replace only the dimensions explicitly supplied, avoiding accidental clearing of unrelated dimensions.

---

# 7. `DELETE /api/admin/templates/:templateId`

**Semantics: Archive, not destructive delete.**

The route intentionally maps operator "Remove" to:

```text
status = archived
archived_at = now()
```

Historical order/template-version references stay valid.

A future hard-delete maintenance operation, if ever introduced, must first prove the template has never been published/referenced and must not reuse this public operator action silently.

---

# 8. `GET /api/admin/templates/:templateId/versions`

Purpose: inspect immutable render versions for one template.

Returns:

- version UUID;
- version number;
- renderer key;
- visual direction;
- format/script declarations;
- text capacity;
- validation state/notes;
- creation time.

---

# 9. `POST /api/admin/templates/:templateId/versions`

Purpose: create immutable vN for render/capability changes.

Input:

```json
{
  "rendererTemplateKey": "quiet-minimal",
  "supportedFormats": ["portrait-5x7", "square-5x5"],
  "scriptSupport": ["latin", "cjk"],
  "headlineCapacity": "medium",
  "bodyCapacity": "long",
  "activate": false
}
```

Rules:

- renderer key must be approved;
- declared formats must be a subset of approved renderer formats;
- declared scripts must be a subset of approved renderer scripts;
- photo mode must match renderer capability;
- version allocation is transaction-safe;
- if activated, current version updates atomically after validation gate.

A DB-only version that reuses an already QA-approved renderer can inherit validation notes indicating that inheritance. A brand-new renderer behavior still requires normal source/render QA before it can become an approved key.

---

# 10. Generation status integration

`GET /api/generate/:jobId` remains protected by the Step 8 generation status capability and owner anonymous session.

When generation is ready, each managed AI direction receives a template analytics capability:

```text
source = ai_direction
position = 1..3
exact template/version
market/locale from persisted generation brief
anonymous session = request owner
```

This prevents the LLM from producing/authorizing analytics identity itself.

---

# 11. Checkout integration

The checkout Card snapshot may contain managed identity:

```text
templateId
templateVersionId
templateSource
```

Application schema rejects incomplete pairs.

Checkout server:

1. validates exact managed template/version pair;
2. verifies version is eligible for new checkout;
3. stores exact managed identity on `card_versions`;
4. records server-side `checkout_started` attribution;
5. persists before creating/using payment session.

After verified PAID, the paid event is attributed server-side from the persisted order/card-version state.

---

# 12. Compatibility and versioning policy

This API is versioned by CardeLume application release, not exposed as a generic external `/v1/templates` API.

Breaking changes require:

- updated Step spec;
- DB migration where necessary;
- source-boundary regression update;
- controlled browser/client deployment;
- preservation of historical template-version semantics.

Do not expose raw DB structures as a third-party integration contract during launch.
