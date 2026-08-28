# Lume IP & Copyright Audit

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** assurance
- **risk:** high
- **production_authority:** approval-required

## When to use

Before any creative asset/template/font/reference-derived material can become production-eligible.

## Allowed data

Provenance manifest, original source URLs/evidence, licenses, purchase records/references, asset hashes, creator/source metadata and template originality notes.

## Authority and write boundary

May approve/reject provenance state in review artifacts; cannot waive unknown rights. Production publication still requires explicit owner approval through the normal release path.

## Procedure

1. Enumerate every external/AI-generated production dependency: font, image, illustration, ornament, texture, source material and generated asset where applicable.
2. Verify source/creator, license/version, commercial use, derivatives, redistribution/embedding and attribution requirements from authoritative evidence.
3. Record acquisition date, proof/evidence and asset hash/identity.
4. For template/reference work, review originality and substantial-layout similarity risk.
5. Verdict per asset: APPROVED, APPROVED_WITH_ATTRIBUTION, REJECTED. UNKNOWN is treated as REJECTED.
6. Confirm production build/publish path blocks unapproved dependencies.

## Failure / stop conditions

Unknown or unverifiable provenance = REJECTED. Random download-site claims, Google Images/Pinterest/Etsy availability, or “AI generated” alone are not sufficient rights evidence.

## Verification

Manifest complete; every used asset has verdict; attribution obligations are actionable; no rejected/unknown dependency referenced by candidate.

## Outputs

Asset provenance matrix; license evidence; originality review; blocking items; IP verdict.

## References

- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`

## Step 17B operational commands

- Run `node scripts/ip-governance.mjs audit` for repository/catalog coverage.
- Run `node scripts/font-provenance-collect.mjs` only in a controlled installed runtime to collect exact npm/Debian font evidence; collection **never auto-approves** a font.
- Run `node scripts/ip-governance.mjs release-check` before any production-candidate verdict. Non-zero / `NO_GO` is blocking.
- Canonical registries: `licenses/fonts/FONT_LICENSE_MANIFEST.json`, `licenses/assets/ASSET_PROVENANCE_MANIFEST.json`, `licenses/templates/TEMPLATE_PROVENANCE_MANIFEST.json`.
