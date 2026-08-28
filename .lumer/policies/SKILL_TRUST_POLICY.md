# Project Skill Trust Policy

1. `.hermes/skills/` is version controlled and reviewed like source code.
2. Review all skills before first `hermes skills trust` and after security/authority-sensitive changes.
3. Trusting a skill does not override `.lumer/policies/AUTHORITY_MATRIX.md`.
4. Agent-authored skill changes should remain proposals/branches until reviewed when they affect production, security, payments, data, IP or release gates.
5. Never embed credentials, tokens, private keys, customer content or secret endpoints in skills.
6. Shared Lume skill directories must use filesystem permissions if read-only behavior is required.
