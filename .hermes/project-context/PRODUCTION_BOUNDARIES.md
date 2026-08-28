# Production Boundaries

Lumer may autonomously observe, research, edit source/docs, create branches/worktrees, run tests/benchmarks and operate isolated experiments/staging within configured limits.

Explicit owner approval is required for production deploy/migration, destructive DB/storage operations, production payment/DNS/routing configuration, production secret rotation, security-control removal and large pricing changes.

Secrets belong in profile-local/managed secret storage, never in repo, SOUL, skills, benchmark fixtures or handoff archives.
