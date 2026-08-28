# Security Governance Specification v1

## 1. Security objective

Protect customer trust, photos, paid entitlements, payment state, production availability, secrets and operator/admin authority without making the simple customer flow burdensome.

## 2. Standards baseline

- **OWASP ASVS 5.0.0 Level 2 target** for the customer-facing application because Level 2 is the normal target for most applications.
- Risk-based higher-assurance controls/review for payment, recovery, admin/operator access, secrets/cryptography and production control surfaces.
- **OWASP Top 10:2025** used as an awareness/mapping checklist, not as the complete verification standard.

Track ASVS requirements with versioned identifiers such as `v5.0.0-x.y.z` where practical.

## 3. Threat surfaces

Mandatory threat model includes:

- anonymous identity/session abuse;
- template/admin privilege escalation;
- optional account takeover;
- payment/webhook forgery/replay;
- order/recovery entitlement theft;
- upload decompression/image parser abuse;
- XSS/HTML/SVG/renderer injection;
- SQL/injection/business-logic abuse;
- AI prompt/provider data leakage;
- R2 object exposure;
- supply-chain/package/container compromise;
- credential theft on Pi5/VPS;
- Cloudflare/tunnel/origin bypass;
- rate/cost abuse;
- logs/backups leaking private content;
- Lumer prompt/skill/tool supply-chain attacks;
- staging-to-production credential confusion.

## 4. Application controls

Retain existing Step 1–13 controls and formalize verification for:

- secure cookies/session rotation;
- CSRF/same-origin mutation rules;
- server-authoritative prices/payment state;
- webhook raw-body cryptographic verification;
- exact template/version integrity;
- authorization/RLS;
- signed expiring capabilities;
- private object storage;
- upload content validation + decode/re-encode;
- security headers/CSP rollout;
- output encoding/sanitization;
- deterministic renderer safety;
- rate limiting/abuse detection;
- safe failure and non-leaky errors;
- minimal retention.

## 5. File/upload controls

All uploads must have bounded size/dimensions/time/resource usage, verified content type, safe decode/re-encode and private quarantine. Extension or browser-reported MIME alone is never sufficient.

## 6. Supply-chain security

Every release should have:

- frozen lockfile;
- reviewed dependency changes;
- pinned container image digests;
- SBOM (SPDX and/or CycloneDX supported format);
- dependency vulnerability report;
- remediation policy/SLA;
- secret scan;
- artifact checksum;
- minimal production image with dev/test functionality excluded.

Do not auto-merge broad dependency updates into production merely because Lumer found newer versions.

## 7. Lumer / AI-operator security

Lumer is a privileged operator and must be treated as such.

Rules:

- no production secrets in repository/SOUL/skills/memory;
- least-privilege read credentials for monitoring/research where possible;
- staging credentials distinct from production;
- production mutations through narrow scripts/endpoints with explicit approval;
- destructive commands require confirmation and recovery evidence;
- project skills are code-reviewed/trusted content;
- third-party/community skills are inspected before installation;
- external skill directories are not considered read-only unless filesystem permissions enforce it;
- do not run multiple independent agents against the same profile state;
- record production change actor/commit/reason/approval.

## 8. Admin / Control Center

Protect internal surfaces with identity-aware access (for example Cloudflare Access) plus application authorization where appropriate. Do not expose admin merely by hiding the URL.

Default Control Center views are read-only and privacy-minimized.

## 9. Secrets

- environment/secret manager/root-owned files only;
- scoped per service/environment;
- no secrets in logs;
- rotation procedure documented;
- no reuse of staging and production secrets;
- recovery process tested;
- Lumer receives only secrets required for the active action.

## 10. Database/RLS

Verify real staging Postgres/Supabase behavior for:

- anonymous ownership;
- optional account ownership/linking;
- server-only payment/template/AI usage tables;
- template admin permissions;
- no public role visibility into operator-only rows;
- migration roles separated from web roles where practical.

## 11. Observability / incident response

Security signals:

- repeated invalid webhook signatures;
- auth/account magic-link abuse;
- recovery brute force;
- upload rejection spikes;
- rate-limit spikes;
- admin access failures;
- abnormal AI spend/generation volume;
- production configuration drift;
- worker/readiness failures;
- dependency/security alerts.

Incident procedure must support containment, rollback, key rotation, evidence preservation and postmortem.

## 12. Backup/restore security

- private encrypted transport/storage appropriate to provider;
- strict file permissions;
- checksum;
- isolated restore rehearsal;
- restore target guard;
- retention documented;
- backups must not become a less-protected copy of sensitive data.

## 13. Security release gate

Release NO-GO if any of these are unresolved:

- critical/high exploitable issue on launch path;
- unknown production secret exposure;
- failed payment/recovery authorization boundary;
- staging/production credential confusion;
- unreviewed privileged skill/tool change;
- required backup/rollback evidence missing;
- major new auth/upload/admin surface without threat/security validation.

## 14. Periodic Lumer audits

Recommended cadence after launch:

- daily: health/security-signal summary;
- weekly: dependency/config/permission quick audit;
- each release: full affected-surface release audit;
- monthly: broader ASVS/security debt review + backup/restore evidence;
- after incidents: targeted postmortem and policy/skill update.
