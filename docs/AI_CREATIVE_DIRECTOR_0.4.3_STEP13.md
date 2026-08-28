# CardeLume 0.4.3 Step 13 — AI Creative Director & Premium Generation Orchestrator

## 1. Product authority

Premium/wow is the primary optimization target. Cost, latency and determinism are constraints, not the creative objective.

CardeLume follows three non-negotiable rules:

1. **Rules protect quality; AI directs creativity.**
2. **No soft ranking score is a final creative decision.**
3. **AI may override soft ranking or request a broader candidate pool, but may never override hard security/render/format/photo/script constraints.**

The customer experience remains intentionally non-Canva:

```text
small brief → CardeLume understands the moment → 3 premium art directions → minimal finishing → paid final
```

## 2. Decision hierarchy

When signals conflict:

```text
explicit user intent
> personal/recent-style context
> occasion + relationship + feeling
> creative resonance
> market prior
> global performance prior
```

Market targeting is a prior, never a stereotype or hard creative rule except explicit exclusions/technical incompatibility.

## 3. Generation pipeline

```text
User Brief
  ↓
Intent normalization (deterministic where possible)
  ↓
Hard eligibility filter
  - active + healthy + validated
  - format
  - script
  - photo requirement
  - excluded market
  - renderer compatibility
  ↓
Soft ranker
  - relevance
  - market affinity
  - editorial quality
  - normalized performance
  - text fit
  - freshness
  - recent-style novelty penalty
  ↓
Creative candidate pack
  - 6 high-fit
  - 2 high-quality wildcards
  ↓
ONE premium AI Creative Director call
  - review score breakdowns
  - review recent style memory
  - choose 3
  - articulate creative thesis
  - choose controlled creative treatment
  - write premium copy
  - self-report confidence/risk
  ↓
Deterministic Quality Gate
  ↓
PASS ───────────────────────────────→ Studio
  │
  └─ risk/low spread/low confidence
       ↓
     Conditional premium critic/repair
       ↓
     targeted repair only
```

## 4. Candidate pack: 6 fit + 2 wildcards

The deterministic ranker produces priors, not the final answer.

### 4.1 High-fit candidates

Select up to six candidates with the strongest total score while preserving family/visual diversity when practical.

### 4.2 Wildcards

Select up to two candidates that:

- pass every hard constraint;
- exceed a minimum editorial quality threshold;
- are not already in the fit set;
- increase visual/family/archetype novelty;
- may have a lower rank when they offer strong creative potential.

A wildcard is never a random low-quality template.

### 4.3 Expansion

The AI may return `expand_pool` when the initial eight candidates do not provide enough premium creative range.

Expansion is conditional, not default. The second pool may contain up to 16 candidates and must still satisfy hard eligibility.

## 5. AI Creative Director responsibility

The core customer-facing generation call always uses the configured premium production model. Cheap models may be used only for non-customer-facing classification/analytics in future versions.

The Creative Director receives compact structured context:

- sanitized `GenerationBrief`;
- eight candidate identities and immutable versions;
- engine score + relevant score components;
- visual direction and photo mode;
- compact creative recipe/capabilities;
- up to a few recent style fingerprints;
- market/locale prior in compact form.

It must return exactly three directions unless requesting expansion.

For each direction it returns:

- trusted candidate ID/version (must belong to supplied candidate set);
- `creativeThesis` — why this direction fits this person/moment;
- `signatureMove` — memorable premium move chosen from approved capabilities;
- `accentMode` — approved renderer/client enum only;
- kicker/headline/body;
- confidence, novelty and wow self-assessment;
- risk codes (small enumerated set).

Self-assessment is advisory and never trusted as proof of quality.

## 6. Creative spread

The three final directions must not be cosmetic variations.

They should differ materially on at least two of:

- template family;
- visual direction/archetype;
- emotional thesis;
- photo use;
- accent/palette treatment;
- copy cadence/structure;
- signature move.

