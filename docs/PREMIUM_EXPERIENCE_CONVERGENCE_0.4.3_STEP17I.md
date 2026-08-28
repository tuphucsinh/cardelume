# CardeLume 0.4.3 Step17I — Premium Experience Convergence

## Objective

Step17I converts the strongest findings from independent UI/UX reviews into a small, bounded product pass. It does **not** add a new product surface or change CardeLume's core architecture.

The launch customer promise remains:

```text
small brief
→ intelligent generation
→ 3 genuinely different premium directions
→ choose
→ minimal finishing
→ one-time payment
→ secure JPG/PDF
```

The governing product principle for this step is:

> **Make intelligence visible, but keep complexity invisible.**

## Implemented

### 1. Hero as one material object

The homepage hero now centers one restrained paper/folio object instead of a generic three-card collage. In production it still obeys the Step17H approved-only marketing boundary. With no approved template, the hero uses CardeLume-owned neutral brand paper rather than a candidate/experiment template.

The material caption uses localized CardeLume copy. No fake social proof, stock lifestyle mockup, neon, particle system or generic AI gradient was added.

### 2. Signature folio reveal → three directions

Generation reveal now uses a restrained folio/pocket composition with three paper sheets. The reveal sheets and final result cards share `view-transition-name` identities so the authored reveal can land into the actual three result directions rather than feeling like an unrelated loading screen.

Reduced-motion behavior remains mandatory.

### 3. Customer-safe “why this fits” intelligence

`GeneratedDirection` now supports a separate bounded `customerRationale` field.

The Creative Director prompt requires this field to:

- use the customer locale;
- remain short and emotionally useful;
- describe fit, not internal process;
- never expose hidden reasoning, scores, rankings, model/system language or chain-of-thought.

The UI shows the customer-safe rationale and does **not** render raw `creativeThesis`.

### 4. Photo intelligence stays optional but becomes visible when relevant

Photo upload remains progressive/optional. When a customer has supplied a photo and a result can use it, the result surface can echo the extracted palette so the personalization intelligence is visible without forcing photo complexity on everyone.

### 5. Finish converges toward “almost done”

The customer-facing wording controls are reduced to:

- Shorter;
- one `Refine wording` action in live generation mode;
- one-step Undo after an automated rewrite.

The always-visible Playful rewrite action is removed from the launch UI. The endpoint may retain bounded compatibility support, but it is not a primary customer control.

Visible color choice is reduced to at most three art-directed options:

- Original;
- From photo, when available;
- one curated accent.

This preserves CardeLume art direction and avoids a mini design editor.

### 6. Brief wording and defaults

Relationship is no longer preselected as Partner. Relationship remains useful AI context but starts neutral/optional.

Format is reframed as:

> **Print layout (optional)**

with explicit digital-only guidance. This keeps print-ready PDF capability without implying that CardeLume ships a physical card.

### 7. Post-pay keepsake clarity

The real recovery/delivery page now states that the ready assets are the customer's keepsake files and explicitly frames the high-resolution JPG + print-ready PDF as the owned deliverables. This complements the existing secure signed-download/recovery architecture rather than adding hosted sharing.

### 8. Phase focus management

Results, Finish and Checkout headings are explicit focus targets. After a major Studio phase transition, focus is moved deliberately to the new phase heading. This is a source-level accessibility improvement; full keyboard/screen-reader proof remains Step18 work.

## Deliberate non-goals

Step17I does **not**:

- create or auto-approve launch templates;
- expose raw AI reasoning/chain-of-thought;
- turn Studio into a multi-page wizard;
- add a Canva-style editor or template marketplace;
- add mandatory accounts, subscriptions or credits;
- add vector DB / multi-agent orchestration / enterprise dashboard work;
- rewrite the Creative Director authority model;
- rewrite Dodo/payment/recovery trust boundaries;
- add regeneration paywalls/cooldowns without measured need;
- add fake social proof;
- add generic particles/neon/continuous shimmer;
- claim browser/runtime/production PASS.

## Launch-template boundary

Step17I preserves the Step17H rule:

- production marketing/catalog/generation require launch-approved templates;
- non-production may expose candidate/experiment inventory for review;
- there are currently **0 approved launch templates**;
- human Premium/WOW/originality review, Golden evidence and IP evidence remain mandatory before approval.

## Validation boundary

Step17I is a source/offline product-quality step. It cannot close:

- reviewed `pnpm-lock.yaml` / frozen install / full workspace build;
- real premium-model Golden runs;
- exact shipped font binary provenance;
- human template approval;
- legal/native-language approval;
- staging Postgres/RLS/R2/pg-boss/Dodo E2E;
- real JPG/PDF entitlement/recovery proof;
- browser/mobile/accessibility/performance/CSP enforcement;
- Pi5/Oracle HA and backup/restore rehearsal.

Those remain Step18/19 evidence gates.
