# Lume Dependency Security

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** assurance
- **risk:** high
- **production_authority:** approval-required

## When to use

Review dependency graph, lockfile integrity, SBOM, advisories, container/base-image pinning and supply-chain risk.

## Allowed data

Package manifests/lockfiles, SBOM, registry/advisory metadata, container digests and CI configuration. Never require production secrets.

## Authority and write boundary

May update dependencies in a branch and run tests. Production dependency rollout requires release/owner approval.

## Procedure

1. Require a reproducible dependency lock; if absent, mark release gate failed rather than improvising.
2. Generate/review SBOM when tooling is available and compare to prior release.
3. Check known vulnerabilities, malicious/abandoned package signals, install scripts and transitive changes.
4. Review Docker/base image pinning/digests and multi-arch compatibility.
5. Patch in smallest safe increment; run typecheck/build/tests/security/source regressions.
6. Record residual risk and rollback version.

## Failure / stop conditions

No lockfile/reproducibility or unresolved critical exploitable dependency => NO_GO unless an explicitly documented owner-approved exception exists.

## Verification

Dependency diff and advisory evidence attached; build/tests executed or UNKNOWN stated; no hidden lock regeneration claimed.

## Outputs

Dependency/SBOM diff; vulnerabilities; remediation branch; release verdict.

## References

- `docs/SECURITY_GOVERNANCE_SPEC_V1.md`
- `docs/ROADMAP_V7.md`

## Step 17B evidence contract

`security/reports/source-sbom.cdx.json` is deliberately marked partial and is not release authority. Production requires `pnpm-lock.yaml`, `security/reports/release-sbom.cdx.json` and `security/reports/dependency-vulnerability-report.json` tied to the current candidate, plus built-image inspection. Follow `security/DEPENDENCY_POLICY.md`.
