# CardeLume — Master Review Synthesis & Optimal Launch Plan

> **Pricing superseded:** use `PRICING_STRATEGY_0.4.1.md`. Older $1.99 pricing references below are historical.

**Baseline audited:** `0.3.1 Localization Complete`  
**Sources synthesized:** Qwen review, CardeLume Review Report, Z.ai review, CardeLume Review 0.3.0  
**Purpose:** produce one authoritative optimization plan without blindly combining contradictory suggestions.

---

# 1. Executive Verdict

Across the four independent reviews, the common conclusion is consistent:

- CardeLume already has a strong premium-stationery identity.
- The core product flow is correct.
- The one-time $1.99 model is appropriate.
- Card Reveal is the right singular signature interaction.
- The finishing-only Editor is strategically correct.
- The biggest remaining launch risks are **trust clarity, mobile form behavior, global typography consistency, preview/watermark handling, and a few accessibility/performance details**.

The raw review scores vary from **7.5 / 10 to 9 / 10** because reviewers used different strictness and some reviewed the older `0.3.0` build. The current `0.3.1` baseline has already fixed a major criticism from those reviews: localization completeness.

**My current synthesis estimate for 0.3.1:** ~**8.7 / 10** as a design/product baseline.

After the launch-critical items below, the target should be roughly **9.3–9.5 / 10**, without adding feature complexity.

---

# 2. Non-negotiables — Freeze These

These decisions are supported by essentially every review and should remain frozen:

1. Deep navy / ivory / champagne gold.
2. Premium stationery first; AI second.
3. Card remains the visual hero.
4. Original three-card fan in the homepage hero.
5. One signature WOW interaction only: **Card Reveal**.
6. No continuous sheen sweep, confetti, particles, neon/purple AI glow.
7. Occasion → recipient/relationship → feeling → 3 directions → Finish → Pay.
8. No forced account before preview.
9. No subscription / credits / membership tiers.
10. Three genuinely different art directions.
11. Editor = **Finish your card**, not “Design your card”.
12. Checkout is product-centered, not a SaaS feature/pricing page.
13. AI is creative director; text remains structured/editable.
14. Magic Typography protects composition.
15. Preview before payment remains part of the core conversion promise.

---

# 3. Already Addressed in 0.3.1 — Do Not Re-open These

Several criticisms were valid for the reviewed 0.3.0 package but are already substantially addressed by `0.3.1 Localization Complete`.

## Localization

0.3.1 now has real UI/copy localization for:

- EN
- JA
- KO
- ES
- FR
- DE
- PT-BR
- IT
- ZH-CN
- VI

It is no longer merely a decorative language selector.

Still required before public SEO/indexing:
- native-speaker proofreading
- stable locale URLs / hreflang
- production font QA

## Studio complexity

The optional section already collapses:
- photo
- format
- personal detail

The primary path is already much shorter than the earlier review snapshot.

## Finish/editor philosophy

The production React baseline already removes the Canva-like toolbar and keeps:
- message editing
- controlled rewrite options
- controlled color mood
- photo replacement where relevant

Do not restore the old Design / Regenerate toolrail.

## Checkout card hierarchy

The production checkout already keeps the selected card prominent rather than replacing it with a feature table.

## Accessibility baseline

Already present:
- skip link
- focus-visible treatment
- `aria-pressed` for chips
- keyboard-capable language menu
- reduced-motion support

The remaining accessibility tasks are refinements, not a redesign.

---

# 4. P0 — Must Fix Before Public Launch

These are the final launch blockers I would accept from the combined reviews.

## P0.1 — Make the product unmistakably DIGITAL

### Problem

The words:
- Card
- Folded
- Postcard
- 5 × 7
- $1.99

can imply that a physical card is shipped.

### Optimal change

Near price / checkout, add one concise line:

> **Instant digital download · No physical card is shipped**

Rename:

> **Card format**

to:

> **Print size / layout**

Keep the default:
> Portrait · 5 × 7 in

Optional supporting copy:

> Print at home, at a print shop, or share digitally.

Do not repeat this everywhere. One clear reassurance near the transaction is enough.

---

## P0.2 — Checkout trust must be production-grade

### Public build must never show

> Demo only — payment is not connected.

### Price

Use:

