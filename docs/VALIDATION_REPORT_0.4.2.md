# Validation Report — CardeLume 0.4.2 Global Launch Hardening

**Offline validation: PASS**

## Smart Locale behavior

Resolution order:

```text
explicit ?lang
→ saved cardelume_locale cookie
→ browser Accept-Language
→ market fallback
→ English
```

Validated cases include:

- explicit JA overrides saved VI/browser FR/market DE
- saved VI overrides browser JA/market JP
- browser EN in market VN stays EN
- browser VI in market US becomes VI
- browser FR-CA in Canada becomes FR
- unsupported browser language + market VN becomes VI
- unsupported browser language + market JP becomes JA
- browser ES in Germany remains ES
- `pt-BR` maps to PT
- generic `pt` and `pt-PT` do not auto-map to PT-BR
- `zh-CN` maps to ZH
- generic `zh`, `zh-TW`, and `zh-Hant-HK` do not auto-map to Simplified Chinese
- `q=0` browser languages are ignored
- Argentina market fallback uses ES
- Austria market fallback uses DE
- unsupported browser + unsupported market falls back to EN

## Offline checks completed

- All `package.json` files parse as valid JSON.
- Production `globals.css`: **651 balanced CSS blocks**.
- Watchdog/bootstrap/doctor shell scripts pass `bash -n`.
- **55 TS/TSX source files** pass TypeScript syntactic transpile diagnostics.
- All relative TS/JS imports resolve to packaged source files.
- Smart-locale priority, q-value parsing, market fallback and script/region restraint tests pass.
- Next.js Proxy stores the locale cookie only for explicit valid `?lang=` choice.
- Automatic browser/market locale detection remains non-sticky.
- Only the language switcher emits `?lang=` during ordinary navigation.
- Locale resolution and market-pricing resolution remain separate server paths.
- Standalone review contains **9 JavaScript blocks**; all pass `node --check`.
- No runtime `.env`, `.env.local`, `.env.production` or font binaries are packaged.

## Production behavior to verify on Pi5 / Cloudflare

Hermes must still verify:

- `CF-IPCountry` reaches the Next.js origin through the chosen Cloudflare Tunnel setup.
- locale cookie survives repeat visits on Chrome / Safari / Android.
- browser language headers are preserved as expected by Cloudflare/proxy.
- `en-US` browser in Vietnam produces English UI while market pricing stays VN.
- `vi-VN` browser in the US produces Vietnamese UI while market pricing stays US.
- direct `?lang=xx` sets the locale cookie and later clean URLs preserve that choice.
- automatic detection does not create a locale cookie.
- full `pnpm install`, `pnpm typecheck`, and `pnpm build` succeed on the controlled dependency set.

## SEO boundary

Smart Locale is a request-time UX feature. It does not replace future stable localized marketing URLs and canonical/hreflang work.
