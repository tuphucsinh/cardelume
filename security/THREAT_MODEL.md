# CardeLume Threat Model — Step 17B

Status: source-level model for the V7 launch architecture. This document does not claim a penetration test or production validation.

## Trust boundaries

1. **Browser / anonymous customer** — untrusted input, uploads, brief text, locale/market hints and client state.
2. **Cloudflare edge** — DNS/TLS/WAF/rate-limit/tunnel boundary. Production behavior must be validated against the live zone; source cannot prove it.
3. **Web application** — server routes, anonymous session binding, pricing quote, checkout, recovery and admin endpoints.
4. **Worker** — AI orchestration, rendering, cleanup and queue consumers; treats jobs and referenced objects as untrusted until validated.
5. **Supabase/PostgreSQL + pg-boss** — business state and queue state. RLS is defense in depth and must be exercised in staging.
6. **Cloudflare R2** — public catalog assets vs private uploads/previews/finals. Private finals require verified entitlement plus short-lived signed URLs.
7. **Dodo Payments** — external payment authority. Browser return/success is never sufficient; webhook/server verification is authoritative.
8. **AI provider** — external processor. Prompts must be bounded and privacy-minimized; provider output is untrusted structured input.
9. **Lumer/Hermes operator** — privileged automation boundary. Read/experiment/staging autonomy is allowed by policy; production/destructive actions remain owner-approval gated.
10. **Build/supply chain** — npm/pnpm, Debian packages, base images and CI artifacts. Missing provenance/lock/SBOM/vulnerability evidence is a release failure.

## High-value assets

- payment entitlement and order state;
- paid JPG/PDF and recovery capability secrets;
- customer uploaded photos and transient brief/copy content;
- production database, R2 credentials and service-role credentials;
- AI/payment/API keys;
- template catalog, immutable template versions and production assets;
- Lumer production permissions, release evidence and audit logs.

## Primary abuse cases and controls

| Threat | Main controls | Remaining Step 17B gate |
|---|---|---|
| Unlock paid final without payment | verified Dodo webhook, server-side entitlement, signed R2 URL | real Dodo test-mode E2E not executed here |
| Replay/tamper webhook or capability | HMAC-SHA256, timestamp tolerance, timing-safe comparison, expiry/replay guards | provider E2E evidence required |
| Upload malicious/decompression-bomb image | size/content whitelist, Sharp decode/re-encode, pixel cap, random keys, quarantine | adversarial staging upload test required |
| IDOR / unauthorized card or admin access | session binding, server authorization, RLS, admin mutation guard | full RLS matrix + identity-aware admin edge gate required |
| Secret leakage | gitignore, blank env examples, source scanner, least-privilege policy | runtime secret manager/rotation evidence required |
| Dependency compromise | digest-pinned base/tunnel images, source SBOM tooling | `pnpm-lock.yaml`, release SBOM and vulnerability scan missing |
| XSS/content injection | React escaping, CSP report telemetry plan, security headers | enforced nonce/hash CSP is not implemented/validated yet |
| CSRF / cross-origin mutation | SameSite cookies, server-bound capabilities and route checks | explicit staging CSRF/cross-origin test required |
| PII leakage in logs | content-free operational telemetry intent, structured event design | centralized log ACL/retention and event coverage not validated |
| Lumer exceeds authority | least privilege, owner approval checkpoints, fail-closed release tools | Pi5 profile permissions/bootstrap must be validated |
| Copyright/license violation | provenance manifests + hard release gate | all current production font/brand/template provenance still unresolved |
| HA node bypasses security | shared external state, same runtime contract, health readiness | Pi5↔Oracle failover/security parity not executed |

## Abuse invariants

- No clean high-resolution final before server-side payment verification.
- Unknown asset/license provenance cannot be promoted to production.
- No Lumer skill or script may interpret a source-only PASS as production approval.
- Production credentials must never be accepted in experiment/staging lanes, and non-production credentials must never be accepted in production.
- A security gate may fail closed; it must never silently downgrade to a warning for production.
