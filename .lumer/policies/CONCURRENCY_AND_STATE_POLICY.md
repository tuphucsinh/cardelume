# Lumer Concurrency & State Policy

One active independent agent process should own the same Lumer profile state at a time. Do not run two independent agents against `~/.hermes/profiles/lumer/` concurrently.

Parallel work should use independent temporary profiles or delegated tools/worktrees that do not concurrently mutate Lumer profile memory/session state. Repository work may be parallelized through normal branch/worktree isolation and explicit merge review.
