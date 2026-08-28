# CardeLume 0.4.1 — Pricing Strategy & Dormant Holiday Collection

## Decision

CardeLume launch identity price:

> **US$2.99 per finished premium card**

This replaces the old US$1.99 identity price.

Why:

- CardeLume sells a finished, art-directed card — not AI generation credits.
- US$2.99 stays within impulse-buy territory while supporting healthier payment economics.
- It leaves more room for AI/render quality, support, paid acquisition and refund/chargeback risk.
- The product is intentionally positioned below the ~$3.99 benchmark tier while the brand is new.

No:
- fake discount
- strike-through price
- countdown
- subscription
- credits
- wallet balance

---

## Market and locale are separate

Never infer market price from UI language.

```text
locale → UI language / localized emotional copy
market → price / currency / billing behavior
```

Examples:

```text
locale=en + market=VN → Vietnamese-market price
locale=fr + market=CA → Canadian-market price
locale=es + market=MX → Mexican-market price
```

Market detection preference:

1. trusted edge country header (`CF-IPCountry`)
2. equivalent trusted platform country header
3. safe fallback

`?market=` override is accepted only in mock/review mode.

---

## Single-card psychological target price book

| Market | Customer target price | Approx. USD — internal comparison only | Billing baseline |
|---|---:|---:|---|
| US | **US$2.99** | $2.99 | native |
| UK | **£1.99** | ~$2.70 | native |
| Canada | **C$3.99** | ~$2.87 | verify adaptive |
| Australia | **A$3.99** | ~$2.86 | verify adaptive |
| Singapore | **S$3.90** | ~$3.07 | verify adaptive |
| Japan | **¥390** | ~$2.45 | verify adaptive |
| Korea | **₩3,900** | ~$2.82 | verify adaptive |
| France | **€2.49** | ~$2.90 | native |
| Germany | **€2.49** | ~$2.90 | native |
| Spain | **€2.49** | ~$2.90 | native |
| Italy | **€2.49** | ~$2.90 | native |
| Brazil | **R$9,90** | ~$1.92 | verify adaptive |
| Mexico | **MX$39** | ~$2.30 | verify adaptive |
| China | **¥12.90** | ~$1.92 | verify adaptive/payment viability |
| Vietnam | **39.000đ** | ~$1.50 | verify adaptive |
| India | **₹149** | ~$1.56 | native |
| Other | **US$2.99** | $2.99 | safe fallback |

**The approximate USD column is internal only. Never display it to customers.**

---

## Safe rollout rule

The price book contains both:

1. **native / production-safe prices**
2. **psychological target prices requiring end-to-end billing verification**

Default:

```env
PRICING_EXTENDED_LOCAL_ENABLED=false
PRICING_VERIFIED_MARKETS=US,GB,FR,DE,ES,IT,IN
```

This means an unverified adaptive market safely falls back to US$2.99 instead of advertising a local number that the payment provider may change at checkout.

After verifying a market:
1. verify exact checkout total,
2. verify taxes/provider behavior,
3. verify refund path,
4. add market to `PRICING_VERIFIED_MARKETS`,
5. enable extended local pricing.

For an adaptive target price:

```env
DODO_ADAPTIVE_CURRENCY_FEES_INCLUSIVE=true
```

must remain true in the CardeLume integration if the provider otherwise adds conversion cost to the customer.

Core trust rule:

> **The checkout total must match the psychological price CardeLume showed before checkout.**

No FX surprise.

---

## Vietnam

Launch target:

> **39.000đ**

Treat this as acquisition-oriented pricing because fixed transaction fees make the unit economics thin.

After enough purchase data:

> A/B test **39.000đ vs 49.000đ**

Do not race down to 29.000đ.

Track:
- Checkout → Paid
- Paid → successful final render
- refund/quality complaint rate
- AI + render cost per paid order
- contribution margin
- “worth it” qualitative feedback

---

## Pricing experiment

Do not start launch day with a price test.

First establish a clean baseline with:

> **US$2.99 control**