> **US$1.99**

until real local-currency pricing exists.

### Checkout reassurance

Keep it short:

- Instant digital download
- High-resolution JPG + print-ready PDF
- No watermark after purchase
- No subscription
- No account required, if this remains true

Add one subtle legal link:

> Refund policy

Do not turn this into a feature list.

### Security behavior

Until payment is verified:
- checkout preview remains watermarked
- clean high-resolution final is never exposed client-side
- redirect success is never sufficient to unlock the final

After verified payment:
- subtle unlock
- watermark fades
- final becomes available

---

## P0.3 — Fix iOS Safari form auto-zoom

The review correctly identified a concrete mobile problem.

On small screens, **all interactive form controls** should use at least:

```css
font-size: 16px;
```

for:
- input
- select
- textarea

This matters more than preserving tiny desktop-like typography inside controls.

Labels can remain 12–13px.

---

## P0.4 — Production-quality CJK typography

0.3.1 has locale-aware Magic Typography and sensible system fallbacks, but cross-device output is not deterministic enough for a premium global product.

### Optimal implementation

For JA / KO / ZH:

- self-host licensed/open WOFF2 fonts
- load only the current locale
- use `unicode-range` / locale-specific CSS
- serif display equivalent for headline
- clean sans for body
- preserve separate CJK line-height and tracking rules

Suggested production direction:
- JP: premium Japanese serif + sans
- KR: premium Korean serif/sans pair
- ZH-CN: premium Simplified Chinese serif + sans

Do not load all CJK font families on the English homepage.

### Required QA

Stress test:
- short headline
- long headline
- mixed Latin + CJK
- punctuation
- 2/3/4-line cases
- Portrait / Square / Landscape

---

## P0.5 — No Photo Story when there is no user photo

This is one of the strongest review findings.

If the user did not upload a photo, do **not** generate a generic fake “Photo Story”.

Use a third non-photo direction instead, for example:

> **Quiet Letter**

or:

> **Keepsake Editorial**

Structure:

1. Elegant Editorial — whitespace / cotton / serif
2. Midnight Lume — full navy / foil / celestial
3. Quiet Letter — typographic / intimate / tactile

If a photo exists:

1. Elegant Editorial
2. Midnight Lume
3. Photo Story

This makes the three directions feel intentionally curated rather than templated.

---

## P0.6 — Refine watermark one final time

The consensus is clear: the watermark concept is correct, but it must feel like a discreet stationery proof mark.

### Final spec

- single mark only
- bottom edge / bottom-right
- 8–10px
- wide tracking
- very low contrast
- no central band
- no diagonal pattern
- no repeated tile
- no interference with headline/photo subject
- separate light/dark version

The user must still think:

> “This card is beautiful.”

not:

> “This preview is locked.”

---

## P0.7 — Mobile Studio must keep the card visually present

I do **not** recommend the most aggressive reviewer suggestion of turning the whole Studio into a bottom sheet.

That adds complexity and risks feeling app-like.

### Better solution

On mobile:

1. Live Preview appears **before** the form.
2. As the user scrolls into the form, show a **small sticky mini-preview** near the top, not a full 40–50% viewport sticky card.
3. Optional section stays collapsed.
4. Primary form path:
   - Occasion
   - Recipient
   - Relationship
   - Feeling
   - Create 3 designs
5. CTA remains easy to reach.

This preserves the card as hero without sacrificing vertical usability.

---

# 5. P1 — Strong Improvements

## P1.1 — Remove “AI” from the hero’s primary brand message

Current positioning should be:

> **Premium greeting cards, thoughtfully composed.**

or similar.

AI can be mentioned lower in:
- How it works
- FAQ
- SEO copy
- technical explanation

The emotional first impression should be stationery, not AI tooling.

---

## P1.2 — Stop prefilling “Olivia”

The form should not look like hardcoded demo data.

Use:

**Recipient name**  
Placeholder:
> e.g., Olivia

The name may be optional.

Before a name is entered, card copy can use:
- For you
- For someone special
- generic occasion copy

Once entered, personalize naturally.

---

## P1.3 — Clarify pre-generation Live Preview

The preview is genuinely reactive, so it should not be called a fake “sample”.

Best label:

> **Live direction preview**

Optional tiny note:

