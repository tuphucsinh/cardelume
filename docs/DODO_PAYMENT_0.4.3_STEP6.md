# CardeLume 0.4.3 Step 6 — Verified Dodo Checkout + Authoritative PAID

## Why this step exists

Before Step 6, production `/api/checkout` ended at `501 dodo_not_wired`. The recovery and paid renderer were security-hardened, but CardeLume could not create a real payment session or make a verified provider event the authoritative source of `orders.status='paid'`.

Step 6 closes that non-photo-card payment boundary without changing the approved Studio/Checkout product experience.

## DONE

### 1. Server-authoritative checkout snapshot before payment

A single-card checkout now sends a constrained `CheckoutCardSnapshot`, not a raw amount and not arbitrary renderer markup.

The server:

1. validates the anonymous session UUID,
2. verifies the HMAC-signed price quote,
3. validates the CardeLume snapshot,
4. rejects hard typography overflow,
5. constructs the allowlisted `CardDocument` server-side,
6. persists `cards`, `card_versions`, `orders`, and `order_items`,
7. only then creates a Dodo checkout session.

The paid snapshot does **not** trust browser-supplied `typographyFit`. The production renderer owns final typography fitting.

### 2. Checkout idempotency + concurrency guard

`orders` now persist:

- `checkout_idempotency_key`
- `checkout_request_hash`
- provider checkout ID/URL
- short provider-creation lease token/timestamp
- pricing market/display
- payment provider / paid timestamp

A DB advisory transaction lock serializes creation of the local order for one anonymous user + idempotency key. Reusing the same key with a different snapshot/price identity fails with `checkout_idempotency_conflict`.

A second DB lease serializes the external provider-session creation. A concurrent request cannot create another provider session for the same order while the first lease is live. A stale lease can be recovered.

The browser also reuses one idempotency key for an identical checkout payload and changes it only when the checkout snapshot changes.

### 3. Dodo hosted checkout adapter

Production checkout calls Dodo's hosted Checkout Session API using:

- test or live API host selected by `DODO_PAYMENTS_ENVIRONMENT`,
- server-only bearer key,
- signed-quote `amountMinor`,
- signed-quote currency as `billing_currency`,
- server-bound order metadata,
- deterministic secure CardeLume return URL,
- currency selection disabled at provider checkout.

Provider error bodies are not forwarded to the browser/logs.

For exact CardeLume psychological prices, the launch configuration expects one-time Pay-What-You-Want products with Tax Inclusive Pricing enabled and one configured product ID per enabled quote currency. Production refuses checkout unless `DODO_DYNAMIC_PRICING_READY=true` is explicitly set.

### 4. Raw-body Standard Webhooks verification

`POST /api/webhooks/dodo` reads `req.arrayBuffer()` first and verifies the exact raw bytes before JSON parsing.

The verifier uses:

- `webhook-id`
- `webhook-timestamp`
- `webhook-signature`
- HMAC-SHA256
- Standard Webhooks signed content: `id.timestamp.rawBody`
- constant-time signature comparison
- bounded timestamp tolerance
- multi-signature/key-rotation support

A missing server signing-key configuration returns a controlled 503. Invalid signatures return 401.

### 5. Authoritative PAID reconciliation

A verified `payment.succeeded` event does **not** immediately mean the local order is accepted.

Inside one DB transaction CardeLume verifies:

- bound `order_id` metadata,
- `product_key='cardelume'`,
- order belongs to Dodo payment provider,
- exact expected amount,
- exact expected currency,
- exact provider checkout/session ID,
- allowed local order state.

Only after those checks may `orders.status` transition from `pending` to `paid` and bind the unique provider payment ID.

Provider checkout IDs and provider payment IDs are unique in the database.

### 6. Resumable paid fulfillment

The verified webhook persists PAID first, then calls the already-hardened `fulfillVerifiedPaidOrder()` path.

That path provisions paid recovery and queues final renders only from authoritative PAID state. If downstream fulfillment fails, the webhook returns non-2xx so Dodo can retry. The payment event remains `paid_pending_fulfillment`; retrying is safe because recovery/final jobs are idempotent.

After fulfillment succeeds, matching pending payment events become `paid_fulfilled`.

### 7. Checkout return claim retry safety

The short checkout-return secret is derived with a separate server HMAC key so an ambiguous/retried checkout can reproduce the same return URL without persisting the raw claim.

Retrying checkout does **not** reset `checkout_return_claims.consumed_at`; a consumed claim cannot be reopened.

### 8. Fail closed on currently unfulfillable Photo Story

Photo Story remains browser-previewable, but production payment is blocked before Dodo checkout until the trusted upload/quarantine pipeline persists a clean raster asset ID usable by the paid renderer.

This is deliberate: CardeLume must never accept payment for a final that the renderer is designed to reject with `trusted_photo_asset_required`.

### 9. Production mode is explicit

The production `.env.example` now uses `APP_MODE=live`.

Production payment refuses to silently fall back to mock mode. Mock checkout is allowed only outside production when `APP_MODE=mock` is explicit.

## Dodo launch configuration required externally

Before live payment QA:

1. Create/verify the single-card one-time PWYW products for every enabled currency.
2. Enable Tax Inclusive Pricing so the customer-visible total remains the intended CardeLume price.
3. Fill `DODO_PRODUCT_ID_SINGLE_<CURRENCY>`.
4. Set `DODO_PAYMENTS_ENVIRONMENT=test_mode` for sandbox QA, then `live_mode` for launch.
5. Set `DODO_PAYMENTS_API_KEY` and `DODO_PAYMENTS_WEBHOOK_KEY` only in server secrets.
6. Set `DODO_DYNAMIC_PRICING_READY=true` only after dashboard configuration is verified.
7. Register `/api/webhooks/dodo` and subscribe at minimum to payment events needed for reconciliation.
8. Set a separate >=32-character `CHECKOUT_RETURN_SECRET`.
9. Apply DB migration `0004_verified_dodo_checkout.sql`.

## Security / product guardrails retained

- Browser redirect is never payment proof.
- Client cannot submit amount/currency directly.
- Raw provider/customer/card data is not copied into normal payment-event audit payloads.
- Paid recovery and final assets remain private/server-authorized.
- No forced account, subscription, credits system, or dashboard was added.
- No generic commerce-platform rewrite was introduced.
- Renderer version remains `0.4.3-step.5` because Step 6 does not change paid pixels.

## NOT DONE / next dependency

### Step 7 — Trusted Photo Upload + Private Asset Binding

The next direct CardeLume product gap is to make Photo Story purchasable safely:

`browser-preprocessed photo -> signed/quarantine upload -> server decode/validate/re-encode/strip metadata -> clean private R2 object -> asset ownership -> CardDocument.artworkAssetIds -> paid renderer trusted asset map`

Still separate after that:

- production AI provider + durable generation queue/status wiring,
- dormant Holiday Bundle production checkout,
- full observability/rate-limit/backup/HA launch validation.
