# Security Incident Response — Step 17B

## Trigger examples

Credential exposure, unauthorized paid-final access, payment verification bypass, anomalous admin activity, malicious upload escape, database/R2 exposure, compromised dependency/image, production/staging credential crossover, or confirmed personal-data leakage.

## Immediate bounded actions

Lumer may autonomously collect non-secret evidence, stop experiment/staging, disable experiment flags, preserve logs, prepare a patch branch and recommend containment. Production DNS/routing, secret rotation, destructive DB changes, payment configuration and disabling security controls require explicit owner approval unless an external platform's emergency process independently enforces containment.

## Sequence

1. Classify affected trust boundary and customer/payment/data exposure.
2. Preserve content-minimized evidence and exact artifact/config versions.
3. Contain using the least destructive approved control.
4. Rotate exposed credentials through the proper secret store/provider.
5. Patch and validate in experiment/staging.
6. Re-run security, IP, payment/recovery and regression gates.
7. Obtain owner approval for production remediation/deploy.
8. Document root cause, customer/legal notification decision, corrective actions and follow-up owner/date.

Never erase evidence to make a release gate pass.
