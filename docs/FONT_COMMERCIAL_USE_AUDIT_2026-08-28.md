# CardeLume Font Commercial-Use Audit — 2026-08-28

## Decision summary

CardeLume's current font families are **family-level license eligible for commercial greeting-card use** because the researched upstreams use the SIL Open Font License 1.1 (OFL-1.1). Under OFL, fonts may be used for graphics, websites, print/stationery and other design work; documents/artwork created with the font do not inherit OFL. Font files may also be bundled/embedded subject to the OFL conditions and preserving required license/copyright information when redistributing the font software.

This does **not** convert any current production manifest entry to `APPROVED`. The repository still lacks a frozen dependency graph, exact Fontsource package versions, exact Debian font package versions, shipped binary hashes and retained per-binary license evidence. CardeLume therefore keeps the production rule:

> **Family license eligible != exact shipped binary approved.**

Production remains fail-closed until exact provenance is collected.

## Current fonts

| Current family/source | Role | Family license | Commercial cards | Main finding | Action |
|---|---|---|---|---|---|
| Cormorant Garamond / Fontsource | Web brand + display | OFL-1.1 | Yes | Current Google Fonts metadata includes Vietnamese | **Keep** |
| DM Sans / Fontsource | Global web UI/body | OFL-1.1 | Yes | Current Google Fonts + Fontsource distributions list Latin/Latin-ext, not Vietnamese subset | **Replace for global UI** |
| Noto Serif JP / Noto Sans JP | Japanese | OFL-1.1 | Yes | Strong deterministic baseline | **Keep** |
| Noto Serif KR / Noto Sans KR | Korean | OFL-1.1 | Yes | Strong deterministic baseline | **Keep** |
| Noto Serif SC / Noto Sans SC | Simplified Chinese | OFL-1.1 | Yes | Strong deterministic baseline | **Keep** |
| EB Garamond / Debian | Final renderer Latin serif | OFL-1.1 | Yes | Google Fonts metadata includes Vietnamese | **Keep baseline; pin/hash later** |
| Lato / Debian | Final renderer Latin sans | OFL-1.1 | Yes | Google Fonts metadata includes Vietnamese | **Keep baseline; pin/hash later** |
| Noto CJK / Debian | Final renderer CJK/Hangul | OFL-1.1 upstream | Yes | Exact Debian package evidence still needed | **Keep; pin/hash later** |

### Important localization issue: DM Sans

`apps/web/app/layout.tsx` imports DM Sans and `globals.css` uses it as the global `--sans`. Current upstream Google Fonts metadata for DM Sans has `latin`, `latin-ext`, and `menu` but no `vietnamese`; current Fontsource CDN metadata likewise exposes only `latin` and `latin-ext`.

This is a quality risk for CardeLume's Vietnamese UI: unsupported/missing glyphs can fall back to a system font, causing mixed metrics and visual inconsistency. It is not a copyright problem; it is a typography/localization problem.

## Recommended premium font stack

### Default launch stack

1. **Display / brand / premium headings: Cormorant Garamond — KEEP.**
   - Strong CardeLume fit: editorial, elegant, warm rather than generic luxury black/gold.
   - OFL-1.1.
   - Vietnamese coverage in current Google Fonts/Fontsource metadata.

2. **Global UI/body: Plus Jakarta Sans — PRIMARY replacement candidate for DM Sans.**
   - OFL-1.1.
   - Verified Vietnamese subset.
   - Variable 200–800; contemporary without feeling sterile.
   - Must remain experiment-only until dependency pinning, build, CLS/layout and multilingual QA pass.

3. **Final Latin renderer: EB Garamond + Lato — KEEP as controlled baseline for now.**
   - Both OFL-1.1; both include Vietnamese in current Google Fonts metadata.
   - Do not change production renderer font metrics before Golden benchmark and preview/final parity tests.
   - Later benchmark `Cormorant Garamond + Plus Jakarta Sans` as a parity-oriented renderer stack.

4. **Japanese/Korean/Chinese: Noto Serif/Sans CJK — KEEP as primary baseline.**
   - OFL-1.1 upstream.
   - Broad glyph coverage and predictable multi-platform behavior.
   - Step 17C changes page-level CJK/Hangul premium headings to prefer bundled Noto before OS-specific fonts, reducing cross-device typography drift.

### Premium experiment candidates

