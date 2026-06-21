# Grimorio backend image.
#
# Build context MUST be the repo root (pnpm workspace), e.g.:
#   docker build -f backend/Dockerfile -t grimorio-backend .
#
# We run the TypeScript entrypoint directly via `tsx` (no separate compile
# step) — matches `pnpm -C backend dev/start` locally, keeps the image simple,
# and `pnpm -C backend run build` (tsc --noEmit) is the type-check gate run in
# CI before deploy.
FROM node:20-slim AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Install dependencies first (cache-friendly): copy only the manifests needed
# to resolve the workspace graph for backend + its workspace deps (shared).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json
COPY frontend/package.json frontend/package.json

RUN pnpm install --frozen-lockfile

# Now copy the actual source.
COPY shared ./shared
COPY backend ./backend

# Build-time sanity check: fail the image build if types don't check.
RUN pnpm -C backend run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "-C", "backend", "start"]
