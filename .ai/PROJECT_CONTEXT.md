# CardeLume Project Context

This file contains CardeLume-specific product and engineering context. The
shared workflow authority remains the root `AGENTS.md` template.

## Current identity

- **Release:** `0.4.3-step.17i`
- **Baseline:** `STEP17I_PREMIUM_EXPERIENCE_CONVERGENCE`
- **Production:** `NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES`
- **Current phase:** Phase 21R Product Correctness Recovery is the current
  active phase; source/offline validation is not production validation.

## Product invariant

```text
small brief
→ intelligent generation
→ 3 genuinely different premium directions
→ choose
→ minimal finishing
→ preview
→ one-time payment
→ secure JPG/PDF
```

CardeLume is a premium international AI greeting-card product. It must feel
premium, warm, and emotionally intelligent, not like generic AI SaaS or Canva.

Creative authority:

- hard compatibility constraints veto; soft evidence informs; Premium AI makes
  the final creative decision;
- deterministic rankers may filter/rank but must not replace creative judgment;
- customer sees bounded `customerRationale`, never raw `creativeThesis` or
  internal chain-of-thought;
- the three directions must be meaningfully different;
- templates are Design DNA, not a customer-facing marketplace;
- customer must not browse a large template catalog.

## Context loading order

At project start, read:

1. `AGENTS.md`
2. `HANDOFF.md`
3. `.ai/MASTER_PLAN.md` (canonical)
4. `MASTERPLAN.MD` (byte-identical mirror)
5. `tasks.md`
6. `.ai/ARCHITECT.md`
7. `.ai/UI_UX.md`
8. `.ai/KNOWN_BUGS.md`
9. this file when CardeLume-specific context is needed

If `.tmp/SYSTEM_ALERT.md` exists, read and surface it before unrelated work.

## Source authority order

When sources conflict:

1. current explicit owner instruction;
2. root `AGENTS.md` template and this project context;
3. canonical `.ai/MASTER_PLAN.md`, with `MASTERPLAN.MD` accepted only when byte-identical;
4. `tasks.md` for executable remaining work;
5. current source, migrations, and tests;
6. canonical `docs/` and `.ai/` specifications;
7. historical reports and handoffs.

Never silently reconcile a material conflict. Record the conflict in
`HANDOFF.md` or `.ai/KNOWN_BUGS.md` and state which authority wins.

## Architecture and trust boundaries

```text
Browser / Next.js Web
  ↓
Server authority
  ├─ template eligibility/ranking/version validation
  ├─ AI Creative Director orchestration
  ├─ payment quote/order/session/webhook reconciliation
  ├─ recovery/entitlement authorization
  ├─ analytics capability verification
  └─ admin/launch approval boundaries
  ↓
PostgreSQL / Supabase + RLS + pg-boss
Cloudflare R2 private upload/clean/final objects
Premium AI provider
Dodo Payments with signed raw-body webhook
```

The browser cannot author payment state, final entitlement, arbitrary
template/renderer identity, production launch approval, server price/currency,
or raw recovery authorization. Compute nodes are stateless with respect to
business-critical state.

Health semantics:

- `/health/live`: process liveness only;
- `/health/worker`: DB-backed worker state;
- `/health/ready`: fail-closed readiness including config, DB, healthy
  same-version worker, and required gates.

Migration head: `0011_funnel_and_launch_approvals.sql`.

## UI/UX invariants

- Deep navy, warm ivory, restrained champagne/gold.
- Editorial serif display plus clean international UI sans typography.
- Tactile paper/material cues and restrained cinematic reveal.
- No neon, particle spam, generic AI gradients, constant sheen, random
  luxury black/gold, or over-decoration.
- Homepage uses one strong material/folio card object and approved production
  examples only. With no approved templates, fail closed.
- Studio stays quick and progressive: occasion, relationship/context, feeling;
  recipient/detail, photo, and print layout are optional.
- Results show exactly three directions, no template names/catalog browsing,
  and a bounded customer-safe rationale. “Show me 3 new directions” remains
  the escape hatch.