Hard rule: max one selected direction per template family.

## 7. Recent-style freshness

CardeLume stores only compact, non-content style fingerprints for recent selections/purchases. Do not store recipient name, message copy or photo in style memory.

A fingerprint may include:

- template family ID;
- template/version ID;
- visual direction;
- archetype;
- accent mode when known;
- source;
- timestamp.

Recent fingerprints create a **soft novelty penalty**, not a ban.

Explicit user intent such as “same style as last time” overrides novelty.

When history exists and the brief does not request repetition, at least two of three proposed directions should be meaningfully fresh where the eligible catalog permits it.

## 8. Controlled creativity

AI never emits CSS/SVG/layout code or arbitrary renderer parameters.

Creative controls are allowlisted. Step 13 initially uses existing trusted controls such as:

- template/version selection;
- `accentMode`: `original | photo | navy | sage | rose`;
- copy structure/cadence via generated text;
- approved `signatureMove` enum.

Future template-version-specific creative controls may be added only after renderer QA and immutable versioning.

## 9. Signature moves

Initial approved semantic signature moves:

- `recipient_anchor`
- `quiet_opening`
- `isolated_closing_line`
- `keepsake_memory`
- `understated_celebration`
- `editorial_contrast`

These describe creative intent. They do not grant AI new renderer capabilities.

## 10. Deterministic quality gate

Local validation checks at minimum:

- schema and candidate identity;
- 3 unique template families;
- copy-density/Magic Typography safety;
- HTML/SVG/script injection rejection;
- headline/body repetition;
- excessive exclamation/punctuation;
- generic/cliché phrase concentration;
- near-duplicate directions;
- invalid photo/accent combination;
- excessive similarity to recent style history where avoidable.

The gate does not judge artistic beauty alone; it detects measurable failure/risk.

## 11. Conditional critic

A critic/repair call is permitted only when a trigger fires, e.g.:

- candidate expansion requested;
- selected directions too similar;
- copy gate fails;
- confidence/wow below configured threshold;
- repeated regeneration;
- market/brief conflict risk.

The critic receives only the compact brief, proposed directions and failure/risk context. It does not receive the entire template catalog or full system documentation.

Repair only failed directions/fields when possible. Do not regenerate all three by default.

## 12. Economics without quality sacrifice

Cost is optimized through:

- 8-candidate context instead of full catalog;
- one premium structured creative call normally;
- conditional second call only when needed;
- compact style history;
- no repeated vision analysis;
- response-size limits;
- AI usage/cost ledger;
- prompt budget tests;
- deterministic quality checks before critic calls.

Do **not** save money by replacing the core Creative Director with a low-quality model.

## 13. Privacy and retention

Style fingerprints are pseudonymous operational personalization data tied to the existing server-side user/session ID. They contain no card text or image data.

Default retention must be bounded and configurable. The initial recommendation is 180 days for style fingerprints and 30 days for detailed AI usage records, with aggregated operational metrics retained longer if desired.

## 14. Failure behavior

- Catalog/ranking unavailable: existing curated Step 4 fallback remains available.
- AI provider unavailable/timeout: existing premium curated fallback remains available.
- AI returns candidate not supplied: reject/fail the generation attempt; never trust invented template IDs.
- Critic fails: retain original result only if deterministic gates pass; otherwise use curated fallback.
- Style history unavailable: generation continues without personalization history.

## 15. Definition of Done

Step 13 is complete when:

- hard filter remains authoritative;
- 6+2 pack is deterministic and diverse;
- AI chooses from supplied candidate versions and may request expansion;
- 3 outputs include creative thesis, signature move and approved accent mode;
- recent style history influences novelty without storing content;
- local quality gate and conditional targeted repair exist;
- AI calls have usage/latency/cost accounting where provider reports usage;
- Step 6–12 regressions still pass;
- no full-catalog prompt or default multi-agent chain is introduced.

## 16. Semantic-engine error containment

