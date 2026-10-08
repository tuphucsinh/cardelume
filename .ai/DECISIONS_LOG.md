# Architecture / Product Decisions Log

This is the concise decision index. Detailed rationale lives in `docs/`.

| Decision | Status | Rationale |
|---|---|---|
| Anonymous creation/purchase first-class | Locked | Lower consumer friction; no account required for core value |
| One-time payment, no subscription/credits at launch | Locked | Product is a single emotional artifact, not SaaS |
| 3 AI-curated directions only | Locked | Preserve simplicity and creative authority; avoid marketplace behavior |
| No Canva-style editor | Locked | CardeLume does the design; customer only finishes |
| Hard constraints veto; soft scores inform; AI decides | Locked | Compatibility must be deterministic while premium creativity remains AI-led |
| Exact template/version pinning through checkout/render/recovery | Locked | Historical determinism and commercial integrity |
| Production template surfaces approved-only | Locked | Human/IP/Golden evidence must precede customer exposure |
| Raw `creativeThesis` internal; bounded `customerRationale` only | Locked | Make intelligence visible without exposing internal reasoning |
| Finish wording refinement reversible | Locked Step17I | Emotional text must not be destructively overwritten |
| Photo optional; trusted quarantine/sanitize pipeline | Locked | Premium personalization without forcing photo or trusting raw upload |
| Dodo Payments as MoR/payment provider | Current | Reduce tax/payment operating burden; server-authoritative webhook boundary |
| Supabase/Postgres as durable DB | Current | Shared state for Pi5/VPS stateless compute + RLS |
| Cloudflare R2 as object storage | Current | Private durable asset storage independent of compute nodes |
| pg-boss durable queue | Current | PostgreSQL-backed durable jobs, shared by Pi5/VPS |
| Pi5 + Oracle/VPS stateless compute | Locked architecture | Either node can die without losing business-critical state |
| Cloudflare tunnel/routing at edge | Current | No inbound home port exposure; HA path independent of WireGuard |
| Governance FAST/RELEASE/HEAVY | Locked | Keep safety without audit ceremony sprawl |
| Unknown asset/license provenance = no publish | Hard gate | Commercial/IP protection |
| Production/destructive changes explicit owner approval | Hard gate | Human authority over high-impact operations |
| Optional account deferred to evidence | Locked | Avoid premature loyalty/platform scope |

| 2026-08-28 | 16-family best-of-both portfolio, 0.4.1 priority | Locked Step17J | Preserve product richness while keeping Step17I governance/AI |
| 2026-08-28 | Material Magic progressive enhancement; no customer FX controls | Locked Step17J | Restore WOW without increasing customer effort |
| 2026-08-28 | Gallery is marketing showroom; Studio stays 3 directions | Locked Step17J | Preserve collection richness without Canva mental model |
| 2026-08-28 | Cormorant Garamond + Plus Jakarta Sans flagship English | Locked Step17J | Maximize EN premium quality; locale font parity is not required |
| 2026-10-08 | Release line for CL2 = `origin/main` (`e476ad7`); local `main` frozen | Locked CL2 | Deployed code is the release base; canonical dirty tree is anh-owned (OWNER-01) |
| 2026-10-08 | Copy contract is set-level and locale-aware; repair is minimal and same-language | Locked CL2 | Per-card literal anchors + full-copy rewrite caused deterministic `creative_range` safe-failure |
| 2026-10-08 | Quality thresholds `.62` copy / `.68` thesis stay unchanged | Locked CL2 | Fix the inputs (thesis overwrite, user-input similarity), never weaken the gate |
| 2026-10-08 | Deterministic fallback copy is customer-grade, localized, with `generationSource` provenance | Locked CL2 | Recovery must be honest and premium, not robotic English for a non-English customer |
| 2026-10-08 | `@cardelume/ai` package test must exercise the generation quality pipeline | Locked CL2 | A no-op package test let the P0 regression ship past root gates |
