# CardeLume 0.4.3 Step 17F — Product / UX Integration Hardening

## Objective

Close the gap between CardeLume's premium creative architecture and the actual customer/operator experience without adding product complexity.

## Customer journey changes

- Web preview now covers all 28 governed `VisualDirection` values.
- Customer-facing homepage/Studio surfaces exclude launch-held templates.
- The post-generation escape hatch is **Show me 3 new directions**, not a template marketplace.
- Prior directions are supplied to regeneration only as soft novelty evidence; Step 13 AI authority is unchanged.
- `Warmer` / `Playful` use one bounded server-side AI rewrite; `Shorter` stays deterministic.
- Custom occasion and `Someone else` relationship add personalization without expanding the chip taxonomy.
- Physical card effects remain subtle/automatic; no primary customer control is exposed.
- Hosted share-link UI is removed until a real secure backend exists.
- Hero motion uses restrained paper/depth/light-line arrival with reduced-motion fallback.

## Management / analytics

- Migration `0011_funnel_and_launch_approvals.sql` adds privacy-minimized funnel events and version-bound launch approval evidence.
- Funnel subjects use HMAC-SHA256 with `ANALYTICS_PSEUDONYM_KEY`; raw anonymous IDs, card copy, recipient names, photo bytes and IP addresses are not stored in the funnel table.
- Payment and final-render milestones are authoritative server events.
- Admin shows a compact 30-day operating pulse; this is intentionally not an enterprise dashboard.
- Technical template activation and launch approval are separate actions.
- `approved` requires benchmark + IP + human-review evidence, active/healthy/passed runtime state, and creates an append-only approval record.
- New current template versions demote prior launch approval to `candidate`.

## Legal / security source hardening

- Privacy, Terms and Refund pages are substantive drafts rather than placeholders.
- Production requires legal identity fields plus `LEGAL_CONTENT_APPROVED=true`; legal/native review remains owner evidence, not an AI assertion.
- All `/admin/*` and `/api/admin/*` routes require the admin boundary. Production additionally requires Cloudflare Access evidence plus Basic Auth and mutation guard.
- Trusted Cloudflare actor identity is copied into an internal header and recorded in launch evidence.
- CSP is nonce-ready with `strict-dynamic` and no `script-src 'unsafe-inline'`. `style-src 'unsafe-inline'` remains a known partial control pending browser/style refactor evidence.
- Production requires `CSP_ENFORCE=true` only after browser/staging validation.
- Next.js is source-pinned to 16.3.3, the current Active-LTS security-patch line selected for Step 17F. The final resolved graph still requires a reviewed lockfile.

## Invariants preserved

> Hard constraints veto. Soft scores inform. Premium AI makes the final creative decision.

- 6 strong-fit + 2 premium wildcard candidate contract remains.
- One bounded expansion remains.
- Conditional critic/reconsideration remains.
- Immutable template/version checkout pinning remains.
- Production launch remains owner/runtime approval-gated.
