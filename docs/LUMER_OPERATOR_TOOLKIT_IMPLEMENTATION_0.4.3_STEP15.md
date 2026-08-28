# CardeLume 0.4.3 Step 15 — Lumer AI Operator Toolkit Implementation

## 1. Goal

Turn the V7 Lumer operating model into repository-owned, reviewable and testable procedures that a dedicated Hermes profile can discover on demand without carrying a giant permanent prompt.

Lumer manages the operating system around CardeLume; CardeLume remains the product; production remains approval-gated.

## 2. Repository layout

```text
.hermes/
├── skills/
│   ├── creative/
│   ├── operations/
│   ├── research/
│   ├── assurance/
│   └── analytics/
├── policies/          # pointer to canonical .lumer policies
├── workflows/
└── project-context/

.lumer/
├── policies/
└── bundle-templates/
```

Profile-local state is intentionally excluded from the repo and handoff archive:

```text
~/.hermes/profiles/lumer/
├── config.yaml
├── .env
├── SOUL.md
├── memories/
├── sessions/
└── runtime/state
```

## 3. Skills implemented

### Canonical V7 — creative

- `cardelume-template-author`
- `cardelume-premium-review`
- `cardelume-template-portfolio`
- `cardelume-market-adaptation`
- `cardelume-publish-qa`

### Canonical V7 — operations

- `lume-project-health`
- `lume-release-audit`
- `lume-experiment-manager`
- `lume-incident-response`
- `lume-backup-restore-audit`

### Canonical V7 — research

- `lume-market-intelligence`
- `lume-competitive-pricing`
- `lume-visual-reference-scout`

### Canonical V7 — assurance

- `lume-ip-copyright-audit`
- `lume-security-audit`
- `lume-localization-qa`

### Canonical V7 — analytics

- `lume-ai-economics`
- `lume-product-effectiveness`

### Operational companion skills

These map the additional Step 15 continuation requirements to explicit procedures:

- `lume-project-audit`
- `lume-performance-audit`
- `lume-staging-release`
- `lume-production-readiness`
- `lume-dependency-security`
- `lume-asset-provenance-audit`
- `lume-analytics-review`

Every `SKILL.md` defines when to use it, allowed data, authority/write boundary, procedure, stop/failure conditions, verification, outputs, references, version/owner/category/risk and production authority.

## 4. Template-authoring quality boundary

The template-author skill enforces:

```text
market/business need
→ abstract research principles
→ original creative thesis
→ family + design DNA + bounded variants
→ renderer-safe implementation
→ synthetic stress matrix
→ typography/CJK/Hangul/photo/WCAG/output QA
→ provenance/IP audit
→ Premium Benchmark
→ premium review
→ publish QA
→ owner-approved release
```

It explicitly blocks competitor tracing/copying, unknown-license assets, customer content as template references, arbitrary model-authored CSS/SVG inside the trusted renderer and direct production publish.

## 5. Authority and secrets

Canonical policy is in `.lumer/policies/`.

- Observe/prepare: autonomous.
- Experiment/staging: autonomous only inside proven isolated scope and quotas.
- Production promotion: explicit owner approval.
- Irreversible actions: explicit owner approval plus recovery evidence.
- Missing evidence: UNKNOWN, never silently PASS.

No credentials are placed in skills, policies, benchmark fixtures, SOUL template or handoff artifacts.

## 6. Operational bundles

Version-controlled templates are provided for:

- `/lume-daily`
- `/lume-template`
- `/lume-release`
- `/lume-research`
- `/lume-incident`
- `/lume-benchmark`

They are templates only; install/sync into the actual Lumer profile is a Pi5 runtime action.

## 7. Executable helpers

### `scripts/lumer-toolkit-source-stress.mjs`

Checks all required skills/policies/bundles/workflows/context, mandatory skill sections, explicit owner-approval language, renderer/IP/security/economics invariants, profile bootstrap commands and obvious secret literals.

### `scripts/lumer-project-health.mjs`

Safe static/read-only health report. It inspects source version, dependency-lock presence, migrations, Golden Set, skills and key docs/source hashes. Connected-service health is explicitly reported as UNKNOWN rather than fabricated.

### Consolidated release evidence (`npm run check:status`)

Fail-closed release evidence preflight. Current expected result is **NO_GO** until the frozen lock/build, real-model human benchmark, staging E2E, security/IP runtime gates, backup restore and later HA evidence are complete.

## 8. Pi5 bootstrap handoff

Use `.hermes/project-context/LUMER_BOOTSTRAP_CHECKLIST.md` together with `docs/LUMER_BOOTSTRAP_RUNBOOK_V1.md` and `docs/LUMER_SOUL_TEMPLATE.md`.

The actual Pi5 bootstrap must create the dedicated `lumer` profile, set workspace cwd, install reviewed SOUL, configure least-privilege local secrets, review/trust project skills, sync bundles and validate the authority matrix with **no production writes** in the first session.