When traffic is sufficient:
- US new users only
- test US$2.99 vs US$3.49
- stable cohort assignment
- do not let the same anonymous/user identity switch price during the experiment
- judge revenue/contribution per eligible visitor, not conversion rate alone

Prepared env:

```env
PRICING_EXPERIMENT_ENABLED=false
PRICING_EXPERIMENT_VARIANT=control_299
```

A future sticky-cohort assignment layer should control the variant. The global env is deliberately only a safe rollout switch in this baseline.

---

# Dormant Holiday Collection

## Product model

The Holiday Collection is deliberately **not a credit pack**.

Correct:

```text
5 finished cards
→ review all 5
→ one checkout
→ 5 clean final cards
```

Wrong:

```text
buy 5 credits
→ wallet balance
→ credits remaining
```

This preserves CardeLume's no-credits / no-subscription DNA.

## Feature state

Production default:

```env
HOLIDAY_BUNDLE_ENABLED=false
```

The API refuses a holiday-bundle checkout while the flag is off.

When enabled, the checkout requires:
- exactly 5 card IDs
- all 5 IDs unique
- server-side ownership/session verification
- server-side `FINISHED` state verification
- server-derived bundle price
- one payment entitlement

## Target bundle price book

| Market | 5 finished cards |
|---|---:|
| US | **US$12.99** |
| UK | **£8.99** |
| Canada | **C$17.49** |
| Australia | **A$17.49** |
| Singapore | **S$16.90** |
| Japan | **¥1,690** |
| Korea | **₩16,900** |
| France/Germany/Spain/Italy | **€10.99** |
| Brazil | **R$42,90** |
| Mexico | **MX$169** |
| China | **¥55.90** |
| Vietnam | **169.000đ** |
| India | **₹649** |
| Other | **US$12.99** |

These are target psychological bundle prices. The same billing-verification gate applies to adaptive currencies.

## When to enable

Do not enable merely because the code exists.

Enable only after:

1. single-card funnel is stable,
2. holiday/multi-card behavior appears in real data,
3. users actually create multiple finished cards,
4. five-card server persistence exists,
5. five-card checkout + webhook entitlement is tested,
6. bundle contribution margin is healthy,
7. the UI still feels like premium stationery, not a pricing plan.

## Where it appears

`HolidayBundleCheckout` is integrated as an optional child of `PaidUnlock`.

It renders only when a server caller passes:

```ts
holidayBundle = {
  enabled: true,
  price,
  finishedCardIds
}
```

The helper:

```ts
holidayBundleProps(finishedCardIds)
```

uses the server feature flag and market pricing.

This means the dormant feature is packaged but invisible at launch.

---

# Conversion microcopy

Checkout should communicate, without a feature wall:

> **[local price]**  
> One-time payment  
>
> **Instant digital download**  
> No physical card is shipped  
>
> High-resolution JPG + print-ready PDF  
> No watermark after purchase  
>
> Keep the downloaded files forever · no expiration  
> No subscription · no account required

No USD conversion next to a local price.

---

# Share value

After verified purchase, prioritize:

- Download JPG
- Download PDF
- Share

On supported mobile browsers, use native share capabilities in the production Share flow.

For Asian markets, sharing is strategically important, but the card image itself should stay visually clean:
- no mandatory QR code printed onto the card
- no CardeLume promotional badge on the paid final

---

# Refund principle

Do not market an unconditional post-download refund.

Product principle:

> **First Purchase Quality Guarantee**

Fast remake/refund path for genuine:
- render failure
- typography defect
- serious crop defect
- paid final materially different from preview
- download/delivery technical failure

Final legal eligibility and wording must be approved before launch.

---

# Analytics required before raising price

Events/metrics:

```text
studio_started
generation_requested
results_viewed
direction_selected
finish_opened
checkout_opened
checkout_started
payment_completed
final_render_completed
download_jpg
download_pdf
share_started
refund_requested
```

Dimensions:

```text
market
currency
locale
pricing_variant
single_or_bundle
direction
photo_used
new_or_returning
```

Never log raw personal card copy/photo content into ordinary analytics.
