# CardeLume 0.4.3 Step 12 — Template Migration, Rollout & Rollback Plan

---

# 1. Scope

Step 12 introduces managed template identity while preserving all prior production-hardening guarantees.

New migration:

```text
0008_managed_templates.sql
```

It creates the managed catalog, stable bootstrap rows, targeting, analytics, daily metrics and exact template-version linkage on card versions.

---

# 2. Preconditions

Before production migration:

- Step 11+ dependencies frozen/reviewed;
- full workspace build/typecheck/tests pass on controlled runtime;
- database backup created and checksum recorded;
- migration 0001–0007 state confirmed;
- live secrets include template admin/event secrets;
- Pi5/worker release versions aligned;
- legal/other launch gates remain independently satisfied.

---

# 3. Migration procedure

1. enter controlled maintenance/deployment window;
2. create DB backup using Step 9 helper;
3. record current application version and migration state;
4. apply `0008_managed_templates.sql`;
5. verify table/constraint/index existence;
6. verify stable seed counts;
7. verify every seeded template current version points to its own v1;
8. verify RLS is enabled on template tables;
9. start Step 12 worker/web with matching `APP_VERSION`;
10. wait for `/health/ready` including template catalog coverage;
11. run smoke generation and discovery before broad traffic.

---

# 4. Seed verification

Expected bootstrap:

```text
16 template families
16 managed templates
16 immutable v1 versions
```

Targeting rows should include GLOBAL baseline affinities plus curated market/occasion/feeling rows.

Seed SQL uses stable UUIDs and conflict-safe insert semantics so it can bridge hard-coded trusted renderers into the managed system without rewriting operator modifications on rerun.

---

# 5. Catalog smoke matrix

Run at least:

| Market | Locale | Photo | Expected technical coverage |
|---|---|---:|---|
| US | en | no | Latin + all launch formats |
| VN | vi | no | Latin + market/global mix |
| VN | vi | yes | photo archetype available |
| JP | ja | no | CJK + local/global curated |
| KR | ko | no | Hangul + local/global curated |
| FR/DE | fr/de | no | Latin European inventory |

For each:

- 3 AI direction assignment works;
- Explore surfaces no duplicates;
- max 4 + 4 + 8;
- correct market/curated label;
- event tokens accepted only for same anonymous session.

---

# 6. Commerce smoke

## Exact version race

1. generate/preview v1;
2. create/activate v2 in admin;
3. checkout card that still carries v1;
4. verify order/card version stores v1;
5. verified PAID final renders v1.

## Archive history

1. make paid test order using template v1;
2. archive template;
3. confirm new discovery excludes it;
4. confirm historical entitlement/recovery remains valid.

---

# 7. Analytics smoke

Verify:

- impression token accepted once for exact slot;
- repeated identical impression is deduped;
- selection with same surface token is a separate event type and accepted once;
- cross-anonymous-session replay rejected;
- changed rank/source/market/locale rejected;
- expired/tampered token rejected;
- AI assignment recorded server-side;
- checkout start recorded server-side;
- paid recorded only after verified PAID;
- daily rollup aggregates correctly;
- raw retention cleanup leaves daily aggregate.

---

# 8. Admin smoke

Verify over real HTTPS:

- unauthenticated request challenged;
- bad Basic Auth rejected;
- GET with valid auth works;
- mutation without admin action header rejected;
- Draft creation works;
- invalid renderer key rejected;
- renderer capability expansion rejected;
- family variant duplication works;
- affinity edit works;
- v2 creation works;
- Active requires healthy/passed current version;
- Delete action archives;
- historical reference survives archive.

---

# 9. Rollback strategy

Step 12 is designed for **forward recovery**, not destructive schema rollback.

If application defects appear:

1. withdraw unhealthy node using readiness/watchdog;
2. stop Step 12 traffic;
3. preserve DB migration/data;
4. fix/roll forward compatible application code;
5. do not delete `template_versions` or managed identity referenced by cards/orders.

Only restore a DB backup in a genuine database-corruption incident following the isolated restore procedure—not as a normal application rollback shortcut.

---

# 10. Go/no-go gates

## GO requires

- full semantic build/tests pass;
- migration rehearsal pass;
- `/health/ready` green with catalog coverage;
- generation/discovery smoke pass;
- exact-version race pass;
- admin auth/mutation pass;
- template analytics tamper/replay pass;
- Dodo paid final/recovery E2E pass;
- native visual QA for launch markets;
- backup exists and restore rehearsal has been completed according to production plan.

## NO-GO examples

- catalog DB unavailable;
- missing template coverage for launch format/script;
- AI can return arbitrary template ID;
- checkout substitutes current version;
- archive breaks historical recovery;
- admin route exposed without auth;
- event token reusable across anonymous users;
- workspace build/typecheck fails;
- legal/production readiness gate remains red.
