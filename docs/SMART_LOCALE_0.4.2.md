# CardeLume 0.4.2 — Smart Locale Detection

## Goal

Give a new visitor the most appropriate supported CardeLume language without coupling UI language to pricing market.

Core rule:

```text
explicit user/campaign choice
        ↓
saved user choice cookie
        ↓
browser Accept-Language
        ↓
market fallback
        ↓
English
```

Pricing remains independent:

```text
locale → UI language / emotional copy
market → price / currency
```

Examples:

```text
market=VN + browser=en-US → UI English, VN market price
market=VN + browser=vi-VN → UI Vietnamese, VN market price
market=CA + browser=fr-CA → UI French, CA market price
market=DE + browser=es-ES → UI Spanish, DE market price
```

## Supported UI locales

- EN — English / Global
- JA — Japanese
- KO — Korean
- ES — Spanish baseline
- FR — French
- DE — German
- PT — Brazilian Portuguese
- IT — Italian
- ZH — Simplified Chinese
- VI — Vietnamese

## Explicit user choice is sticky

When the user selects a language, the switcher navigates with:

```text
?lang=<locale>
```

Next.js Proxy treats that as an intentional choice and stores:

```text
cardelume_locale=<locale>
```

Cookie behavior:

- 1 year
- SameSite=Lax
- Secure in production
- HttpOnly
- path `/`

The browser/market automatic result is deliberately **not** persisted until the user actually chooses a language.

## Browser-language behavior

`Accept-Language` is parsed with q-values.

Supported examples:

```text
vi-VN → vi
ja-JP → ja
ko-KR → ko
fr-CA → fr
es-MX → es
pt-BR → pt
zh-CN / zh-SG / zh-Hans → zh
```

Important restraint:

- Generic `pt` and `pt-PT` are **not automatically mapped** to the Brazilian Portuguese pack.
- Generic `zh` plus `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant` are **not automatically mapped** to Simplified Chinese.

Those visitors fall through to another browser preference, market fallback, or English. They can still manually choose any supported language.

This avoids the product looking culturally careless.

## Market fallback

Market fallback is only used when the browser does not express a supported preference.

```text
JP → ja
KR → ko
ES / MX / major Spanish-speaking LATAM markets → es
FR → fr
DE / AT / LI → de
BR → pt
IT / SM → it
CN → zh
VN → vi
```

Markets such as US / GB / CA / AU / SG / IN default to English unless the browser has a supported language preference.

## Next.js 16 implementation

The request preprocessing file is:

```text
apps/web/proxy.ts
```

It adds request-only headers:

```text
x-cardelume-locale
x-cardelume-locale-source
x-cardelume-anon
```

The page layer uses `requestLocale()` and remains independent of pricing resolution.

## Mock/review behavior

Only when `APP_MODE=mock`, `?market=XX` can simulate a market fallback.

Examples:

```text
/?market=VN
/?market=JP
/?market=FR
```

Production does not trust `?market`; it uses trusted edge country headers.

## Internal navigation

Ordinary internal links no longer append `?lang=<resolved locale>`.

Why:

If an automatically detected language were appended to every internal link, the Proxy would interpret it as an explicit choice and accidentally make it sticky.

Only the actual language selector emits `?lang=`.

## QA matrix

| Case | Expected |
|---|---|
| cookie=vi, browser=en, market=US | VI |
| no cookie, browser=vi-VN, market=US | VI |
| no cookie, browser=en-US, market=VN | EN |
| no cookie, browser unsupported, market=VN | VI |
| no cookie, browser=fr-CA, market=CA | FR |
| no cookie, browser=es-ES, market=DE | ES |
| no cookie, browser=pt-PT, unsupported market | EN |
| no cookie, browser=zh-TW, unsupported market | EN |
| explicit ?lang=ja + cookie=vi | JA and JA becomes sticky |

## SEO note

This is request-time UX localization, not the final SEO URL architecture.

Before indexable localized marketing pages, CardeLume should still move to stable locale URLs with truthful canonical/hreflang behavior.
