# CardeLume 0.4.3 Step 17H — Marketing Approval Boundary

## Objective
Close the remaining Step17F/G source-review finding that production marketing could display candidate templates even though production generation/catalog reads require `launch_status=approved`.

## Implemented

- Added `featuredTemplatesForEnvironment(appEnv)` as the single marketing-template eligibility helper.
- `APP_ENV=production` returns only active, healthy templates with `launchStatus=approved`.
- Non-production review lanes may expose active/healthy `candidate`, `experiment` and `approved` templates, while `hold`/`retired` remain hidden.
- Homepage hero examples now use the same gated marketing set rather than hard-coded managed visual directions.
- When the approved production marketing set is empty, the hero falls back to neutral CardeLume-owned brand-paper treatment and the style gallery / style-anchor CTA are omitted.
- No template is auto-approved by this patch. The production catalog remains intentionally empty until owner/human/IP/Golden evidence approves a launch set.
- Existing FAST/RELEASE regression probes now assert the production marketing boundary; no new governance tier or ceremony was added.

## Product rule

> A production customer-facing surface must never promote a managed template that has not passed the same explicit launch-approval boundary required by production generation/catalog reads.

## Non-goals

- Do not auto-approve legacy or V2 templates.
- Do not weaken Step13 AI creative authority.
- Do not hide candidate/experiment templates from experiment/staging reviewers.
- Do not treat this patch as runtime, human-review or production evidence.
