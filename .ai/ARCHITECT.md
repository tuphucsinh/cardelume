# CardeLume Architecture — Operational Summary

Canonical detailed architecture: `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`.

## Product layers

```text
Browser / Next.js Web
  │
  ├─ brief + Studio + results + finish + checkout/recovery UX
  │
  ▼
Server authority
  ├─ template eligibility/ranking/version validation
  ├─ AI Creative Director orchestration
  ├─ payment quote/order/session/webhook reconciliation
  ├─ recovery/entitlement authorization
  ├─ analytics capability verification
  └─ admin/launch approval boundaries
  │
  ├──────── PostgreSQL / Supabase
  │          ├─ app state
  │          ├─ RLS
  │          ├─ orders/payment state
  │          ├─ template versions/approvals
  │          ├─ pg-boss queue
  │          └─ worker heartbeat
  │
  ├──────── Cloudflare R2
  │          ├─ quarantine/private uploads
  │          ├─ clean private assets
  │          └─ paid JPG/PDF outputs
  │
  ├──────── Premium AI provider
  │          └─ bounded Creative Director / critic
  │
  └──────── Dodo Payments
             └─ checkout + signed raw-body webhook
```

## Production topology target

```text
Internet
  ↓
Cloudflare DNS/CDN/WAF/TLS/Tunnel
  ├──────── Pi5 (ARM64) ── web + worker
  └──────── Oracle/VPS (AMD64) ── web + worker fallback
                  │
                  └── shared durable services: Postgres/R2/Dodo/AI
```

Compute nodes are stateless with respect to business-critical state.

## Trust boundaries

### Browser cannot author

- payment state;
- final entitlement;
- arbitrary template/renderer identity;
- production launch approval;
- server price/currency;
- raw recovery authorization.

### AI cannot bypass

- format/script/photo compatibility;
- trusted template/renderer inventory;
- production approval boundary;
- payment/entitlement;
- IP/security hard gates.

### Admin

Production admin is expected behind identity-aware edge access plus application defense-in-depth. Approval evidence is immutable and separate from technical publish state.

## Renderer

- deterministic CardDocument/template version;
- JPG/PDF final output;
- exact historical template/version is retained through purchase/recovery;
- real capacity/font/browser↔render parity remains Step18 evidence.

## Availability

- `/health/live`: process liveness only;
- `/health/worker`: DB-backed worker state;
- `/health/ready`: fail-closed production readiness including config/DB/healthy same-version worker and required gates.

## Migration head

```text
0011_funnel_and_launch_approvals.sql
```
