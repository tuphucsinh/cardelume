# CardeLume 0.4.3 Step 1 — Secure Paid Recovery

## Goal

Prevent a paid guest customer from losing access simply because they:

- refresh or close the tab,
- lose network during the payment return,
- reopen the purchase later on the same browser,
- or choose to receive an optional recovery email.

This step deliberately does **not** make clean final files public and does **not** store a durable bearer secret in `localStorage`.

---

## Security model

```text
Dodo checkout
    │
    │ short-lived return claim (≈60 min)
    ▼
/checkout/return/<order>/<claim>
    │
    │ NEVER unlocks from redirect alone
    │ waits for verified webhook -> order.status='paid'
    ▼
PAID webhook
    │
    ├── issue durable recovery capability (256-bit)
    │       raw token returned once
    │       DB stores SHA-256(token) only
    │
    └── enqueue/finish clean private files
            │
            ▼
      download_entitlements
            │
            ▼
return claim / recovery email claim
            │
            │ mint separate browser session secret
            ▼
HttpOnly + Secure + SameSite=Lax cookie
(path scoped to /d/<recoveryId>)
            │
            ▼
/d/<recoveryId>
            │
            │ verify order=paid + recovery active + session active
            ▼
/d/<recoveryId>/download/<entitlementId>
            │
            │ verify entitlement belongs to paid order
            ▼
short-lived R2 signed URL (default 90 sec)
```

### Core rules

1. Browser redirect is **never payment proof**.
2. Only a verified webhook may persist `orders.status='paid'`.
3. Durable recovery tokens are 256-bit random and stored only as hashes.
4. The durable token is not persisted in `localStorage`.
5. Claiming a durable/return token mints a **different** browser session secret.
6. Browser recovery cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production and path-scoped to one purchase recovery page.
7. Recovery/session/return-claim DB tables have RLS enabled with **no public user policy**.
8. Clean final R2 objects remain private.
9. The download endpoint returns only a short-lived signed URL after entitlement verification.
10. Recovery and claim routes are `no-store`, `noindex`, `no-referrer`.

---

## Database migration

Apply:

`packages/db/migrations/0002_secure_paid_recovery.sql`

Adds:

### `purchase_recoveries`

- `order_id` — unique
- `user_id`
- `token_hash` — SHA-256 only
- `expires_at`
- `revoked_at`
- `last_claimed_at`

### `recovery_sessions`

Separate browser-session proof:

- `recovery_id`
- `session_hash`
- `expires_at`
- `revoked_at`
- `last_used_at`

### `checkout_return_claims`

Short-lived provider-return capability:

- `order_id` — unique
- `claim_hash`
- `expires_at`
- `consumed_at`

A small replay grace (default 10 minutes) allows recovery if the successful cookie/redirect response is interrupted after the DB transaction commits.

### `download_entitlements`

Extended with:

- `card_id`
- `asset_kind`
- `download_name`
- `content_type`

One paid order can therefore hold separate private JPG/PDF entitlements without exposing a public object.

---

## Checkout integration contract

When a **new pending order** has been created server-side:

```ts
const returnClaim = await issueCheckoutReturnClaim(order.id);

await paymentProvider.createCheckout({
  orderId: order.id,
  amountMinor,
  currency,
  successUrl: returnClaim.returnUrl,
  metadata: {...}
});
```

Important:

- call `issueCheckoutReturnClaim()` only while creating a new provider checkout/order,
- do not rotate it after the provider checkout URL has already been issued,
- normal checkout idempotency should return the already-created provider checkout URL.

The short return claim is **not** a durable purchase recovery link.

---

## Verified webhook integration contract

After Dodo signature verification + event idempotency and only after persisting:

```text
orders.status = 'paid'
```

call:

```ts
await provisionPaidRecovery({
  orderId,
  userId,
  locale,
  recoveryEmail, // optional and user/provider supplied
  emailProvider  // optional
});
```

Duplicate webhooks are safe:

- first creation returns a raw recovery claim URL,
- later calls find the existing recovery row and return no new raw token,
- therefore a duplicate event cannot accidentally email an invalid second token.

If an email is voluntarily available, send the recovery link only on first creation.

Do not log the recovery URL/token to normal analytics.

---

## Final-render integration contract

After re-checking authoritative `PAID` state and uploading clean assets to **private** R2, create entitlement rows such as:

```text
asset_kind     jpg
content_type   image/jpeg
download_name  CardeLume-<card>.jpg
final_object_key finals/<order>/<card>.jpg
```

and:

```text
asset_kind     pdf
content_type   application/pdf
download_name  CardeLume-<card>.pdf
final_object_key finals/<order>/<card>.pdf
```

Step 2 will harden the real JPG/PDF production export itself. Step 1 only creates the secure recovery/delivery boundary.

---

## User experience

### Payment returns before webhook

The secure return route shows a minimal premium state:

> Securing your purchase…

It automatically retries every ~2 seconds.

It does not say “webhook”, “payment API”, “pending transaction” or another SaaS-like technical message.

### Webhook/recovery ready

The return route mints the HttpOnly browser session and redirects to:

```text
/d/<recoveryId>
```

The raw short return claim disappears from the normal browsing URL.

### Paid but final render still running

Recovery page says:

> Your clean final is being prepared.

It refreshes lightly while visible.

### Entitlements ready

The private page presents one clean download item per entitlement.

The actual R2 signed URL is created only after the user clicks download and expires quickly.

---

## Recovery lifetime

Defaults:

```env
RECOVERY_TOKEN_TTL_DAYS=365
RECOVERY_SESSION_TTL_DAYS=365
CHECKOUT_RETURN_CLAIM_TTL_MINUTES=60
CHECKOUT_RETURN_REPLAY_GRACE_MINUTES=10
RECOVERY_DOWNLOAD_URL_TTL_SECONDS=90
```

Product wording remains:

> Files you download are yours forever.

This does **not** mean CardeLume promises indefinite cloud storage. The private cloud recovery window is configurable and must match the final Privacy/Retention policy.

---

## Optional email recovery

Email is not required to purchase.

If an email is voluntarily available (for example from checkout) CardeLume may send a transactional recovery link.

The baseline does not add a forced account or newsletter opt-in.

The recovery token itself is sensitive. Email/observability systems must avoid putting the raw token into normal analytics events.

---

## Cloudflare / observability hardening for Hermes

Before public production:

- rate-limit `/r/*` and `/checkout/return/*` at Cloudflare,
- exclude recovery claim token paths/query content from analytics/Sentry breadcrumbs where practical,
- never log cookies or raw claim tokens,
- keep HTTPS-only production,
- ensure recovery pages have no third-party marketing scripts,
- confirm `Cache-Control: no-store` and `Referrer-Policy: no-referrer`,
- test revocation and expiry behavior.

---

## Deliberately not included in Step 1

- real Dodo webhook adapter,
- actual final JPG/PDF render quality,
- AI failure fallback,
- Magic Typography overflow hardening,
- Photo Palette WCAG contrast engine,
- analytics instrumentation,
- Studio draft recovery.

Those remain separate sequential upgrades.
