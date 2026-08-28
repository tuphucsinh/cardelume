# Lume Localization QA

- **version:** 1.0.0
- **owner:** Lume / CardeLume
- **category:** assurance
- **risk:** medium
- **production_authority:** approval-required

## When to use

Validate UI/copy/template behavior for launch locales, especially CJK/Hangul typography and culturally sensitive copy.

## Allowed data

Localized UI/copy files, synthetic briefs, renderer outputs, locale metadata, native-review notes and approved font manifests.

## Authority and write boundary

May fix localization/source in branch/staging. Production locale enablement requires explicit owner approval through the release path.

## Procedure

1. Verify locale coverage and fallback behavior; distinguish translation completeness from native naturalness.
2. Stress punctuation, line breaking, long names, dates/numbers, plural/grammar behavior and text expansion.
3. Validate approved fonts/glyph coverage and renderer parity for Latin/CJK/Hangul.
4. Review card copy for natural relationship/formality tone and culturally inappropriate assumptions.
5. Test mobile/browser/final render and accessibility semantics.
6. Require native-speaker review for launch-critical marketing/legal/customer-facing copy when specified by roadmap.

## Failure / stop conditions

Block launch locale on missing glyphs, clipping, misleading fallback, serious unnatural/culturally inappropriate copy, or missing required native review.

## Verification

Locale matrix records PASS/FAIL/UNKNOWN per surface; renderer evidence exists; font provenance approved.

## Outputs

Locale QA matrix; typography/render defects; native-review status; blocker list.

## References

- `docs/MASTER_SPEC_V7.md`
- `docs/IP_COPYRIGHT_GOVERNANCE_SPEC_V1.md`
