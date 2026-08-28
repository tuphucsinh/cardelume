# Optional Lume Account Specification v1

## 1. Decision

**Yes, plan an optional loyalty account — but do not make it a launch dependency or mandatory funnel step.**

Core CardeLume remains:

```text
no account required
→ create
→ choose
→ pay
→ recover/download securely
```

Account is an enhancement after core premium quality and commerce E2E are proven.

## 2. Customer value

Optional account may provide:

- My Cards / paid purchase history;
- easier cross-device recovery/download;
- favorite template families/styles;
- preferred language/market defaults;
- opt-in style memory for better novelty/personalization;
- explicit "use something like this again" and "surprise me" controls.

## 3. Authentication

Prefer passwordless initially (for example Supabase magic link/OTP) rather than introducing a password database unless needed.

Requirements:

- short-lived/one-time auth links/tokens;
- rate limiting and abuse protection;
- secure session rotation;
- no account enumeration;
- safe redirect/return handling;
- session revoke/logout.

## 4. Claiming anonymous purchases

Do not attach purchases to an account merely because the user typed the same email.

Claim requires a proof tied to an existing entitlement, such as a valid paid recovery capability/session or a one-time signed claim flow.

## 5. Style memory

Two distinct concepts:

### Purchase history
Can be part of account functionality under the service terms/privacy notice.

### Creative preference memory
Must be **explicit opt-in**:

> Remember my style for future cards.

Store compact preferences/fingerprints, not raw historical card copy/photos by default.

Possible fields:

```text
favorite families
preferred visual archetypes
preferred feeling range
preferred photo use
recent style fingerprints
explicit dislikes
novelty preference
```

## 6. User controls

Provide:

- view style preferences;
- reset creative memory;
- disable future memory;
- "Surprise me" per generation;
- delete account/data subject to required transactional/legal retention;
- export relevant account data where legally required/appropriate.

## 7. AI prompt usage

Compress account memory into a tiny, explainable profile, for example:

```text
Preference: warm, restrained, editorial.
Recent: ivory/no-photo; sage/photo.
Avoid repeating recent quiet-ivory unless current brief strongly favors it.
User asks for more novelty today.
```

Do not feed entire purchase messages/photos into the Creative Director by default.

## 8. Privacy / retention

Separate:

- legally/transactionally necessary order records;
- downloadable artifact retention;
- optional creative preferences;
- analytics.

Document retention and deletion for each. Account deletion must not corrupt accounting/chargeback/legal obligations; use appropriate de-identification or retained minimum records where required.

## 9. Security

Account adds a meaningful attack surface. Before enabling:

- threat model;
- auth rate limits;
- session/authz tests;
- account linking tests;
- recovery/claim replay tests;
- privacy controls;
- RLS policies;
- audit/logging without sensitive leakage.

## 10. Rollout

Implement behind a feature flag:

```text
OFF
→ internal/staging
→ invited/opt-in users
→ soft production rollout
```

Do not delay core launch merely to add account functionality unless real customer evidence changes the priority.