> Final compositions appear after generation.

This preserves the value of Signature Reveal while showing that inputs already matter.

---

## P1.4 — Photo privacy + file guidance

Near upload:

> Used only to compose this card.

Add:
- accepted formats
- max upload size
- remove-photo action

Example:

> JPG, PNG or WebP · up to 10 MB

Keep the existing palette swatches.

If extraction confidence is poor:
- soften the sampled palette automatically
- fallback to the style palette
- do not expose technical warnings unless needed

---

## P1.5 — Magic Typography copy should be human, not feature-speak

Do not constantly display:

> Magic Typography is protecting the composition.

Instead:

> **Keeping the design balanced as you edit**

Only surface a visible status when:
- text becomes long
- layout materially adapts
- CJK line structure changes

The system can still be internally called Magic Typography.

---

## P1.6 — Complete keyboard/a11y semantics

Language menu:
- Escape closes
- focus returns to the trigger
- active language gets `aria-current`
- arrow-key flow remains

Result buttons:
- not just “Choose this direction”
- accessible label:
  - Choose Elegant Editorial
  - Choose Midnight Lume
  - Choose Photo Story

Card previews:
- meaningful accessible label or semantic equivalent
- do not force screen readers to interpret purely decorative art layers

Contrast:
- audit muted text to WCAG AA for normal body copy

---

## P1.7 — Mobile GPU protection

On mobile:
- remove `mix-blend-mode` from repeated gallery grain layers
- prefer opacity/static optimized texture
- keep transform/opacity animations
- do not animate large shadow/blur/filter surfaces
- avoid loading unnecessary locale fonts

This is a better use of the performance budget than adding more micro-effects.

---

## P1.8 — Smooth Photo Palette feedback

The palette result should not suddenly push content downward.

Use:
- reserved small feedback slot, or
- opacity + transform + smooth height reveal

Target:
> ~200–300ms

No decorative thread animation at launch.

---

## P1.9 — Medium-desktop hero fan QA

At approximately 1024–1280px:
- verify center card is not overly covered
- slightly reduce side rotation/overlap if needed

Do not alter the approved desktop fan behavior globally.

This is a breakpoint correction only.

---

## P1.10 — Post-purchase “quiet unlock”

After verified payment:

1. keep the same card object
2. watermark fades
3. rendering sharpens / final replaces preview
4. download actions appear

Microcopy:

> **Your clean final is ready.**

No:
- confetti
- fireworks
- celebration animation
- sound

This is an ownership confirmation, not a second signature WOW.

---

# 6. P2 — Good, But Defer Until After Launch Data

## Local pricing

Potentially useful later, but do not add pricing complexity before real market data.

Launch with:
> US$1.99

## Swipe between result directions

Potentially useful on mobile, but test the current vertical result cards first.

## More gallery guidance

Do not add “Best for birthdays / Best for thank-you” by default yet.

Reason:
- it adds labels
- several reviewers simultaneously recommend less explanation / more boutique display

Material labels are enough at launch.

## “Show me three more” quota

When the actual generation quota is finalized, reflect it truthfully.

Do not add artificial scarcity.

---

# 7. Suggestions to Reject for Launch

These appeared in one or more reviews, but I do **not** recommend adding them to the launch build.

## Gyroscope-driven foil lighting

Reject for launch.

Reason:
- adds browser/device variability
- adds GPU cost
- can become gimmicky
- weak conversion value
- undermines the “motion should be felt before noticed” rule

Potential future experiment only.

## Device vibration / haptics

Defer.

If ever tested:
- only as part of the existing Signature Reveal
- opt-in/browser-supported
- extremely subtle
- never required for the experience

Do not make this part of the launch acceptance criteria.

## Depth-of-field / backdrop-filter showcase effects

Reject.

The card itself should create depth through:
- paper material
- typography
- shadow
- spacing

not through expensive camera-like blur effects.

## Make the entire mobile Studio a bottom sheet

Reject as the default architecture.

Use the simpler sticky mini-preview approach first.

## Add more “wow” animations

Reject.

All four reviews ultimately agree that CardeLume’s premium value comes from restraint.

---

# 8. Final Launch UX — Optimal Version

## Homepage

