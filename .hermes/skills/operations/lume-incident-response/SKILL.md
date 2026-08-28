# Lume Incident Response

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** operations
- **risk:** high
- **production_authority:** approval-required

## When to use

Investigate and coordinate a reliability, security, payment, data, rendering or availability incident.

## Allowed data

Health metrics, logs with PII minimization, traces, deployment/config history, queue states, provider statuses, backups and incident timeline.

## Authority and write boundary

May observe, preserve evidence, draft communications, create recovery branches and recommend reversible containment. Production changes follow authority policy; destructive actions and security-control removal require explicit owner approval plus recovery evidence.

## Procedure

1. Open incident record with timestamp, severity, scope and known customer impact.
2. Preserve evidence before changing state; avoid copying sensitive content unnecessarily.
3. Identify last-known-good release/config and map affected dependencies.
4. Choose reversible containment first: traffic shift, feature kill switch or safe rollback if already authorized by runbook.
5. For payment/data/security incidents, verify trust boundaries and entitlement integrity before restoring normal flow.
6. Validate recovery with health/readiness and targeted E2E.
7. Record root cause separately from contributing conditions.
8. Produce follow-ups with owner, due state and prevention test.

## Failure / stop conditions

Do not erase logs/evidence, purge queues/data, rotate production secrets, alter DNS/payment config or disable controls without the required explicit approval.

## Verification

Timeline and evidence retained; containment/recovery steps have observed results; customer/security impact and unknowns are explicit.

## Outputs

Incident timeline; impact assessment; containment/recovery recommendation; evidence; post-incident actions.

## References

- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
- `docs/ARCHITECTURE_V7_LUMER_OPERATIONS.md`

## Step 17B incident runbook

Use `security/INCIDENT_RESPONSE.md` as the canonical bounded sequence. Preserve evidence, do not print secret values, and do not use incident urgency as permission to rotate production secrets/change DNS/payment/destructively mutate DB without the owner-approval boundary defined by policy.
