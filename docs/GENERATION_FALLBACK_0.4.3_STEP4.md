# CardeLume 0.4.3 Step 4 — Premium AI Failure Fallback

## Why this step exists

A premium card flow must not collapse into a technical error when the live generation provider, queue route, network, or status polling is temporarily unavailable. CardeLume already owns a curated product-layer set of three safe visual directions; Step 4 turns those directions into a deterministic availability fallback instead of sending the customer back to the brief.

This step does **not** claim that the production AI provider or durable generation queue is live. It hardens the customer journey around those dependencies.

## DONE

### Failure-safe Studio flow

When live generation succeeds:

```text
Brief → Reveal → live generation ready → 3 directions → Finish → Checkout
```

When live generation fails:

```text
Brief → Reveal → provider/queue/network failure
                  ↓
       curated CardeLume fallback
                  ↓
          3 premium directions
                  ↓
             Finish → Checkout
```

The user is no longer returned to the brief after a live generation failure.

### Deterministic curated fallback

- The fallback uses the existing CardeLume-owned direction set.
- Photo brief: the existing three-result branch remains photo-aware.
- No-photo brief: the existing three-result branch remains safe without a photo asset.
- Brief values, uploaded-photo preview state, locale, format and copy remain intact.
- The fallback does not call another external model and does not invent fake provider output.
- The fallback remains CardeLume-specific product behavior, not a generic universal design engine.

### Bounded client generation

`apps/web/lib/generation-client.ts` now normalizes live failures into a small semantic error contract and prevents indefinite polling:

- per-request timeout: **8 seconds**,
- overall live generation deadline: **24 seconds**,
- start HTTP failure → `generation_start_failed`,
- missing durable job ID → `generation_job_missing`,
- invalid/status HTTP failure → `generation_status_failed`,
- provider job failure → `generation_provider_failed`,
- network failure → `generation_network_failed`,
- deadline/request timeout → `generation_timeout`.

Raw provider error detail is not surfaced through the browser flow.

### Correct user abort behavior

A deliberate browser/user cancellation remains an `AbortError` and exits quietly. It is not converted into a curated fallback result.

### Premium localized UX

All 10 launch locales now have:

- a short reveal-stage fallback-ready line,
- a subtle results-page explanation that CardeLume prepared three curated directions,
- no red technical error state,
- no requirement to restart the brief.

Locales: EN / JA / KO / ES / FR / DE / PT / IT / ZH / VI.

### Regression guard

Step 4 does not change:

- secure paid recovery,
- authoritative PAID checks,
- private final artifacts,
- final renderer behavior,
- Step 3 typography floors/overflow rules,
- pricing/locale separation,
- CardeLume finishing-only UX,
- Holiday Bundle launch state.

The renderer version remains **`0.4.3-step.3`** because Step 4 changes generation availability behavior, not paid-output rendering.

## NOT DONE

- Production AI provider adapter and credentials are still not claimed live.
- `/api/generate` durable queue creation remains a separate integration task where the baseline still returns `generation_queue_not_wired`.
- `/api/generate/[jobId]` durable status persistence remains a separate integration task.
- Worker `ai_plan` persistence/enqueue-preview path remains a separate integration task.
- Photo Palette WCAG contrast hardening remains the next sequential product-hardening step.
- Full workspace semantic `pnpm typecheck` / `pnpm build` still requires an environment that can install dependencies.

## Product rule

Provider availability may change the *source* of the three directions, but it must not turn CardeLume into a dead-end technical workflow.