- Finish is bounded and reversible: message edit, Shorter/Refine wording,
  one-step Undo after automated wording, and a small art-directed color set.
  No font/layer/position editor.
- Post-payment clearly communicates JPG ownership, print-ready PDF ownership,
  and recovery.
- Reduced motion, focus transfer, mobile sticky actions, 44px touch targets,
  16px mobile inputs, and real-device behavior require Phase 18 evidence.

## Security, payment, upload, and IP gates

- Server/DB is authoritative for `PAID` and entitlement.
- Webhook signature verification, reconciliation, and idempotency remain
  fail-closed.
- Client state must never unlock clean high-resolution assets.
- Uploads remain quarantined, sanitized, private, and ownership-scoped.
- Production admin remains identity-aware plus application defense-in-depth.
- Secrets stay outside Git. Never print or include `.env`, credentials, keys,
  tokens, customer uploads, production dumps, or raw greeting/photo data.
- Unknown font, image, illustration, ornament, texture, brand asset, template
  source, or reusable external asset license/provenance means **DO NOT
  PUBLISH**.
- Market research is intelligence, never permission to copy a competitor layout.
- Never weaken RLS, CSP, recovery, payment, admin, or IP gates to make a test
  pass.
- There are currently **0 production-approved templates by design**. No
  automatic or AI-only template approval is allowed.

## Environment and runtime gates

Maintain:

```text
DEV → EXPERIMENT → STAGING → PRODUCTION
```

Production-impacting, destructive, payment, credential, permission, migration,
deploy, and restore actions require explicit owner approval and a
rollback/recovery path.

Phase 0 covers Pi5 import, package identity, clean baseline, Hermes project
attachment, and staging-only environment setup.

Phase 18 must produce real evidence for:

- frozen dependencies and reproducible install;
- semantic typecheck, production build, and workspace tests;
- staging DB, migrations `0001→0011`, RLS, and IDOR boundaries;
- pg-boss queue/worker behavior and concurrency limits;
- R2/photo quarantine, sanitization, ownership, and retention;
- Dodo checkout, signed webhook, PAID, idempotency, and recovery;
- real AI Golden benchmark and human scoring;
- human/owner template approval;
- fonts, provenance, localization, and browser/renderer parity;
- browser, mobile, accessibility, performance, CSP, logs, and restore.

Step18 is PASS only when every material runtime category has explicit evidence.
Otherwise retain the exact partial or blocked state.

## CardeLume verification commands

Run from the repository root:

| Purpose | Command |
|---|---|
| Fast source gate | `npm run check:fast` |
| Release source gate | `npm run check:release` |
| Consolidated status | `npm run check:status` |
| Heavy/local runtime gate | `npm run check:heavy` |
| Typecheck | `pnpm typecheck` |
| Build | `pnpm build` |
| Tests | `pnpm test` |
| Lint | `pnpm lint` |
| Browser verification | `BASE_URL=http://127.0.0.1:3000 bash tests/browser-verify.sh` |
| Secret scan | `npm run security:secret-scan` |
| Dependency scan | `npm run security:dependency-scan` |
| Release SBOM | `npm run security:sbom-release` |
| IP audit | `npm run ip:audit` |

`check:fast` and `check:release` are source/offline gates. `check:status` may
remain `NO_GO` while runtime or owner evidence is missing. Follow
`.ai/MASTER_PLAN.md` as the canonical plan and `MASTERPLAN.MD` as its
byte-identical mirror, together with `docs/STEP18_CONTROLLED_RUNTIME_RUNBOOK.md`
for the exact runtime evidence sequence.

## Completion and documentation

A CardeLume task is complete only when implementation, acceptance, relevant
tests/build/browser evidence, and documentation updates are complete. Update
`tasks.md` after independent verification; update `HANDOFF.md` when project
state materially changes; record new unresolved issues in
`.ai/KNOWN_BUGS.md`.

Use `.ai/MASTER_PLAN.md` as the canonical phase detail, `MASTERPLAN.MD` only as
its byte-identical mirror, and `tasks.md` as the active WBS. Do not create a
parallel master plan, duplicate WBS, empty design files, or an unapproved
catalog/template authority.