Hard eligibility must remain objective/technical. Feeling, occasion, market affinity, performance and novelty are **soft scores only** and must not remove an otherwise render-compatible template.

The normal pack uses 6 fit + 2 creative wildcards. The bounded expansion pool uses approximately 75% strong-fit candidates and 25% high-editorial exploration candidates selected for creative distance. This gives the AI a recovery path when a deterministic soft score is wrong without allowing unsafe templates through hard constraints.


## 17. Critic authority: targeted reconsideration, not unrestricted redesign

The critic has two modes:

### Copy/control repair

For copy, confidence, wow, novelty or market-tension risk without a creative-range failure:

- template ID/version is immutable;
- critic may repair thesis/copy and choose only allowlisted controls for that same version;
- no template swap is allowed.

### Creative-range reconsideration

When the local gate detects inadequate spread, CardeLume may first enlarge the compatible candidate pool. The critic may then replace a risky direction with another **server-supplied immutable candidate pair**.

Even in this mode:

- every selected pair must be in the supplied pool;
- template families must remain unique;
- exact template/version pairs must remain unique;
- photo/accent compatibility still applies;
- renderer/security hard constraints remain non-overridable.

This is the escape hatch for a soft ranker or first-pass AI selection that is technically valid but creatively too similar.

## 18. Premium fail-closed after critic

A successful critic call is not automatically accepted. CardeLume runs the local quality gate again.

The result fails closed to the existing curated fallback if material premium risks remain, including:

- `creative_range`;
- `copy_risk`;
- `low_confidence` below configured threshold;
- `low_wow` below configured threshold.

Novelty is intentionally softer: strong fit may legitimately repeat a style, so low novelty by itself is not a mandatory failure after repair.

Initial configurable thresholds:

```text
AI_WOW_REPAIR_THRESHOLD=0.70
AI_CONFIDENCE_REPAIR_THRESHOLD=0.62
AI_NOVELTY_REPAIR_THRESHOLD=0.50
```

These are trigger/guardrail thresholds, not proof that a direction is beautiful.

## 19. Expansion critique continuity

If the first Creative Director requests `expand_pool`, its compact `reasonCode` and `desiredTraits[]` are passed into the expanded-pool review. The deterministic ranker does not attempt to semantically interpret free-form desired traits. The premium AI reviews the broader safe pool using its own prior critique.

This prevents the engine from mechanically second-guessing a creative objection while keeping the expansion bounded and auditable.

## 20. Photo creative authority

Photo upload is an input, not a command to use Photo Story.

- Objective image analysis produces a compact `photoProfile`; the default creative prompt does not resend image bytes.
- Hard template `photoMode` remains authoritative.
- AI may choose no-photo directions even when a photo exists.
- AI may use `accentMode=photo` only when a trusted photo exists and the selected template supports photo use.
- If a template requires photo, checkout/final rendering requires the trusted bound asset.

This lets AI decide whether the image strengthens the emotional thesis rather than applying a mechanical `hasPhoto => photo template` rule.

## 21. Anti-sameness rule

CardeLume optimizes for **best for this person and this moment**, not the globally most-converting template.

Recent style memory is deliberately small and content-free. It informs both the soft ranker and Creative Director. It must never become a hard exclusion unless a future explicit product requirement says so.

No covert cross-device fingerprinting is permitted. Without an account/recovery identity continuity, CardeLume does not pretend to remember a user across unrelated devices.

## 22. Maximum AI call budget

Normal path:

```text
1 premium creative-director call
```

Conditional paths can add:

```text
+1 expanded-director call (only when the first AI explicitly objects to range)
+1 critic/reconsideration call (only when the deterministic premium gate detects risk)
```

Therefore the bounded worst-case orchestration is three premium calls. There is no unbounded self-reflection loop, no default multi-agent chain, and no three-independent-calls-for-three-directions pattern.

Premium quality wins over call count, but every additional call must be justified by a concrete risk/critique trigger.
