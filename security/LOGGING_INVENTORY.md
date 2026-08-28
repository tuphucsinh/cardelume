# Security Logging Inventory — Step 17B

Step 17B adds content-minimized source security events for admin authentication/authorization, Dodo webhook verification/rejection, rate-limit enforcement, recovery-download denial and paid-fulfillment retry. This is **still not sufficient to claim production security-logging validation** because centralized sink/ACL/retention/alert evidence is not available here.

## Existing source signals

- worker emits JSON operational events with `event` and `nodeId`;
- queue sender emits a content-minimized error event;
- template analytics and AI usage ledgers are purpose-specific telemetry, not a replacement for security logs;
- source now emits selected security events without raw credentials/tokens/user content;
- no evidence currently proves centralized immutable logging, access-control on log stores, alert routing or production retention.

## Required security events before launch

At minimum, emit privacy-minimized records for:

- successful and failed admin authentication;
- denied admin authorization / missing mutation capability;
- webhook signature/timestamp rejection without logging secrets or raw authorization headers;
- repeated rate-limit enforcement and abuse thresholds;
- recovery capability verification failure/replay rejection;
- production readiness and security release-gate failures;
- secret/config isolation failures at startup;
- suspicious upload validation failures aggregated without retaining customer image contents;
- privileged Lumer/Hermes production-action request and owner approval decision.

## Prohibited log content

Do not log raw passwords, API keys, bearer tokens, webhook signatures, recovery tokens, signed URLs, full cookies, service-role keys, payment secrets, full uploaded image contents, or raw user messages unless an explicitly approved incident procedure requires narrowly scoped evidence.

## Release status

`PARTIAL / BLOCKING`: source policy exists, but centralized sink ACLs, retention, alert routing and complete security-event coverage need staging/production evidence.
