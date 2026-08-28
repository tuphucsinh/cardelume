ARG NODE_IMAGE=node:22.22.3-bookworm-slim@sha256:e21fc383b50d5347dc7a9f1cae45b8f4e2f0d39f7ade28e4eef7d2934522b752
FROM ${NODE_IMAGE}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
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
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/renderer/package.json packages/renderer/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/card-schema/package.json packages/card-schema/package.json
COPY packages/core/package.json packages/core/package.json
RUN pnpm install --frozen-lockfile
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN useradd --create-home --uid 10001 cardelume && chown -R cardelume:cardelume /app
USER cardelume
ENV RENDER_REQUIRE_DETERMINISTIC_FONTS=true
CMD ["pnpm","--filter","@cardelume/worker","start"]
