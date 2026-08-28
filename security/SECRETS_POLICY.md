# Secrets Policy — Step 17B

- Secrets live in runtime/profile-local secret storage, never repository Markdown, SOUL, skills or intentional prompt/history.
- `.env.example` contains names and safe defaults only; actual `.env*` files remain ignored.
- Production, staging and experiment secrets are distinct and scope-validated.
- Prefer provider-scoped/least-privilege credentials; do not reuse broad account keys when narrower credentials exist.
- Do not print secrets, authorization headers, signed recovery URLs or webhook signatures to logs.
- Rotate a credential after suspected disclosure, operator offboarding, privilege change, or provider-required event; record evidence without the secret value.
- Lumer may audit secret names/scope/age metadata when available but may not reveal or persist secret values.
- Production secret rotation is owner-approval gated.
