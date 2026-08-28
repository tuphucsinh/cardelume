# Root public directory note

CardeLume is a monorepo. Runtime web public assets belong under `apps/web/public/` and should remain there so Next.js resolves them correctly.

This root `public/` directory exists only to satisfy the generic Hermes project scaffold without moving or duplicating application assets.
