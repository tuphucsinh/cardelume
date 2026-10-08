# Known Bugs / Open Gates — Step17J Hermes Package

This file mixes confirmed open defects and deliberately unproven runtime gates. Do not call a runtime gate a source bug unless evidence supports it.

## CL2 open defects (2026-10-08, verified)

- **P0 — generation fails for realistic briefs.** `ai_generation_safe_failure` on 4/4 realistic briefs. Copy contract (per-card literal anchors) → `repairSemanticCopyContract` overwrites `creativeThesis` → `creative_range`; deterministic recovery copy shares a suffix → `creative_range`. Fix: `CL2-GEN-01`, `CL2-GEN-02`.
- **P0 — 8/10 locales unsupported.** Contract anchors exist only for en/vi; natural es/ja/fr copy always violates. Fix: `CL2-GEN-01`, `CL2-GEN-02`.
- **P1 — recovery copy is robotic/mixed-language** and shown with no notice. Fix: `CL2-GEN-02`, `CL2-UX-01`.
- **P1 — internal `creativeThesis` and model scores returned to the browser.** Fix: `CL2-API-01`.
- **P1 — `/api/templates/events` returns 403 on every result.** Fix: `CL2-API-01`.
- **P1 — UI:** proof cards overlap their labels; ornament intersects headline; words break mid-word; EN page shows Italian tagline; internal `Ref`/`ID` line; VI error copy says "anh"/"Brief"; style names show `Direction 0N`. Fix: `CL2-UX-01`, `CL2-UI-01/02/03`.
- **P1 — VI tablet `/create` CLS ≈ 0.35–0.37** (>= 0.1 target). Fix: `CL2-PERF-01`.
- **P1 — provider is the unpinned alias `gemini-flash-lite-latest`.** Fix: `CL2-OPS-01`.
- **Gate — `@cardelume/ai` package test was a no-op;** the P0 shipped past root gates. Fix: `CL2-GEN-01`.

## Historical — P0 / launch blockers

### Runtime/build
- `pnpm-lock.yaml` absent by design; Step18 must create/review a new candidate lock.
- full frozen dependency install/typecheck/build/test not yet evidenced.
- release SBOM/vulnerability result not yet final.

### Product/template
- 0 production-approved templates by design.
- human Premium/WOW/originality evidence pending.
- real AI Golden benchmark pending.
- actual 3-direction diversity is unproven until real-model/human runs.

### IP/legal/localization
- exact shipped font binary/version/hash/license evidence incomplete.
- brand asset provenance/owner attestation must be closed before release.
- final legal/native-language approval pending.

### Runtime services
- staging migrations 0001→0011/RLS not executed here.
- real pg-boss/R2/photo/final render not executed here.
- real Dodo checkout/webhook/PAID/recovery E2E not executed here.
- browser/mobile/accessibility/performance/CSP enforcement not executed here.

### Infrastructure
- Pi5/Oracle multi-arch runtime/failover not executed here.
- production backup/restore rehearsal not executed here.

## P1 UX items to verify in Step18

- real reveal pacing against premium-model P50/P95 latency;
- focus transfer and screen-reader behavior across phase changes;
- iPhone Safari and mid-range Android behavior;
- color/contrast on all approved templates;
- customer-safe rationale quality across locales;
- wording Refine/Undo race and manual-edit preservation;
- print-layout wording comprehension for international users;
- post-payment keepsake/recovery clarity.

## Not bugs / do not re-open without new evidence

- Studio **does** use progressive disclosure; do not convert it into a multi-screen wizard by default.
- physical-effects control component is not intended as a primary customer control.
- web UI uses Plus Jakarta Sans in Step17J; old DM Sans/VI review notes are historical/stale for UI source.
- Dodo source architecture already contains signature verification, idempotency/reconciliation; the open item is real E2E evidence.
- production admin routes have source-level proxy/edge/basic-auth/mutation protections; open item is runtime Cloudflare Access validation.


## Step17J-specific open evidence

- 16-family showroom target is not launch approval. HOLD/experiment statuses remain until immutable approval gates pass.
- Material Magic requires real-device FPS/INP/reduced-motion verification in Step18.
- Gallery visual quality must be browser-reviewed with the real font binaries.
- Material-world diversity is a source prior; real 3-direction diversity still requires Golden + human review.
