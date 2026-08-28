# CardeLume 0.4.3 Step 8 — Production AI Provider + Durable Generation

## DONE

- Live `/api/generate` no longer returns a scaffold 501.
- Generation start is bound to the current signed CardeLume single-card session capability and a client idempotency key.
- `generation_jobs` stores request hash, brief, stage, result, attempts and terminal timestamps.
- A separate HMAC status capability is returned; status polling requires both the current anonymous owner cookie and this token.
- pg-boss queues are explicitly created before use. AI plan jobs use a bounded retention window and duplicate sends are throttled by a deterministic singleton key.
- Worker parses a typed job payload, claims the durable row, calls the production provider/planner, validates the three allowed direction IDs and copy density, then persists a safe result.
- `AI_PROVIDER=openai-compatible` supports OpenAI-compatible chat-completions endpoints via `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` without coupling CardeLume business logic to one vendor.
- `AI_PROVIDER=mock` is fail-closed in live/production runtime.
- Provider request has a bounded timeout. Provider/schema/markup/copy-density failures become a generic failed job; provider internals are never returned to the browser.
- Successful live jobs return exactly three copy directions to Studio. Step 4 curated fallback remains the availability fallback if start/status/provider/network/deadline fails.
- Hourly pg-boss maintenance schedule expires stale generation rows and runs photo cleanup.

## Provider boundary

The provider only returns structured copy. It cannot emit raw HTML/SVG/CSS/JS into rendering and does not control R2 keys, Card IDs, payment state, or final renderer markup.

## EXTERNAL

- Apply `0006_durable_generation.sql`.
- Set strong `GENERATION_STATUS_SECRET`.
- Set real `AI_PROVIDER`, `AI_API_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- Use a session-capable/direct PostgreSQL URL for pg-boss (`QUEUE_DATABASE_URL` preferred).
- Validate provider latency/cost and real model quality on Pi/VPS.

## NEXT

Production observability/worker health/rate-limit and launch hardening.
