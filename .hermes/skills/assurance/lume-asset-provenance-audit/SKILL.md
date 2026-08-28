# Lume Asset Provenance Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** assurance
- **risk:** high
- **production_authority:** approval-required

## When to use

Inventory and validate production asset provenance at catalog/repository scale, including fonts and template resources.

## Allowed data

Asset registry/manifests, source URLs, license proofs, hashes, template references and build asset paths.

## Authority and write boundary

Read/audit and prepare manifest fixes. Cannot waive provenance or publish unknown assets; any production publication requires explicit owner approval through the release path.

## Procedure

1. Build the set of actually referenced production assets from source/catalog.
2. Match each to provenance record and immutable identity/hash where possible.
3. Validate commercial/derivative/redistribution/embedding/attribution terms.
4. Detect orphaned manifest records and referenced-but-unregistered assets.
5. Fail the candidate when any referenced dependency is unknown/rejected.
6. Produce a build/publish enforcement recommendation for gaps.

## Failure / stop conditions

Referenced asset without authoritative provenance evidence is a hard failure.

## Verification

Referenced-assets set equals approved/attributed manifest set; no unknown/rejected dependency remains.

## Outputs

Coverage percentage; missing/invalid records; asset-to-template map; publish-blocking verdict.

## References

- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`

## Step 17B operational commands

Use `node scripts/ip-governance.mjs audit` to compare discovered font/static/template references to the registries. Do not hand-edit a status to `APPROVED` without exact version/hash, authoritative evidence, reviewer and review date required by the manifest validator. `node scripts/ip-governance.mjs release-check` is fail-closed and never publishes.
