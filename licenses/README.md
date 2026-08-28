# CardeLume Production Provenance Registry

This directory is the machine-readable source of truth for production creative provenance.

Hard rule:

> **UNKNOWN or unverifiable license/provenance = production NO-GO.**

The manifests intentionally distinguish **upstream license research** from **exact shipped-binary evidence**. A family being generally available under an open license is not enough to approve a particular npm/Debian binary when the exact version/hash and retained license evidence are unknown.

## Required manifests

- `fonts/FONT_LICENSE_MANIFEST.json` — every web/renderer font source.
- `assets/ASSET_PROVENANCE_MANIFEST.json` — bundled images/illustrations/ornaments/other binaries.
- `templates/TEMPLATE_PROVENANCE_MANIFEST.json` — originality/IP review state for template families.

## Approval evidence

An `APPROVED` record must identify the exact shipped asset/version/hash where applicable and point to retained license/ownership evidence. Do not place purchased-license secrets or account credentials here; store a durable evidence reference or redacted proof location.

Use:

```bash
node scripts/ip-governance.mjs audit
node scripts/ip-governance.mjs release-check
node scripts/font-provenance-collect.mjs
```

`audit` checks governance coverage. `release-check` fails closed on any missing/UNKNOWN/REJECTED production dependency.
