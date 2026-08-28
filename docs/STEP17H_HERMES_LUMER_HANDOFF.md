# Hermes/Lumer Handoff — CardeLume 0.4.3 Step17H

## Current baseline
`0.4.3-step.17h` — Marketing Approval Boundary.

## What changed from Step17G
Production marketing now obeys the same `launch_status=approved` boundary as production catalog/generation. Homepage hero/gallery cannot leak candidate/experiment managed templates. In non-production, candidate/experiment templates remain reviewable.

## Current status
- SOURCE/OFFLINE: PASS.
- PRODUCTION: NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES.
- Approved production templates: intentionally still 0 until explicit evidence-backed owner approval.

## Normal checks
`npm run check:fast`
`npm run check:release`
`npm run check:status`
`npm run check:heavy`

## Next authority
Proceed to Step18 controlled runtime validation; do not invent approvals or runtime PASS.
