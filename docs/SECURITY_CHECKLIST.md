# Production Security Checklist

- [ ] Cloudflare proxy/Tunnel in front of public app.
- [ ] No public port 3000.
- [ ] `.env` absent from Git and artifacts.
- [ ] Supabase RLS enabled and cross-user tested.
- [ ] `service_role` server-only.
- [ ] pg-boss uses session-capable/direct DB connection.
- [ ] Dodo raw-body signature verification implemented.
- [ ] Dodo provider event ID unique/idempotent.
- [ ] Checkout redirect never unlocks final asset.
- [ ] R2 final assets private.
- [ ] Short-lived signed URLs only after entitlement check.
- [ ] Upload size + magic bytes + megapixel limits.
- [ ] Decode/re-encode and EXIF/GPS strip.
- [ ] Quarantine object never rendered directly.
- [ ] No raw HTML/SVG/CSS/JS from user or AI.
- [ ] SVG text XML-escaped.
- [ ] Asset IDs resolve through allowlist.
- [ ] CSP Report-Only violations reviewed before enforcement.
- [ ] Security headers verified.
- [ ] Cloudflare WAF/rate limit/Turnstile path tested.
- [ ] Admin protected by MFA/Access.
- [ ] Containers run non-root where practical.
- [ ] No privileged containers.
- [ ] Images/dependencies scanned.
- [ ] Backup restore test completed.
- [ ] Tunnel/watchdog/failover drill completed.

---

## Step 12 — Managed Template Library security additions

### Renderer trust
- [ ] Managed templates reference only server-approved renderer keys.
- [ ] Admin cannot upload arbitrary executable HTML/CSS/JS/SVG as a renderer template.
- [ ] Published render behavior is immutable; visual/render changes create a new template version.
- [ ] Checkout pins the exact template ID + version pair.

### Admin surface
- [ ] `/admin/templates` is protected by deployment admin authentication.
- [ ] Non-GET admin mutations require the CardeLume admin action header.
- [ ] Production credentials are unique, rotated and never committed.
- [ ] Admin pages are excluded from public indexing/caching where applicable.

### Analytics integrity/privacy
- [ ] `TEMPLATE_EVENT_SECRET` exists in live mode and is at least 32 characters.
- [ ] Template event capabilities expire and bind template/version/source/rank/market/locale.
- [ ] Invalid/tampered/expired event capabilities are rejected.
- [ ] Template event rows contain no recipient name, message/headline/body, image bytes or recovery tokens.
- [ ] Raw event retention and daily rollup jobs are running.
- [ ] Template-event endpoint rate limit is enabled.

### Catalog operational safety
- [ ] `/health/ready` validates template coverage after migration/seed.
- [ ] Archiving templates cannot silently leave a healthy node without required format/script/archetype coverage.
- [ ] Photo-required templates never enter no-photo generation candidates.
- [ ] Unsupported script/format combinations are filtered before ranking/AI.
