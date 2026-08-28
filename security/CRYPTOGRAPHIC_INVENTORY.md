# Cryptographic Inventory — Step 17B

This inventory records purposes and locations only. **Never put secret values in this file.** Rotation and storage are operational responsibilities and require runtime evidence.

| Purpose | Primitive / source | Secret or key identifier | Code location | Current evidence |
|---|---|---|---|---|
| Generation status capability | HMAC-SHA256 + timing-safe compare | `GENERATION_STATUS_SECRET` | `apps/web/lib/generation-token.server.ts` | source present; live rotation/storage not validated |
| Signed server pricing quote | HMAC-SHA256 + timing-safe compare | `PRICING_QUOTE_SECRET` | `apps/web/lib/pricing-quote.server.ts` | source present; live rotation/storage not validated |
| Dodo webhook verification | HMAC-SHA256 + timing-safe compare + timestamp tolerance | `DODO_PAYMENTS_WEBHOOK_KEY` | `apps/web/lib/dodo-webhook.ts` | source present; real webhook E2E required |
| Recovery token material | CSPRNG `randomBytes`, SHA-256 token hashing | generated recovery secret | `apps/web/lib/recovery-secrets.server.ts` | source present; runtime entitlement E2E required |
| Checkout return claim | HMAC-SHA256 + timing-safe compare | `CHECKOUT_RETURN_SECRET` | `apps/web/lib/recovery-secrets.server.ts` | source present; replay/return E2E required |
| Upload completion capability | CSPRNG `randomBytes(32)` | generated completion token | `apps/web/lib/photo-upload.server.ts` | source present |
| Template analytics capability | HMAC-SHA256 + CSPRNG nonce | `TEMPLATE_EVENT_SECRET` | `apps/web/lib/template-event-token.server.ts` | source/runtime-isolated regression present |
| Request/object integrity fingerprints | SHA-256 | no secret | generation/upload/worker code | integrity/dedupe only, not authentication |
| TLS to public/external services | TLS 1.2/1.3 expected at Cloudflare/providers | provider-managed | deployment/provider configuration | NOT EXECUTED in this sandbox |

## Runtime secret inventory

High-sensitivity values include `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `QUEUE_DATABASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `AI_API_KEY`, `TUNNEL_TOKEN`, `PRICING_QUOTE_SECRET`, `GENERATION_STATUS_SECRET`, `CHECKOUT_RETURN_SECRET`, `TEMPLATE_ADMIN_PASSWORD`, and `TEMPLATE_EVENT_SECRET`.

Rules:

- profile-local/runtime secret storage only; never SOUL.md, skills, repository or deliberate chat/history;
- unique values per environment;
- least privilege and scoped provider credentials;
- rotate immediately after suspected exposure and according to provider/owner policy;
- record rotation evidence without recording the value itself;
- production release requires proof that staging and production credentials/scopes cannot be confused.
