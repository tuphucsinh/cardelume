# Lume Production Readiness

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** high
- **production_authority:** approval-required

## When to use

Final pre-production readiness synthesis after release audit, benchmark, security/IP and staging evidence exist.

## Allowed data

Release audit, benchmark/human review, staging E2E, security/IP reports, backup/restore, HA/failover evidence, legal/native-language/browser/mobile/accessibility QA.

## Authority and write boundary

Read-only synthesis. **Owner approval checkpoint:** a READY_FOR_OWNER_DECISION verdict does not deploy or authorize production changes.

## Procedure

1. Verify release artifact identity and all mandatory evidence dates/versions.
2. Require premium/WOW benchmark acceptable with human authority; no critical defects.
3. Require build/tests/migrations and paid AI/R2/Dodo/recovery staging E2E.
4. Require security/IP, backup/restore and legal/localization/browser/mobile/accessibility gates.
5. For launch, require Pi/Oracle failover/HA evidence when roadmap reaches that gate.
6. Report READY_FOR_OWNER_DECISION only when no mandatory gate is failed/unknown; otherwise NOT_READY.

## Failure / stop conditions

Unknown equals not ready for mandatory launch gates. Never collapse source PASS into production readiness.

## Verification

All evidence matches current candidate; no mandatory UNKNOWN; production action still awaits explicit owner approval.

## Outputs

Readiness matrix; candidate identity; unresolved blockers; READY_FOR_OWNER_DECISION or NOT_READY.

## References

- `docs/ROADMAP_V7.md`
- `docs/V7_IMPLEMENTATION_CHECKLIST.md`

## Step 17B required evidence

Before READY_FOR_OWNER_DECISION, require both `node scripts/ip-governance.mjs release-check` and `node scripts/security-governance.mjs release-check` to return eligible, in addition to the later Step 18/19 runtime gates. A source-only governance PASS is not sufficient.
