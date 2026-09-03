# HANDOFF — CardeLume

- Public non-payment technical beta: `PASS` with payment OFF.
- Public URL: `https://cardelume.vorigin.vn` → isolated `127.0.0.1:3010`.
- Public health: `/health/live`, `/health/ready`, `/health/worker` all `200`.
- Public security: CSP/HSTS/frame/nosniff/Referrer PASS; anonymous admin `403`; no CORS/R2/secret markers.
- Public journey: brief → generation → 3 directions → select → finish → JPG/PDF; both exports `200`.
- Primary OpenCode Go `gpt-5.6-luna` attempt returned `ai_direction_count_invalid`; bounded fallback completed once; no retry loop.
- Console JS errors: `0`; desktop `1440x900` and mobile `390x844` smoke usable.
- Finish focus fix verified: heading top `90px`, sticky header bottom `71px`, no coverage.
- Payment boundary: `503 payment_disabled`; no Dodo/order/PAID/entitlement bypass.
- `vorigin.vn`, `www.vorigin.vn`, ports `8080/8081`, and `/srv/vorigin` unchanged.
- Evidence: `.ai/evidence/public-beta-20260903.json` plus `/home/pi5/hermes-artifacts/browser-evidence/cardelume-public-20260903/`.
- Phase 20 remains `DONE — PASS`; Dodo `DEFERRED_BY_OWNER`; Oracle `DEFERRED_BY_OWNER_INFRA`.
- Legal: Owner approved; `LEGAL_CONTENT_APPROVED=true`, `LEGAL_NATIVE_COPY=APPROVED`, `PUBLIC_BETA_READY_WITH_PAYMENT_OFF=PASS`.
- Next: keep payment OFF and Dodo deferred; do not reopen technical gates, activate payment, or merge `main`.
