# CardeLume 0.4.0 — Launch Polish

> **Pricing note:** US$1.99 references in this historical launch-polish document are superseded by `PRICING_STRATEGY_0.4.1.md` and US$2.99.

This release implements the accepted P0/P1 items from `MASTER_OPTIMIZATION_SYNTHESIS_0.3.1.md`.

## Launch-critical changes implemented

1. Digital-only clarity.
2. Production-facing `US$1.99`.
3. iOS 16px form-control guard.
4. JP/KR/ZH production font dependencies + matching Magic Typography measurement stacks.
5. Quiet Letter replaces Photo Story when no photo exists.
6. One subtle stationery-proof watermark.
7. Mobile sticky mini-preview.
8. Stationery-first hero wording.
9. Empty recipient field + localized example placeholder.
10. Accessibility and mobile GPU polish.

## Strong improvements implemented

- Photo privacy, type/size guidance and remove action.
- Palette confidence + automatic softening fallback.
- Human-facing Magic Typography wording.
- Named result-action accessibility.
- Medium-desktop hero fan correction.
- Quiet paid unlock component.
- Refund anchor without inventing policy details.

## Physical Effects — user-requested experiment now included

The user explicitly requested Haptic / Gyroscope / Dynamic Lighting in 0.4.0.

### Default behavior

The UI presents the effects as an **Auto** enhancement.

- Master: enabled
- Haptic: enabled where supported
- Gyroscope: enabled preference, but inactive until required permission is granted
- Dynamic lighting: enabled
- Reduced Motion: motion-dependent parts disabled automatically

### Controls

All four settings persist locally:

- Effects master
- Haptic tap
- Gyroscope tilt
- Dynamic lighting

### Guardrails

- Effects are never required for navigation or conversion.
- Haptic is a tiny tap, not a vibration sequence.
- Gyro tilt is clamped to a few degrees.
- Dynamic light is radial/local and pointer/gyro-driven, not a continuous sheen animation.
- Touch devices do not run desktop pointer lighting.
- Reduced Motion disables tilt/light motion.
- Unsupported APIs silently degrade.
- No second signature WOW has been introduced.

## Quiet unlock boundary

`PaidUnlock` exists as a UI component only. It must be rendered **after authoritative server-side paid entitlement**.

Do not wire it directly to:
- `?success=1`
- return URL
- client localStorage
- browser redirect state

Correct boundary remains:
Dodo webhook → signature verification → idempotent PAID state → final render → signed/private delivery → PaidUnlock UI.
