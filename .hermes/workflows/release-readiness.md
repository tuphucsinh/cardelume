# Release Readiness Workflow

Use the consolidated governance tiers instead of replaying Step-specific command lists.

```text
meaningful change → check:fast
release candidate → check:release
controlled runtime → check:heavy + Step18 service E2E
owner decision → production approval/deploy
```

Commands:

```bash
npm run check:fast
npm run check:release
npm run check:status
# On dependency-ready controlled runtime:
npm run check:heavy
```

A missing mandatory gate is `NO_GO`. `SOURCE PASS` never means production permission.
