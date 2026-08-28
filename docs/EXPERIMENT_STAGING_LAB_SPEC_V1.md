# Experiment & Staging Lab Specification v1

## 1. Objective

Provide a safe place for Lumer/Hermes and the owner to try new templates, prompts, models, ranking changes, UI ideas, prices and backend behavior **without treating production customers as the test environment**.

## 2. Lanes

```text
DEV → EXPERIMENT → STAGING → PRODUCTION
```

### DEV
Local/unit/source work. No external production dependency required.

### EXPERIMENT
Fast isolated trials. Feature is not production-ready and may use temporary fixtures.

### STAGING
Production-like integration with explicit non-production services/credentials and full release gates.

### PRODUCTION
Customer traffic and real money. Owner approval required for promotion.

## 3. Environment identity

Every process must know its explicit environment:

```text
APP_ENV=development|experiment|staging|production
```

No implicit "if URL looks local" environment decisions.

## 4. Data/service isolation

Experiment/staging requirements:

- separate Supabase/Postgres project/database/schema or independently scoped credentials/tables;
- separate R2 bucket or unambiguous non-production prefix + credentials;
- Dodo test/sandbox mode;
- AI provider key/project or explicit budget attribution where possible;
- isolated metrics/events;
- separate Cloudflare hostname/access policy;
- no production recovery/download secret reuse.

If a shared service must be used, its resource namespace and credentials must make accidental production writes impossible or easily detectable.

## 5. Experiment registry

Every experiment has:

```text
id
owner = Lumer / human
hypothesis
scope
branch/worktree
feature flag
start/end
allowed environments
AI budget
success metric
premium benchmark impact
security/IP review requirements
rollback/kill switch
status
```

## 6. Feature flags

New customer-facing behavior defaults OFF. Flags must support:

- staging-only;
- internal/allowlist;
- percentage rollout where appropriate;
- instant kill;
- explicit expiration/owner.

Do not accumulate permanent dead flags.

## 7. Branch/worktree policy

Lumer may autonomously create experiment branches/worktrees and run tests. Promotion to the main production branch follows release policy and approval.

Recommended naming:

```text
exp/<experiment-id>-<short-name>
```

## 8. Test data policy

Use synthetic/anonymized fixtures. Never copy production customer photos/card copy into a convenience staging dataset.

## 9. AI budget controls

Experiment runs must have:

- max calls/run;
- max benchmark runs;
- daily cost/token cap where provider support permits;
- no unbounded agent/reflection loops;
- cost attribution to experiment ID.

## 10. Promotion gates

Before STAGING → PRODUCTION:

1. objective test/build gates pass;
2. premium benchmark shows no unacceptable regression for creative changes;
3. IP/provenance gate passes for creative/assets;
4. security gate passes for affected surfaces;
5. migration and rollback plan exists;
6. staging E2E passes;
7. production config diff is reviewed;
8. owner explicitly approves production promotion.

## 11. Rollback

Every promoted experiment must identify:

- kill switch/flag;
- application rollback target;
- migration compatibility;
- data rollback/non-destructive strategy;
- monitoring trigger for rollback.

Prefer forward-compatible additive DB changes so application rollback does not require destructive schema rollback.

## 12. Experiments suitable for this lane

- new template family/variant;
- Creative Director prompt revision;
- model/provider comparison;
- ranking/wildcard weights;
- critic threshold;
- optional login/account;
- pricing/packaging;
- Studio UI change;
- Control Center feature;
- new AI artwork mechanism.

Production customer data is never the default experimental corpus.
