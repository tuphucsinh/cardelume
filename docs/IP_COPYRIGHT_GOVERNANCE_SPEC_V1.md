# IP & Copyright Governance Specification v1

## 1. Hard rule

> **Unknown or unverifiable license/provenance = rejected from production.**

This rule covers fonts, images, photos, icons, ornaments, illustrations, patterns, templates, reference-derived work, AI-generated assets and any bundled creative resource.

## 2. Provenance record

Every production creative asset needs a record equivalent to:

```ts
AssetProvenance {
  assetId
  type
  contentSha256
  sourceType
  sourceUrl?
  creator?
  acquiredAt
  licenseName
  licenseVersion?
  licenseEvidencePath
  commercialUseAllowed
  derivativeAllowed
  embeddingOrRedistributionAllowed
  attributionRequired
  attributionText?
  reservedNameOrTrademarkNotes?
  aiProviderAndTermsVersion?
  reviewer
  status
}
```

Allowed status:

```text
APPROVED
APPROVED_WITH_ATTRIBUTION
REJECTED
UNKNOWN
```

`UNKNOWN` behaves as `REJECTED` for publish.

## 3. Font policy

Preferred sources:

1. font owned/commissioned by the business with written rights;
2. SIL Open Font License 1.1 fonts with license/copyright notice retained as required;
3. other commercial fonts only when the purchased license explicitly covers intended web/app/server-rendering/embedding/distribution use.

For OFL fonts:

- record the exact upstream source/version/hash;
- keep the OFL text/copyright notice with redistributed font software as required;
- if modifying a font, review Reserved Font Name conditions before renaming/distributing;
- do not assume a similarly named download from an unofficial mirror has the same provenance.

Create/maintain:

```text
licenses/fonts/FONT_LICENSE_MANIFEST.json
licenses/fonts/<font>/OFL.txt or commercial-proof reference
```

Release/build should fail if a packaged production font lacks an approved manifest entry.

## 4. Image/illustration/ornament policy

Preferred sources:

1. original CardeLume-owned work;
2. user-uploaded content used only for that user's card under the service terms;
3. assets with explicit commercial license and retained evidence;
4. verified public-domain/CC0 material;
5. AI-generated assets when provider terms and input provenance support commercial use and the asset passes similarity/trademark review.

Not acceptable:

- "found on Google/Pinterest";
- unknown Telegram/drive packs;
- screenshot/crop of competitor marketing/template art;
- customer images reused in templates, demos or benchmark references without explicit permission.

## 5. Template originality

A CardeLume template must be an original composition. Reference research may inform principles, but not produce a substantially copied layout/artwork.

Template publish review asks:

- Is there a specific external design this can reasonably be described as reproducing?
- Were distinctive composition, ornament and typography relationships independently designed?
- Are all component assets separately licensed/provenanced?
- Is any third-party trademark/logo unnecessarily present?
- Does the template rely on a generated asset that visibly imitates a named living artist/brand or proprietary design?

If similarity risk is material, reject/redesign before publish.

## 6. Competitor/reference research

Store by default:

```text
source URL
publisher/competitor
access date
market
abstract observation
why it matters
original CardeLume opportunity
do-not-copy note
```

Do not maintain a hidden scrape library of competitor templates as reusable assets.

## 7. AI-generated creative assets

Record:

- provider/model;
- date;
- relevant provider commercial-use terms/version reference;
- source input provenance;
- content hash;
- human similarity/IP review verdict.

AI output is not automatically "copyright safe" merely because it was generated.

## 8. User uploads

User uploads:

- remain private;
- are not added to design research/training/template libraries by default;
- are processed only for the customer's card/allowed service functions;
- follow existing retention/deletion policy.

## 9. Takedown / complaint

Maintain a documented IP complaint path:

```text
receive notice
→ identify asset/template/version/orders affected
→ preserve necessary evidence
→ unpublish future use if credible risk
→ assess license/provenance
→ replace/redesign if necessary
→ document resolution
```

Historical paid recovery must be considered carefully; do not destroy customer entitlements blindly.

## 10. Lumer IP audit

`lume-ip-copyright-audit` must run before:

- new template publish;
- new font deployment;
- new stock/illustration library addition;
- AI-generated reusable asset publish;
- release containing creative dependency changes.

## 11. Source references

Governance should periodically re-check official license terms. Current baseline references include the official SIL Open Font License 1.1 and its FAQ; legal advice should be obtained for ambiguous commercial-license or infringement questions.
