# CardeLume Governance Execution Standard

Governance protects production; it must not become development ceremony.

## Three execution tiers

| Tier | Run when | Purpose | Expected behavior |
|---|---|---|---|
| **FAST** | every meaningful source change | catch cheap product/creative/payment/media/queue/catalog regressions | fail fast; target seconds |
| **RELEASE** | before staging/promotion/freeze | authoritative source/offline regression across templates, IP, security, experiment, operations, Lumer and benchmark contracts | one command, one JSON report |
| **HEAVY** | release candidate / controlled runtime | RELEASE + render/typography stress + optional frozen install/typecheck/build/test | may return NO_GO when runtime/owner evidence is absent |

Commands:

```bash
npm run check:fast
npm run check:release
npm run check:heavy
npm run check:status
```

`check:status` executes the RELEASE source suite and reports owner/runtime gates without deploying or mutating production.

## Invariant ownership

The canonical registry is `governance/check-registry.mjs`. Existing focused stress scripts remain small reusable probes and can be run directly when debugging, but Step-specific aggregate scripts are not part of the public workflow anymore.

The runner writes only consolidated evidence under `quality/governance/`; it does not create one log file per sub-check by default.

## What is intentionally NOT compressed

Hard boundaries remain independent because they protect different failure domains:

- payment/webhook/recovery;
- trusted uploads;
- renderer/template identity;
- IP/provenance;
- security/admin/secrets;
- experiment/staging isolation;
- backups/readiness/HA;
- human Premium/WOW/originality approval.

Compression means fewer entry points, duplicate reports and stale Step assertions — **not fewer protections**.

## Production rule

`SOURCE PASS` is not `PRODUCTION PASS`. Missing lockfile, real-model, staging service, browser, legal/owner, IP, backup or HA evidence remains NO_GO.
