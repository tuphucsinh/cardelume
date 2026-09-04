ARG NODE_IMAGE=node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/card-schema/package.json packages/card-schema/package.json
COPY packages/templates/package.json packages/templates/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/renderer/package.json packages/renderer/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=deps /app/packages/card-schema/node_modules /app/packages/card-schema/node_modules
COPY --from=deps /app/packages/templates/node_modules /app/packages/templates/node_modules
COPY --from=deps /app/packages/ui/node_modules /app/packages/ui/node_modules
COPY --from=deps /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=deps /app/packages/core/node_modules /app/packages/core/node_modules
COPY --from=deps /app/packages/storage/node_modules /app/packages/storage/node_modules
COPY --from=deps /app/packages/queue/node_modules /app/packages/queue/node_modules
COPY --from=deps /app/packages/renderer/node_modules /app/packages/renderer/node_modules
COPY . .
RUN pnpm --filter @cardelume/web build

FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production
ENV RENDER_REQUIRE_DETERMINISTIC_FONTS=true
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      fonts-ebgaramond=0.016+git20210310.42d4f9f2-1 \
      fonts-lato=2.0-2.1 \
      fonts-noto-cjk=1:20220127+repack1-1 \
      fontconfig \
 && test -s /usr/share/doc/fonts-ebgaramond/copyright \
 && test -s /usr/share/doc/fonts-lato/copyright \
 && test -s /usr/share/doc/fonts-noto-cjk/copyright \
 && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 10001 cardelume
COPY --from=build --chown=cardelume:cardelume /app/apps/web/.next/standalone ./
COPY --from=build --chown=cardelume:cardelume /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=cardelume:cardelume /app/apps/web/public ./apps/web/public
USER cardelume
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
