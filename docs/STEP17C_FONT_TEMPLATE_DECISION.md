# Step 17C — Font & Template IP Hardening Decision

## Scope

Continue all work that can be completed before Pi5 runtime validation. This substep does not replace Step 18; it reduces future runtime and legal-quality uncertainty.

## Decisions frozen for next runtime phase

- Keep **Cormorant Garamond** as CardeLume's primary Latin display/brand baseline.
- Put **Plus Jakarta Sans** at the top of the experiment queue to replace DM Sans for global UI because current DM Sans distribution metadata lacks a Vietnamese subset.
- Keep **EB Garamond + Lato** as final-render baseline until a measured preview/final parity experiment proves a better stack.
- Keep **Noto Serif/Sans CJK** as primary JP/KR/ZH baseline.
- Prefer bundled Noto over OS-specific CJK/Hangul heading fonts in web CSS for deterministic visual parity.
- Do not add Newsreader/Fraunces/Source Han/Zen/Gowun to production dependencies yet; they are benchmark candidates only.
- Do not import third-party greeting-card templates as replacements.
- Keep and strengthen the strongest original CardeLume families; rework/retire generic or culturally shorthand families through original procedural concepts.
- All exact font binaries and all 16 current templates remain production approval-gated until provenance/originality evidence is complete.

## Source changes

- enriched font manifest with family-level license eligibility separate from exact binary production approval;
- added `FONT_CANDIDATE_CATALOG.json`;
- added typography experiment catalog;
- updated CJK/Hangul page-heading stack to prefer already-bundled Noto fonts;
- added Step 17C review fields to all 16 template provenance entries without changing their pending status;
- added 12 original renderer-safe template concepts;
- Seven highest-priority concepts now have renderer-safe procedural proof-of-concepts plus an offline preview gallery; none are wired to production.
- Registered two default-OFF, non-production experiments: `typography-plus-jakarta` and `original-template-v2`.
- added automated source-governance stress test.

## What remains Pi5/runtime-gated

- create/restore trustworthy `pnpm-lock.yaml` and pin dependency graph;
- install exact dependencies;
- collect Fontsource package license files + exact WOFF2 hashes;
- pin Debian font package/snapshot versions + hash final font files;
- full typecheck/build/test;
- visual screenshot/native-language typography QA;
- Golden benchmark comparison for typography/template experiments;
- human premium/WOW review;
- production approval.
