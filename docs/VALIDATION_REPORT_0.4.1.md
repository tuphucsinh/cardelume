# Validation Report — CardeLume 0.4.1 Pricing & Bundle Ready

**Offline validation: PASS**

## Completed checks

- All package JSON files parse.
- Production CSS: **600 balanced blocks**.
- Watchdog/bootstrap/doctor shell scripts pass `bash -n`.
- Standalone review: **8 JS blocks** pass `node --check`.
- Standalone contains no active `US$1.99`; default is `US$2.99`.
- Standalone Holiday Collection review config is `enabled:false`.
- **45 TS/TSX files** pass TypeScript syntactic transpile diagnostics.
- All relative TS/JS imports resolve.
- Pricing unit tests pass:
  - US → US$2.99
  - UK → £1.99
  - France → €2.49
  - India → ₹149
  - unverified VN → safe US$2.99 fallback
  - verified VN → 39.000đ
  - verified JP → ¥390
  - Holiday US → US$12.99
  - Holiday VN → 169.000đ
  - USD/JPY/VND minor units correct
  - adaptive-market inclusive-fee requirement present
- Client single checkout sends purchase kind/direction, **not amount/currency**.
- Server checkout derives market price.
- Holiday Bundle defaults OFF.
- Bundle API requires exactly five unique card IDs.
- Bundle API refuses checkout while feature flag is OFF.
- Adaptive local pricing refuses checkout if inclusive-fee protection is disabled.
- Active app source contains no `US$1.99`.
- No runtime `.env` secret files are packaged.

## Important integration checks still required

A full dependency install / semantic build was not performed in this artifact environment.

Hermes must run:

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm build
```

Then verify:

- Dodo native and adaptive currency behavior with real/sandbox checkout.
- Exact customer-visible checkout total for each verified market.
- Tax display and refund path.
- Webhook-driven PAID entitlement.
- Stable anonymous/user ID before enabling pricing A/B.
- Funnel analytics.
- Five-card DB persistence/ownership/FINISHED validation before Holiday Collection activation.
- Real-device mobile/browser and Pi/VPS benchmarks.

## Launch defaults

```env
PRICING_EXTENDED_LOCAL_ENABLED=false
PRICING_EXPERIMENT_ENABLED=false
HOLIDAY_BUNDLE_ENABLED=false
DODO_ADAPTIVE_CURRENCY_FEES_INCLUSIVE=true
```

These defaults are intentional.
