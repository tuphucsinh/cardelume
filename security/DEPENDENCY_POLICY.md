# Dependency & Supply-Chain Security Policy — Step 17B

Production requires a reproducible dependency graph and evidence tied to the exact release candidate.

## Hard requirements

1. Reviewed `pnpm-lock.yaml` committed/frozen for the candidate.
2. Exact container base image digest; mutable tags alone are insufficient.
3. Debian/runtime OS packages pinned to a reproducible snapshot/version or accompanied by equivalent immutable build provenance.
4. Release SBOM generated from the resolved graph, not only package manifests.
5. Vulnerability scan bound to the release lock/SBOM and container artifacts.
6. Secret scan and provenance/IP release checks PASS.
7. Production image contains only required runtime functionality; debug/build tooling is excluded unless justified.
8. Release artifact and internal source manifest have SHA-256 evidence.

## Vulnerability handling

- known exploited or launch-path Critical/High issue: **NO-GO until remediated or explicit owner risk acceptance with compensating control**;
- other High: target remediation within 7 days;
- Moderate: target within 30 days;
- Low: target within 90 days;
- any exception must identify package, affected surface, exposure, compensating control, owner and expiry date.

Automated tooling may collect/analyze evidence but cannot approve production risk acceptance.
