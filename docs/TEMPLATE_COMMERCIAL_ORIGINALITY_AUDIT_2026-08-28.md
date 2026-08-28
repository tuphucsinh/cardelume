# CardeLume Template Commercial / Originality Audit — 2026-08-28

## Executive conclusion

The current 16 CardeLume seed templates are not imported Canva/Etsy/Pinterest/competitor template files. Source inspection shows their renderer artwork is generated from repository code using SVG primitives such as circles, lines, rectangles, ellipses and paths; `Photo Story` relies on the user's photo rather than a bundled third-party illustration.

That is a **good IP architecture**, but it does not automatically prove every composition is safe to publish. A template can still resemble protected original visual expression even when rebuilt from simple primitives. The production gate therefore remains:

> **Repo-authored code + no external asset dependency is necessary, but explicit originality review and third-party visual-similarity review are still required.**

All 16 existing template provenance records remain `UNKNOWN/PENDING` until that review is signed off. No fake approval was added.

## Copyright boundary used for this audit

The U.S. Copyright Office distinguishes unprotectable ideas, methods, familiar symbols/designs and typeface-as-typeface from protectable original pictorial/graphic expression. Original composition, depiction and combinations of design elements can be protected. CardeLume therefore may learn from broad design principles but must not reconstruct a competitor's particular composition.

Safe research transformation:

```text
market/reference
→ abstract insight
→ original CardeLume creative thesis
→ renderer-safe procedural composition
```

Forbidden transformation:

```text
competitor card
→ copy layout/illustration hierarchy
→ change font/color
```

## Current portfolio audit

| Current template | IP/source finding | Portfolio action |
|---|---|---|
| Luxury Editorial | Procedural; strong type/space basis | **Keep + strengthen** |
| Midnight Lume | Procedural; distinctive brand-adjacent nocturne potential | **Keep + strengthen** |
| Botanical Poise | Procedural, but botanical linework is very common | **Keep only after similarity review** |
| Washi Elegance | Procedural; cultural/material shorthand can become stereotypical | **Rename + reframe** |
| Soft Seoul | Procedural; city-name aesthetic can become stereotypical | **Rename + reframe** |
| Art Deco Noir | Historical style is broad; generic black/gold is template-like | **Keep as niche, restrain** |
| Photo Story | User-photo-driven; low external-art dependency | **Keep + strengthen** |
| Quiet Minimal | Strong premium structural baseline | **Keep + strengthen** |
| Watercolor Bloom | Generic watercolor/floral category is saturated | **Replace / major rework** |
| Golden Hour | Generic retro sun/landscape motif | **Replace / major rework** |
| Quiet Noir | Useful formal dark archetype | **Keep as niche** |
| Bold Pop | Generic geometric pop can feel commodity/template-like | **Rework to type-driven celebration** |
| Kawaii Joy | Cultural shorthand + generic cute shapes | **Rename + major rework** |
| Classic Letterpress | Strong tactile/typographic premium thesis | **Keep + strengthen** |
| Celestial Night | Overlaps Midnight Lume; constellation motif is common | **Merge/rework or retire** |
| Little Wonders | Warm but generic gouache/cut-paper blob language | **Rework** |

These are portfolio/design-risk decisions, not claims that any current template infringes copyright.

## Recommended original replacement directions

Step 17C adds 12 **experiment-only** concepts under `experiments/template-concepts/TEMPLATE_CONCEPTS_V2.json`. They are intentionally described as creative theses and renderer-safe primitive systems rather than third-party template references.

### Highest-priority concepts

**Whispered Type** — oversized off-center serif word + micro-copy + one hairline. Premium through typography and negative space, not decoration.

**Museum Note** — quiet message surrounded by recipient/date micro-labels. Editorial, personal, international and naturally suited to long/short copy variants.

**Monogram Orbit** — initials/date/age generate a unique parametric orbit. Personalization itself becomes the artwork, giving CardeLume a defensible signature rather than a generic template.

**Ribbon Line** — one continuous procedural Bézier gesture crosses behind the message. Emotional movement without stock illustration.

**Memory Window** — user photo as an asymmetric memory fragment with date/micro-caption, not a generic centered photo frame.

**Type Celebration** — celebration through scale, tracking, one controlled rotation and accent color; explicitly no confetti.

**Quiet Seal** — a small procedural seal generated from initials/occasion in a large field of negative space.

Other candidates: Pressed Shadow, Ink Pause, Petal Geometry, Night Ledger, Soft Fold.

## Current templates that should NOT be replaced by downloaded third-party templates

Do not solve the portfolio weakness by buying/importing large packs from Etsy, Creative Market, Canva, Pinterest references, etc. Even with a commercial license, that would weaken CardeLume's differentiation and complicate per-asset/template provenance. CardeLume should use those markets only for **trend/positioning research** and create original compositions from abstract observations.

If a third-party production asset is ever used, it must enter `ASSET_PROVENANCE_MANIFEST.json` with exact commercial rights, derivative/redistribution terms and evidence before the template can publish.

## Market-reference insights permitted for abstraction

Current premium stationery examples repeatedly show useful broad principles:

- generous negative space;
- restrained line work rather than dense ornament;
- tactile print cues such as letterpress/emboss/foil used sparingly;
- strong typographic hierarchy;
- one focal gesture rather than many decorative elements;
- photo-forward compositions with disciplined margins and captions;
- natural/off-white papers and quiet palettes.

These are **design-language observations**, not reusable layouts/assets. The example cards/images themselves remain third-party works and are not production inputs.

## New production/review rule

A CardeLume template may move from experiment → staging → production only when all of the following are true:

- renderer uses only approved fonts/assets or original procedural primitives;
- provenance manifest complete;
- owner originality attestation complete;
- visual similarity review against the references used during research complete;
- no traced/copied third-party illustration or layout;
- multi-locale copy-pressure and typography QA pass;
- Golden benchmark shows premium/WOW benefit;
- copyright-audit skill returns PASS;
- production promotion remains owner-approval gated.

## Reference law/guidance

- U.S. Copyright Office — visual/graphic artists: https://www.copyright.gov/engage/visual-artists/
- 37 CFR 202.1 — material not subject to copyright: https://www.copyright.gov/title37/202/37cfr202-1.html
- Copyright basics/originality: https://www.copyright.gov/what-is-copyright/
- Copyright Office Circular 33 index: https://www.copyright.gov/circs/

This is an engineering/IP-governance audit, not jurisdiction-specific legal advice.
