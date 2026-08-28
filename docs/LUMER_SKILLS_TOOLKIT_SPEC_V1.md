# Lumer Skills & Tools Toolkit Specification v1

## 1. Design principle

Lumer should not carry a giant permanent project prompt. Use **small, discoverable, on-demand skills** with scripts/references/templates. This reduces token usage and lets each workflow have independent verification and security boundaries.

CardeLume-specific skills should live in:

```text
.hermes/skills/<category>/<skill>/SKILL.md
```

Suggested repository skeleton:

```text
.hermes/skills/
├── creative/
│   ├── cardelume-template-author/
│   ├── cardelume-premium-review/
│   ├── cardelume-template-portfolio/
│   ├── cardelume-market-adaptation/
│   └── cardelume-publish-qa/
├── operations/
│   ├── lume-project-health/
│   ├── lume-release-audit/
│   ├── lume-experiment-manager/
│   ├── lume-incident-response/
│   └── lume-backup-restore-audit/
├── research/
│   ├── lume-market-intelligence/
│   ├── lume-competitive-pricing/
│   └── lume-visual-reference-scout/
├── assurance/
│   ├── lume-ip-copyright-audit/
│   ├── lume-security-audit/
│   └── lume-localization-qa/
└── analytics/
    ├── lume-ai-economics/
    └── lume-product-effectiveness/
```

## 2. Template authoring workflow

`cardelume-template-author` must produce **original CardeLume work**, not a recreation of a reference.

Required procedure:

```text
business/market need
→ research abstract principles
→ creative thesis
→ template family decision
→ design DNA + controlled variation space
→ renderer implementation in experiment lane
→ sample brief stress set
→ typography/CJK/photo/WCAG/output QA
→ IP/provenance audit
→ Premium Benchmark review
→ publish candidate
```

Required outputs:

- template name/family;
- original creative thesis;
- target feelings/occasions/markets as priors;
- photo mode;
- text/script/format capability;
- controlled variants;
- signature-move capability;
- source/provenance declaration;
- sample render matrix;
- premium review score/report;
- explicit "reference similarity" check.

Hard prohibitions:

- copying or tracing competitor layouts;
- importing unknown-license fonts/images/ornaments;
- using customer photos as template/reference assets;
- arbitrary CSS/SVG emitted by AI into trusted renderer production;
- publishing directly from the author skill.

## 3. Premium creative review skill

`cardelume-premium-review` evaluates:

- emotional relevance;
- originality/wow;
- premium restraint;
- visual-copy harmony;
- typography hierarchy;
- market naturalness without stereotype;
- mobile/print resilience;
- similarity to existing portfolio/recent outputs;
- signature move quality;
- whether the design feels "AI-generic".

It must be allowed to reject technically valid work.

## 4. Template portfolio manager

`cardelume-template-portfolio` analyzes:

- impressions/selection/paid normalized by exposure;
- family/visual concentration;
- critic/expand/fallback association;
- market-specific gaps;
- style freshness;
- underexposed new high-editorial templates;
- variants that should be archived or improved.

It must not optimize only for raw usage or paid conversion.

## 5. Project health skill

`lume-project-health` reads:

- web/worker readiness;
- build/version alignment;
- queue depth/staleness;
- DB/R2/provider health;
- Dodo webhook/fulfillment errors;
- backup freshness;
- AI P50/P95/calls/fallback/critic;
- template catalog coverage;
- current experiment flags.

Output: severity-ranked findings, evidence and next actions. No production mutation by default.

## 6. Release audit skill

`lume-release-audit` requires evidence for:

- frozen dependencies + SBOM;
- typecheck/build/tests;
- migrations and backups;
- security/IP gates;
- benchmark deltas;
- staging E2E;
- rollout/rollback plan;
- production config diff;
- version/checksum.

A failed mandatory gate produces **NO-GO**.

## 7. Experiment manager

`lume-experiment-manager` can:

- create experiment registry entry;
- create branch/worktree;
- generate feature flag;
- configure isolated test data/budget;
- run benchmark/tests;
- prepare promotion report;
- archive failed experiment.

It cannot directly turn an experiment into production behavior without release approval.

## 8. Market intelligence / competitive pricing

Research skills may collect:

- competitor positioning;
- public prices and packaging;
- customer journey;
- number of choices;
- public reviews/complaints;
- visible design/UX trends;
- market gaps;
- localization expectations.

They must record source/date/market and separate observation from interpretation.

Creative-reference output should be **abstract principles**, not downloadable competitor templates.

## 9. Visual reference scout

Allowed:

- finding publicly visible inspiration;
- recording URL/source/date;
- tagging design principles, composition trends, typography approach, color/mood patterns;
- recommending original exploration directions.

Not allowed:

- downloading/copying a competitor asset into production library without an independent valid license;
- telling template-author to recreate a named proprietary design exactly;
- treating Pinterest/Google Images availability as a license.

## 10. IP/copyright audit skill

Checks every new production creative dependency against `IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md` and its provenance manifest.

Verdicts:

- APPROVED;
- APPROVED_WITH_ATTRIBUTION;
- REJECTED;
- UNKNOWN → REJECTED.

## 11. Security audit skill

Runs risk-based ASVS 5.0 L2 checklist, Top 10:2025 mapping, dependency/SBOM review, secret scan, auth/RLS/webhook/upload/headers/logging/backup checks and staging security tests.

It must not perform destructive exploitation against production.

## 12. AI economics skill

Tracks quality and economics together:

- premium/wow benchmark score;
- first-generation selection;
- critic/expand/fallback;
- input/output tokens;
- calls/generation;
- provider/model;
- P50/P95 latency;
- estimated cost;
- paid conversion.

Recommendation rule: do not lower the creative model if the measurable quality loss violates the premium floor.

## 13. Tool recommendation policy

Prefer existing Hermes tools/skills when sufficient. Create a new **skill** when instructions + existing tools/scripts are enough. Create a custom **tool/service** only for capabilities requiring precise auth/integration/realtime/binary processing that cannot be safely implemented as a procedural skill.

Potential custom/internal tools later:

- read-only Control Center API;
- template preview/render matrix runner;
- benchmark run coordinator;
- provenance/license registry validator;
- production change approval endpoint.

## 14. Skill quality gate

Every project-local skill must define:

- when to use;
- allowed data;
- authority/write boundary;
- procedure;
- failure behavior;
- verification;
- references;
- version;
- owner/category tags.

A skill touching production must say exactly where owner approval occurs.
