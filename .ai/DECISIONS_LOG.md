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
