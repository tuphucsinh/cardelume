# Lumer Bootstrap Runbook v1

## Objective

Create the dedicated Hermes profile **Lumer** on the Raspberry Pi 5 without mixing unrelated Hermes memory, secrets or sessions into the CardeLume operating context.

## 1. Preconditions

- Hermes Agent installed and updated on Pi5.
- CardeLume repository checked out in its intended persistent path.
- Production secrets are not stored in git.
- Owner knows the Lume workspace root path.

## 2. Create the profile

Recommended CLI slug is lowercase `lumer`; the human identity remains **Lumer**.

```bash
hermes profile create lumer
lumer config set terminal.cwd <LUME_WORKSPACE_ROOT>
```

Do not clone an unrelated personal/default profile unless there is a deliberate reviewed reason.

## 3. Install SOUL

Copy/adapt `LUMER_SOUL_TEMPLATE.md` into the Lumer profile's `SOUL.md`.

Never copy API keys, database URLs, recovery secrets or payment credentials into SOUL.

## 4. Configure secrets locally

Use the Lumer profile's local environment/config setup. Keep staging and production credentials separate and least-privilege.

Recommended categories:

- research/public APIs;
- read-only project/monitoring credentials;
- staging-only credentials;
- production credentials exposed only to narrow approved operations.

Do not give the general interactive profile a broad production database superuser credential.

## 5. Trust CardeLume project skills

After `.hermes/skills/` exists in the repository, launch Hermes inside the CardeLume git checkout and explicitly trust the project skills:

```bash
cd <CARDELUME_REPO>
hermes skills trust
```

Review the skills before first trust and after security-sensitive changes.

## 6. Shared Lume skills

Cross-project skills may live in a shared version-controlled repository configured as an external skill directory. Project-local CardeLume skills retain precedence when names overlap.

Do not assume an external skill directory is read-only merely because it is external; enforce filesystem permissions if immutability is required.

## 7. Create operating bundles

After skills are installed, create profile bundles equivalent to:

- `lume-daily`;
- `lume-template`;
- `lume-release`;
- `lume-research`;
- `lume-incident`;
- `lume-benchmark`.

Keep canonical bundle definitions/templates under project/shared version control and install/sync them into the Lumer profile.

## 8. Configure default model policy

The exact model/provider may change. The config must preserve the policy:

- strongest practical reasoning/coding model for important project work;
- premium creative/visual model where quality review needs it;
- cheaper models only for low-risk classification/summarization/offline work;
- never silently route final CardeLume premium creative judgment to a weaker model solely for cost.

## 9. First validation session

Ask Lumer to:

1. identify CardeLume source-of-truth docs;
2. report current Step 13 implementation status versus V7 planned work;
3. run read-only project health/source checks;
4. verify it understands the authority matrix;
5. verify it will not deploy production without approval;
6. list available project-local Lume/CardeLume skills;
7. produce a Step 14 implementation plan only.

No production writes during bootstrap validation.

## 10. Concurrency

Do not run two independent Lumer agents against the same profile state concurrently. If parallel work is needed, use separate temporary profiles or delegate tools that do not share/write the same Hermes profile memory/state.

## 11. Backup/recovery

Back up non-secret Lumer operating configuration/policies as appropriate. Treat `.env` and credential stores separately under a secure secrets backup process. Do not package secrets into project handoff archives.
