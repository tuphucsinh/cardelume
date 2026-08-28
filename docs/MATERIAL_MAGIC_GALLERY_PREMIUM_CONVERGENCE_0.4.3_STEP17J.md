# CardeLume 0.4.3 Step17J — Material Magic, Gallery Power & Premium Convergence

**Release:** `0.4.3-step.17j`
**Status:** source/offline product convergence; runtime and owner gates remain fail-closed.

## Product thesis

Step17J corrects an over-simplification risk identified by repeated independent review. Step17I remains the UX/brand chassis, while the strongest product richness from the 0.4.1 master review is restored as progressive enhancement.

> **0.4.1 product power + Step17I brand refinement.**

Internal design shorthand:

> **Quiet Luxury × Material Intelligence**
> **Invisible intelligence. Tangible emotion.**
> **More magic. Zero extra complexity.**

## Non-negotiables

1. Studio stays brief → AI → 3 directions → minimal finish. No template picker or Canva editor.
2. Homepage/showroom keeps the premium collection presentation style of 0.4.1.
3. Material/physical effects are automatic progressive enhancement; customer-facing FX settings are not part of the default path.
4. Production marketing and generation stay `launch_status=approved` only.
5. A beautiful static/reduced-motion state is mandatory. Effects may enhance a good design; they may not rescue a weak design.
6. Performance is part of premium. Lag is a quality failure.
7. English art direction is flagship: Cormorant Garamond + Plus Jakarta Sans. Other scripts may use locale-specific premium fonts.

## Step17J target collection — 16 families

The order below is a review/showroom target only. It does not approve any template.

### 0.4.1-priority core (10)

1. Luxury Editorial
2. Midnight Lume
3. Botanical Poise
4. Washi Elegance
5. Soft Seoul
6. Art Deco Noir
7. Photo Story
8. Quiet Minimal
9. Classic Letterpress
10. Celestial Night

### Later best-of-both additions (6)

11. Museum Note
12. Memory Window
13. Whispered Type
14. Night Ledger
15. Pressed Shadow
16. Monogram Orbit

### Material worlds

- Editorial Luxury
- Nocturne / Foil
- Letterpress / Tactile
- Photo Keepsake
- Quiet Modern
- Personal Mark
- Celebration Energy remains supported for future challenger review but is not forced into the 16.

Every managed template now has explicit source metadata for `materialWorld`, `materialCues`, `energy`, `colorWorld`, `motionProfile`, `localeStrengths`, and `printFormatStrength`. These are creative signals, not hard owner approval.

## Gallery rule

- Review/staging showroom may render all 16 target families for owner/human review.
- Production showroom renders only members of the target set that are `approved`.
- Studio never exposes collection browsing.
- Gallery is marketing/inspiration; AI still composes only 3 directions for the customer.

This preserves the 0.4.1 collection richness without creating a Canva/template-marketplace mental model.

## AI Creative Director change

The existing authority model is preserved:

- hard eligibility vetoes;
- soft ranking;
- 6 fit + 2 wildcard candidate pack;
- bounded expansion;
- one Creative Director authority;
- conditional critic;
- immutable template/version IDs;
- human launch approval.

Step17J adds material-diversity awareness. Candidate diversity now considers:

- family;
- visual direction;
- material world;
- color world;
- energy.

The Creative Director receives these fields and is explicitly instructed that three different IDs that still look like siblings are not sufficient diversity.

## Material Magic

Step17J restores/enhances:

- pointer/touch 3D tilt;
- dynamic light response;
- optional device-orientation response when the browser grants it without intrusive UI;
- haptic confirmation where available;
- foil/specular response for dark/foil families;
- paper grain;
- pressed/deboss depth;
- material-specific shadows.

No Physical Effects settings control is mounted in the customer path. Unsupported/reduced-motion/slow environments retain the static premium card.

## Palette Bloom

Photo palette extraction remains a small analysis copy (72×72) rather than processing full-resolution pixels. The extracted colors are design-normalized before use.

When a photo is present:

1. CardeLume extracts a palette.
2. Three swatches appear with a restrained `Palette Bloom` transition.
3. The card adapts its art-directed palette.
4. Customer copy explains the effect in natural language.

No particles/confetti/neon are introduced.

## Print layout

The optional print setting is now a visual picker rather than a jargon-heavy select.

Supported launch layouts remain:

- Portrait 5×7 (default)
- Folded 5×7
- Square 5×5
- Landscape 7×5
- Postcard 6×4

The copy remains explicit that this is a **digital PDF layout** and that **no physical card is shipped**.

## Typography / multilingual elasticity

English flagship:

- Cormorant Garamond: display, hero, emotional/card typography where art-directed.
- Plus Jakarta Sans: UI, controls, helper copy.

JP/KR/ZH retain script-specific Noto Serif/Sans mappings. Magic Typography remains the automatic layout authority for text fitting; customers do not get font/leading/tracking controls.

## Multi-market / commerce

The 16-market pricing book remains intact:

US, GB, CA, AU, SG, JP, KR, FR, DE, ES, IT, BR, MX, CN, VN, IN.

Holiday Bundle pricing/checkout architecture is retained but the product surface is intentionally hidden. It is not a launch navigation or paid-unlock upsell in Step17J.

## Error / accessibility / performance rules

- Errors remain contextual and quiet; no technical panic UI.
- Reduced motion disables material movement while preserving static quality.
- Keyboard/focus/ARIA/mobile hardening from Step17I is preserved.
- Gallery cards are below-fold deferred/content-visible.
- `will-change` is activated only while a physical card is actively interacting, not permanently on all 16 tiles.
- Step18 must measure LCP/INP/CLS, actual generation latency and real-device frame behavior before production claims.

## What Step17J explicitly does not do

- no auto-approval of the 16 templates;
- no broad catalog expansion;
- no template browser inside Studio;
- no visible FX settings panel;
- no fake social proof;
- no mandatory account;
- no subscription/credits;
- no multi-agent expansion;
- no runtime claims before Step18.

## Required next gate

Step18 Controlled Runtime Validation starts from Step17J, then owner/human review decides which target templates may become `approved` after Golden + IP/originality + Premium/WOW evidence.
