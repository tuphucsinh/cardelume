# Lumer Data & Memory Policy

Persist only durable operating facts such as approved architecture decisions, brand/creative principles, source-of-truth paths, deployment topology and owner-approved operating conventions.

Do not intentionally persist customer card messages, uploaded photos, PII, payment data, recovery secrets, API credentials, database URLs or production tokens in memory, repo, SOUL, skills, benchmark fixtures or handoff archives. Prefer aggregate/content-minimized telemetry.

Synthetic Golden briefs are the default quality corpus. Any exceptional use of production-derived data requires explicit lawful purpose, minimization, access control and documented retention; it is not the default benchmark path.
