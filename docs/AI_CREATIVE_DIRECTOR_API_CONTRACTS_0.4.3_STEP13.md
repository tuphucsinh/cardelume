# CardeLume Step 13 — AI Creative Director API / Internal Contracts

## Public API compatibility

Step 13 does not add a new public generation endpoint. It upgrades the existing durable flow:

```text
POST /api/generate
GET  /api/generate/:jobId
```

Existing anonymous-session, pricing capability, HMAC status token, rate limit and no-store rules remain authoritative.

## `POST /api/generate`

`GenerationBrief` adds optional compact `photoProfile`:

```ts
photoProfile?: {
  orientation: "portrait" | "landscape" | "square";
  temperature: "warm" | "cool" | "balanced";
  luminance: number;          // 0..1
  paletteConfidence: number;  // 0..1
  softened: boolean;
}
```

No image bytes, URL, object key, face identity or EXIF is sent to the AI generation API.

Market for generation is pinned to the signed pricing quote rather than trusting a market change between page load and generation.

## Durable worker internal contract

1. Load `GenerationBrief` from authoritative DB job.
2. Load managed template catalog.
3. Load up to 5 recent content-free style fingerprints for the job owner.
4. Build rank input and 6+2 candidate pack.
5. Call premium Creative Director.
6. Optionally expand to <=16 compatible candidates once.
7. Run local quality gate.
8. Optionally call targeted critic once.
9. Persist final `GenerationResult`.
10. Persist privacy-safe template events and AI usage telemetry.

## Creative Director output

Each of exactly three directions contains:

```ts
{
  id: "editorial" | "midnight" | "photo" | "quiet"; // legacy UI slot identity
  templateId: UUID;
  templateVersionId: UUID;
  templateName: string;
  visualDirection: string;
  photoMode: "none" | "optional" | "required";

  creativeThesis: string;
  signatureMove:
    | "recipient_anchor"
    | "quiet_opening"
    | "isolated_closing_line"
    | "keepsake_memory"
    | "understated_celebration"
    | "editorial_contrast";
  accentMode: "original" | "photo" | "navy" | "sage" | "rose";

  kicker: string;
  headline: string;
  body: string;

  confidence: 0..1;
  noveltyScore: 0..1;
  wowScore: 0..1;
  riskCodes: string[];
}
```

### Important legacy-slot rule

`id="photo"` is now only a stable three-card UI slot name when a photo exists; it is **not** authority that a photo must be used. Actual photo requirements come from the selected managed template's `photoMode`.

This allows AI to veto Photo Story when the uploaded photo is not the strongest premium direction.

## Candidate identity enforcement

Provider output is accepted only if all three `(templateId, templateVersionId)` pairs exist in the server-supplied candidate pool and belong to distinct template families.

AI cannot invent, upgrade, downgrade or swap immutable versions.

## Candidate expansion

AI may return:

```json
{
  "action": "expand_pool",
  "reasonCode": "insufficient_creative_range",
  "desiredTraits": ["warm-modern", "less-formal"]
}
```

Server may then provide an expanded compatible pool (max 16). Approximately 75% is strong-fit and 25% is high-editorial creative exploration when inventory permits. The first AI critique (`reasonCode` + `desiredTraits`) is carried into the second review. A second expansion request is rejected as insufficient creative range; there is no unbounded loop.

## Quality gate / critic

Critic is called only on configured risk triggers. It receives risky directions only.

- For ordinary copy/control repair, template/version remains immutable.
- When `creative_range` is present, the server may supply the expanded compatible pool and explicitly permit the critic to replace a risky direction. Any replacement must be one exact supplied template/version pair and must preserve unique families/exact pairs.

A critic suggestion for an accent/signature move outside the selected template recipe is ignored/replaced by the trusted recipe value. The local premium gate runs again after repair; unresolved critical quality risk fails closed rather than being returned to Studio.

## Error semantics

Provider/internal errors continue to normalize through Step 4 fallback behavior. Browser does not receive provider internals.
