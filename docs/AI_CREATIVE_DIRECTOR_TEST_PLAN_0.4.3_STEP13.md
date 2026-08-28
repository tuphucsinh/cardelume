# CardeLume Step 13 — Quality & Economics Test Plan

## Candidate engine

- hard-incompatible candidates never appear;
- normal launch catalog returns 6 fit + 2 wildcards when inventory permits;
- wildcard editorial score floor enforced;
- no duplicate template in pack;
- recent family is penalized but remains eligible;
- deterministic result for same catalog/input/history.

## Creative Director

- may select lower-ranked candidate;
- cannot select candidate outside pool;
- cannot mix template ID with another version;
- selected families are unique;
- may request one bounded expansion;
- second expansion fails closed;
- output copy satisfies CardDocument density guard;
- generated markup/URL/code rejected.

## Photo creative decision

With uploaded photo:

- AI may select Photo Story;
- AI may choose three no-photo templates;
- actual photo asset is attached only when selected template `photoMode=required`;
- `accentMode=photo` requires trusted photo asset/palette;
- non-photo managed template rejects attached photo asset.

## Freshness

- recent same family lowers soft score;
- different family/style receives more opportunity;
- no content fields appear in style memory;
- history unavailable does not fail generation.

## Quality gate

Trigger cases:

- high copy similarity;
- excessive exclamation;
- typography hard overflow;
- low self-reported confidence/wow;
- explicit provider risk code.

Verify normal quality path uses no critic call.

## Economics

- prompt byte budget enforced;
- no full catalog in creative call;
- normal path exactly one premium call;
- expansion path maximum one additional director call;
- critic path conditional and targeted;
- provider usage tokens captured when available;
- no raw prompt/copy saved in usage table.


## Expansion / self-critique continuity

- first AI can request `expand_pool` with reason + desired traits;
- expanded pool remains hard-compatible and <=16;
- pool contains fit plus exploration, not merely top-N duplicates;
- reason + desired traits are carried into the second Creative Director call;
- a second expansion request fails closed.

## Critic reconsideration

- copy-only risk cannot change template/version;
- `creative_range` risk may swap a risky direction only to a supplied candidate pair;
- invented pair, mismatched version, duplicate exact pair or duplicate family is rejected;
- critic controls remain within the chosen template recipe;
- post-critic gate runs again;
- persistent range/copy/low-wow/low-confidence risk fails to fallback.

## Premium thresholds

Exercise configured defaults and overrides for:

- `AI_WOW_REPAIR_THRESHOLD`;
- `AI_CONFIDENCE_REPAIR_THRESHOLD`;
- `AI_NOVELTY_REPAIR_THRESHOLD`.

These thresholds trigger review; they are not treated as objective beauty scores.