| Family | Best use | License | VI | Verdict |
|---|---|---|---|---|
| Plus Jakarta Sans | UI/body | OFL-1.1 | Yes | **Top candidate** |
| Inter | UI neutral fallback | OFL-1.1 | Yes | Safe alternate |
| Manrope | Modern UI alternate | OFL-1.1 | Yes | Experiment |
| Newsreader | Intimate/editorial cards | OFL-1.1 | Yes | **Strong premium experiment** |
| Fraunces | Expressive celebratory display | OFL-1.1 | Yes | Use selectively; not global brand font |
| Source Han Serif | Pan-CJK premium serif alternate | OFL-1.1 | N/A | Experiment only |
| Zen Old Mincho | JP-specific premium display | OFL-1.1 | N/A | Experiment only; upstream archived in 2026, pin exact artifact |
| Gowun Batang | KR warm/human display | OFL-1.1 | N/A | Experiment only + native review |

## Licensing operating rule

For an OFL font used only to render a sold JPG/PDF/printed greeting card, CardeLume may commercially sell the resulting card/artwork. The card itself does not become OFL-licensed merely because it uses the font.

When CardeLume redistributes/bundles the font software in the web/app/container, preserve the applicable copyright/license evidence as required. Do not sell the font by itself. If a font has Reserved Font Names, do not use the reserved name for a modified font without permission.

## Production approval evidence required per font binary

Before a font becomes `APPROVED` in production:

- exact package or upstream version;
- exact file(s) shipped;
- SHA-256 of shipped binary;
- authoritative source URL;
- copied license/copyright evidence;
- confirmation of commercial use and bundling terms;
- any Reserved Font Name restrictions;
- browser + final renderer glyph coverage;
- EN/VI + relevant CJK/Hangul typography QA;
- preview/final metric parity evidence.

## Authoritative research sources

- SIL Open Font License official text: https://openfontlicense.org/open-font-license-official-text/
- SIL guidance for using OFL fonts: https://openfontlicense.org/how-to-use-ofl-fonts/
- Google Fonts Cormorant Garamond metadata: https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/METADATA.pb
- Google Fonts DM Sans metadata: https://github.com/google/fonts/blob/main/ofl/dmsans/METADATA.pb
- Google Fonts Plus Jakarta Sans metadata: https://github.com/google/fonts/blob/main/ofl/plusjakartasans/METADATA.pb
- Google Fonts Inter metadata: https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb
- Google Fonts Manrope metadata: https://github.com/google/fonts/blob/main/ofl/manrope/METADATA.pb
- Google Fonts EB Garamond metadata: https://github.com/google/fonts/blob/main/ofl/ebgaramond/METADATA.pb
- Google Fonts Lato metadata: https://github.com/google/fonts/blob/main/ofl/lato/METADATA.pb
- Google Fonts Fraunces metadata: https://github.com/google/fonts/blob/main/ofl/fraunces/METADATA.pb
- Google Fonts Newsreader metadata: https://github.com/google/fonts/blob/main/ofl/newsreader/METADATA.pb
- Noto CJK upstream: https://github.com/notofonts/noto-cjk
- Adobe Source Han Serif OFL license: https://github.com/adobe-fonts/source-han-serif/blob/master/LICENSE.txt

This is an engineering/IP-governance audit, not jurisdiction-specific legal advice.

## Step 17D additions — verified free/commercial-safe candidates

The following additional candidates were checked against current Google Fonts metadata and added to the experiment catalog. They are family-level **OFL + commercial-use eligible** and currently include the Vietnamese subset:

| Family | Intended CardeLume role | Decision |
|---|---|---|
| Be Vietnam Pro | Vietnamese-first UI/body comparator | Strong experiment alternate |
| Lora | Warm heartfelt serif | Experiment |
| Spectral | Premium editorial / long-copy serif | Experiment |
| Source Serif 4 | Renderer/editorial robustness | Strong experiment |
| Literata | Literary/intimate serif | Experiment |
| Crimson Pro | Soft classic premium serif | Experiment |

Current metadata also shows that some visually attractive OFL families such as Bodoni Moda and Figtree do not expose a Vietnamese subset in Google Fonts metadata. They are therefore not prioritized for CardeLume's global Latin/VI production pool even though their license itself is permissive enough for commercial design use.

CardeLume should promote **fewer winning fonts**, not accumulate every eligible font. The additional families exist to benchmark a coherent type system, not to become a customer-facing font picker.
