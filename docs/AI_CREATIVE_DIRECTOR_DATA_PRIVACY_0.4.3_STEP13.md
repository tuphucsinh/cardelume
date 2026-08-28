# CardeLume Step 13 — Personalization Memory, Privacy & Retention

## Style fingerprint purpose

Prevent accidental repetitive design experiences while avoiding storage of personal card content.

## Stored fields

`style_fingerprints` stores only:

- pseudonymous existing CardeLume user/session UUID;
- template ID/version;
- template family;
- visual direction;
- approved accent mode when known;
- source (`selected`, `checkout`, `paid`);
- dedupe/source key;
- timestamp.

It does **not** store:

- recipient name;
- relationship details beyond what already exists elsewhere;
- user message/detail;
- generated headline/body/kicker;
- photo bytes/URL/object key;
- face data;
- payment data.

## Usage

Only recent, bounded fingerprints are loaded into generation. AI receives an even smaller form: family, visual direction, accent mode. Template/user IDs do not need to be interpreted semantically by the model.

## Novelty behavior

History creates a soft penalty and compact AI instruction, not a blacklist. Strong current intent may reuse a style. Explicit user desire to repeat a prior style wins.

## Retention

- default style fingerprint retention: 180 days;
- configurable `STYLE_FINGERPRINT_RETENTION_DAYS`;
- cleanup job deletes expired rows;
- AI usage detailed records default 30 days;
- raw prompts are never written to AI usage ledger.

## Pseudonymous identity limitations

Without an account, cross-device recognition is not promised. CardeLume must not introduce covert device fingerprinting to recreate style history.
