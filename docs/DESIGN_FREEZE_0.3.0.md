# CardeLume 0.3.0 — Design Freeze

## Frozen visual DNA

- Deep Navy / Ivory / Champagne Gold.
- Footer open-card/light symbol is also the header symbol.
- Header wordmark is HTML `CARDELUME`.
- Real card radius 4–8px; UI containers 18–28px.
- Original V2 fan behavior stays.
- No continuous sheen sweep.
- Card is the hero.
- One signature WOW interaction: Card Reveal.
- Result → Finish keeps the selected card visually continuous.
- Studio is editorial and simple, not dashboard-like.
- Editor means **Finish your card**, not **Design your card**.
- Checkout sells the card, not a feature list.

## Frozen language-switcher UI

Collapsed:

```text
[flag] EN ▾
```

No duplicate country-code circle + language code.

Dropdown:

```text
[flag] English
       United States / Global
```

No:

- Popular markets
- Primary
- High potential
- Strong spend
- Large market
- Secondary

## Supported baseline locales

EN, JA, KO, ES, FR, DE, PT-BR, IT, ZH-CN, VI.

The baseline has real translated UI/copy for review. Before public indexable locale pages, native-language QA and stable locale URLs are required.

## Typography freeze

Magic Typography must consider:

- locale/script
- estimated visual density
- actual browser text width for editable copy
- card format
- headline vs body hierarchy
- line height
- text-block width
- tracking

User editing must not be able to make the card look un-art-directed.

## Performance freeze

- transform + opacity for motion
- no continuous large blur/shadow/background-position animation
- coarse pointers get calmer motion
- `prefers-reduced-motion` respected
- test on mid-range Android, iPhone Safari, Chrome/Edge and low-power laptop

## Allowed changes after freeze

- bug fixes
- native localization corrections
- measurable performance improvements
- accessibility improvements
- production provider wiring
- security fixes
- renderer parity fixes
- real-device layout fixes

## Not allowed without explicit product decision

- new design system
- Canva-like controls
- extra signature animations
- purple AI visual language
- feature-wall checkout
- alternate header logo
