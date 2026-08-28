# Localization Completeness Audit — 0.3.1

## Goal

When the user changes language, the experience must not feel half-English / half-localized.

Supported baseline locales:

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

## Fixed in 0.3.1

### Header / language menu
- locale region names use native forms where practical (`日本`, `대한민국`, `Deutschland`, `Brasil`, `中国`, `Việt Nam`)
- language aria label follows locale
- current page remains in the selected locale in production baseline

### Homepage
- hero marketing copy
- proof line
- hero sample-card copy
- trust/stat blocks
- How it works
- gallery header
- featured style display names
- featured material descriptions
- example card copy
- price/CTA/footer copy

### Studio
- section introduction
- field labels and hints
- optional labels
- photo upload copy
- photo-palette feedback
- format option labels
- example personal detail
- generation note
- preview footer
- result back action

### Results
- direction title / subtitle
- fit badge
- “why this works” copy
- result tags
- result decorative micro-copy/signature
- choose/regenerate controls

### Finish / Editor
- heading
- message controls
- Magic Typography status context
- design/color/photo/regenerate controls
- selected card copy after changing locale

### Checkout
- title
- emotional purchase copy
- one-time-payment copy
- final-delivery copy
- CTA
- demo-state note

### Gallery / footer
- filter names
- 16 style display captions/materials in standalone master review
- gallery sample text
- view-all/view-less action
- editorial quote
- pricing block
- footer navigation
- footer occasion links
- footer legal labels

### Legal placeholder pages
- Privacy and Terms placeholders follow the selected locale
- footer links preserve `?lang=<locale>`

## Intentional global terms

These may remain unchanged because they are product/technical identifiers rather than accidental English leakage:

- `CardeLume`
- `CARDELUME`
- `JPG`
- `PDF`
- `HD`
- `Magic Typography`
- `Magic Fit`
- file dimensions such as `5 × 7 in`
- `$1.99`
- certain internationally recognizable production terms where used as material names, e.g. `Washi`, `Hanji`, `Letterpress`, `Risograph`, `Gouache`, `Kawaii`

## Remaining pre-launch requirement

The translations are product-quality baseline copy, but each non-English locale should receive native-speaker proofreading before indexable public locale pages launch.
