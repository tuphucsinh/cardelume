# CardeLume 0.4.3 Step 10 — Launch Security & Data Retention

## Why this step exists

Step 9 made the Pi/VPS runtime observable and fail-closed. Step 10 removes the remaining code-side launch-security rough edges that do not require live credentials or infrastructure.

This step deliberately does **not** redesign CardeLume and adds no new product feature.

## DONE

### Anonymous-session cookie recovery

- `cardelume_anon` is now accepted only when it is a valid UUID.
- A malformed/stale cookie is rotated to a new HttpOnly UUID rather than leaving every protected API request stuck on `anonymous_session_required`.
- Production cookie properties remain Secure + HttpOnly + SameSite=Lax.

### Expiring generation-status capability

- Generation polling capability is no longer a timeless HMAC of `jobId:userId`.
- The token now carries a signed expiry and is bound to both job and anonymous owner.
- Default lifetime: **15 minutes**, bounded to 5–60 minutes through `GENERATION_STATUS_TTL_MINUTES`.
- Verification rejects expired, cross-owner, malformed, future-forged and signature-tampered tokens.

### Transient AI data retention

- Completed/failed `generation_jobs` are treated as transient operational data rather than permanent user-content storage.
- Scheduled cleanup deletes completed/failed generation rows after `GENERATION_RESULT_RETENTION_DAYS` (default **7 days**, bounded in code).
- Active queued/planning/composing/rendering jobs continue using the short stale-job failure path from Step 8.
- Paid card/order artifacts are unaffected; checkout persists its own authoritative CardDocument.

### AI provider response bound

- OpenAI-compatible response envelopes are capped before schema processing.
- Declared `Content-Length` above the cap is rejected.
- The fully received response body is measured again to protect against missing/incorrect length headers.
- Default cap: **65,536 bytes**, bounded to 16 KiB–256 KiB through `AI_MAX_RESPONSE_BYTES`.
- Oversize response fails with `ai_provider_response_too_large`; the existing durable job/fallback path handles it safely.

### HTTPS hardening

Global web headers now include:

- `Strict-Transport-Security: max-age=31536000`
- `X-Permitted-Cross-Domain-Policies: none`

Existing `nosniff`, frame denial, permissions policy, referrer policy and CSP report-only coverage remain.

CSP intentionally remains **report-only** until real browser/payment/upload QA validates an enforcing policy. Enforcing an untested CSP immediately before launch could break Next.js runtime or payment/upload flows.

### Restore safety

The isolated restore helper now refuses to run when `RESTORE_DATABASE_URL` exactly matches an exported `DATABASE_URL`, even when the explicit restore confirmation variable is present.

## NOT CHANGED

- Renderer semantic output remains `0.4.3-step.5`.
- Dodo authoritative payment model is unchanged.
- Secure paid recovery model is unchanged.
- Trusted photo quarantine/sanitize/binding model is unchanged.
- AI planner/product UX remains CardeLume-specific.
- Holiday Bundle remains dormant and fail-closed.

## External launch gates still required

- install dependencies and generate/review a lockfile;
- full `pnpm typecheck`, `pnpm build`, `pnpm test`;
- apply migrations 0001–0007 to controlled DB;
- real AI / pg-boss / R2 / Dodo end-to-end tests;
- Cloudflare edge rules and Pi5↔Oracle failover matrix;
- real backup + isolated restore rehearsal;
- replace/approve legal pages before `LEGAL_CONTENT_APPROVED=true`;
- native-language, device, browser and accessibility QA;
- review CSP reports, then enforce a tested CSP as a post-QA hardening change.