**Hero**
- premium stationery wording
- primary CTA is dominant
- Explore styles remains a text link
- 2–3 reassurance items maximum
- three-card fan retained

**How it works**
- concise
- AI can be mentioned here, not in the main emotional headline

**Gallery**
- curated collection feel
- 8 featured initially
- material labels
- no SaaS badges
- lightweight mobile textures

**Price section**
- US$1.99
- one-time
- instant digital download
- no subscription
- no physical shipment ambiguity

---

## Studio

Default path:

1. Occasion
2. Recipient name
3. Relationship
4. Feeling
5. Create 3 designs

Collapsed optional:
- Photo
- Print size / layout
- Personal detail

Mobile:
- card first
- sticky mini-preview while editing
- 16px form controls
- 44px tap targets

---

## Generation

One reveal only:

1. paper
2. type
3. artwork
4. lift
5. three directions

~1.2–1.8s.

Keep current ~1.55–1.6s unless real-device measurements indicate a problem.

---

## Three Directions

Without photo:
- Elegant Editorial
- Midnight Lume
- Quiet Letter / Keepsake Editorial

With photo:
- Elegant Editorial
- Midnight Lume
- Photo Story

All three must pass grayscale differentiation.

---

## Finish

Only:
- Message
- Shorter
- Warmer
- More playful
- controlled color mood
- Change photo if applicable
- Choose another direction as navigation, not a design control

No:
- full Regenerate
- Design tab
- layout controls
- typography controls
- layer controls

---

## Checkout

Keep selected card large.

Copy hierarchy:

> **This one feels right.**

> **US$1.99**  
> One-time payment

> Instant digital download · No physical card is shipped

CTA:

> **Get your card ✦**

Small trust:

> High-resolution JPG + print-ready PDF · No watermark after purchase  
> No subscription · No account required  
> Refund policy

The card remains watermarked until server-side verified payment.

---

## Paid Unlock

Same visual card remains on screen.

Then:
- watermark disappears
- clean final replaces preview
- JPG / PDF / Share actions appear

No celebration effects.

---

# 9. Launch Acceptance Tests

## Mobile

Test:
- iPhone Safari
- mid-range Android Chrome

Pass criteria:
- no iOS auto-zoom
- no horizontal overflow
- card remains visible in Studio
- every primary control ≥44px
- reveal stays smooth
- no obvious scroll jank in gallery

## Typography

Test:
- EN
- DE
- FR
- VI
- JA
- KO
- ZH

Pass:
- no clipped glyphs
- no broken Vietnamese diacritics
- no awkward CJK line breaks
- headline does not collapse into tiny text
- 2–3 hierarchy levels remain visible

## Accessibility

Keyboard-only complete path:
- language
- Studio
- results
- Finish
- checkout

Pass:
- visible focus
- Escape behavior
- correct focus return
- accessible labels
- sufficient muted-text contrast

## Conversion / Trust

A new user must answer correctly within ~5 seconds:

1. Is this a digital or physical product?
2. What do I get?
3. How much does it cost?
4. Is it a subscription?
5. Do I pay before or after seeing the card?

Desired answers:

- Digital
- JPG + PDF / share-ready card
- US$1.99
- No subscription
- After seeing and loving the card

## Payment

Pass:
- checkout redirect alone never unlocks final
- webhook verification required
- final asset private before entitlement
- retry/idempotency safe
- watermarked preview remains until payment verified

---

# 10. Final Priority Order

If only 10 changes are allowed before launch:

1. Digital-only clarity.
2. Production checkout trust + US$1.99.
3. iOS 16px form-control fix.
4. CJK production typography.
5. Photo Story fallback when no photo.
6. Final subtle watermark treatment.
7. Mobile sticky mini-preview.
8. Remove AI-first hero wording.
9. Recipient placeholder instead of prefilled Olivia.
10. A11y + mobile GPU polish.

Then stop adding features.

---

# 11. Final Product Principle

The reviews point to one consistent final direction:

> **Less AI. More stationery.**  
> **Less explanation. More confidence.**  
> **Less editing. More art direction.**  
> **Less animation. More material realism.**

The optimal CardeLume is not the version with the most effects or options.

It is the version where the user reaches the end thinking:

> **“This feels like a beautiful card made for someone I care about.”**

—not—

> “This is an impressive AI design tool.”
