# CardeLume 0.4.3 Step 5 — Photo Palette WCAG Contrast Hardening

## Why this step exists

Photo Palette already adapted the card mood from an uploaded photo, but the browser and paid renderer used different luminance heuristics. That could make preview/final treatment drift and did not guarantee readable photo-derived text or accent colors.

Step 5 keeps Photo Palette art-directed while making contrast deterministic and shared.

## DONE

### Shared CardeLume contrast rule

A pure `photo-contrast.ts` module now lives with `CardDocument` in `@cardelume/card-schema` and is exported for both browser and renderer use.

It implements WCAG relative luminance using the sRGB transfer curve and provides:

- `cardRelativeLuminance()`
- `cardContrastRatio()`
- `cardMinContrast()`
- `cardEnsureContrast()`
- `cardPhotoContrastPalette()`

Normal text/accent target is **4.5:1**.

If a requested contrast target cannot be reached against the supplied backgrounds, the guard fails closed with `card_contrast_target_unreachable` rather than silently returning an unsafe color.

### Browser preview

`CardVisual` computes one shared safe palette when `accentMode === "photo"` and exposes only derived safe colors for readability-critical surfaces:

- light background / alternate background
- light foreground
- light safe accent
- dark background / alternate background
- dark foreground
- dark safe accent

Decorative border color may still use the raw extracted accent because it is not body copy.

### Final renderer

The paid renderer uses the same `cardPhotoContrastPalette()` calculation.

Dark art directions are preserved explicitly:

- `midnight-lume` / `celestial-night` use the shared dark photo palette.
- `art-deco-noir` / `quiet-noir` keep their locked noir base while using the shared dark safe accent.
- other photo-accent directions use the shared light photo palette.

Renderer version advances to **`0.4.3-step.5`** because paid output color behavior changed.

## Validation coverage

`scripts/photo-palette-contrast-stress.ts` verifies:

- eight adversarial hand-picked palettes,
- 5,000 deterministic randomized RGB palettes,
- foreground >= 4.5:1 across both relevant background endpoints,
- accent >= 4.5:1 across both relevant background endpoints,
- dark foreground/accent >= 4.5:1 across the dark endpoints and locked noir base,
- known WCAG reference ratios,
- browser use of shared palette variables,
- renderer use of the shared palette and dark/noir treatment rules.

## Product guardrails

- This remains **CardeLume-specific visual logic**, not a universal theme engine.
- Raw photo colors remain available only where readability does not depend on them.
- No new advanced editing controls are introduced.
- Photo Palette remains automatic and premium; the customer is not asked to tune contrast manually.

## NOT DONE / EXTERNAL

- Full workspace semantic `pnpm typecheck` / `pnpm build` still requires dependency installation on Hermes/Pi.
- Real Dodo checkout + verified webhook remains unwired in production mode.
- Production AI provider + durable generation queue/status remain unwired.
- Production upload/R2 credentials and real-device visual QA remain deployment tasks.

## Next launch blocker

**Step 6 — Real Dodo Checkout + Verified Webhook / Authoritative PAID flow.**

The current production checkout route still returns `dodo_not_wired` with HTTP 501, which blocks an actual sale even though the paid recovery/export path is already hardened.
