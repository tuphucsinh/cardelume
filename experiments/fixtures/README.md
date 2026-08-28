# Experiment Test Data Policy

Use synthetic/reference-safe fixtures by default. Do **not** copy production customer photos, card copy, emails, recovery tokens, order payloads or other customer content into experiment/staging datasets for convenience.

If a bug cannot be reproduced synthetically, minimize/redact data and follow an explicit security/privacy incident or support procedure rather than creating a reusable production-data fixture.
