# CardeLume 0.4.3 Step 3 — Magic Typography Soft Overflow Guard

## Why this step exists

Step 2 made the final renderer fail closed when copy can no longer fit a premium composition. Step 3 moves that protection earlier into Finish so the customer receives a graceful, art-directed correction instead of tiny type or a late render failure.

## DONE

### Shared CardeLume copy-density model

The pure copy-density rules now live with `CardDocument` in `@cardelume/card-schema` and are used by both browser and renderer.

This is intentionally **CardeLume-specific**, not a generic platform typography engine.

Shared rules include:

- locale/script-aware visual length
- format-aware pressure
- airy / balanced / compact density
- soft shortening threshold
- hard overflow threshold
- deterministic shortening helper
- browser body floor: **10.4px**
- renderer body floor: **32px** on the 1500px reference canvas

### Finish UX

When copy becomes visually dense:

- CardeLume does not show a red validation error.
- It shows localized premium microcopy explaining that the composition is getting full.
- A `Shorten for me ✦` action deterministically reduces the message.
- The existing curated rewriting controls remain available.
- If copy exceeds the hard safe boundary, Checkout is disabled until the message is shortened.

The 420-character input ceiling remains as an abuse/technical upper bound, but the actual UX decision is based on visual density rather than character count alone.

### Renderer

- Final renderer never shrinks body copy below the renderer floor.
- Browser-supplied typography fit cannot force body text below the renderer floor.
- Text wrapping no longer silently truncates lines with `slice(0,12)`.
- If full copy still cannot fit above the floor/safe margins, renderer throws `typography_copy_too_dense` instead of producing illegible or truncated paid output.
- Renderer version is bumped to `0.4.3-step.3` because typography output behavior changed.

## Security / product guardrails

- No user text is rewritten server-side without an explicit user action in Finish.
- The deterministic shortening helper operates only on text supplied to it; it does not call external AI.
- No advanced editor controls were added.
- CardeLume remains finishing-only, not Canva.

## NOT DONE

- Generation/provider failure fallback is still a separate production reliability step.
- Photo Palette WCAG contrast hardening remains separate.
- Full workspace semantic build still requires controlled dependency installation on Hermes/Pi.
