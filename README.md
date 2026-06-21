# Grimorio

Real-time D&D 5e (2024 / SRD 5.2) virtual tabletop with server-side role-based
visibility, persistent accounts and campaigns, full 5e character sheets, and live
combat. See `SPEC.md` and `DESIGN_SPEC.md` for the product and design specs, and
`docs/superpowers/plans/2026-06-21-grimorio-v1.md` for the implementation plan.

## Architecture

Hexagonal / clean architecture (backend), enforced by an ESLint boundary rule:

- `backend/src/domain/**` — pure domain (no I/O, no Node builtins).
- `backend/src/application/**` — command handlers + ports.
- `backend/src/infra/**` — port adapters (Postgres, WS broadcaster).
- `backend/src/transport/**` — Fastify HTTP + WebSocket.
- `shared/**` — zod wire schemas + DTOs shared by backend and frontend.
- `frontend/**` — React + Vite client (Wave 4).

## Workspace layout

pnpm workspace with `shared`, `backend`, `frontend`.

```sh
pnpm install        # install all workspaces
pnpm test           # run tests across workspaces
pnpm lint           # eslint (incl. clean-arch boundary rule)
pnpm typecheck      # tsc --noEmit across workspaces
```

## Running the backend

```sh
pnpm -C backend dev      # tsx watch src/transport/main.ts, in-memory adapters by default
pnpm -C backend start    # same entrypoint, no watch (used by the Docker image)
pnpm -C backend run build  # tsc --noEmit type-check gate (no compiled output)
```

Config is read from the environment (`backend/src/config.ts`):

| Var              | Default                          | Notes                                              |
| ---------------- | --------------------------------- | --------------------------------------------------- |
| `PORT`           | `3000`                            |                                                       |
| `DATABASE_URL`   | unset                             | When set, boots against Postgres (migrates on boot). Unset → in-memory repos. |
| `SESSION_SECRET` | `dev-insecure-secret-change-me`   | **Must** be overridden in any deployed environment.  |
| `COOKIE_NAME`    | `grimorio_session`                |                                                       |
| `CORS_ORIGIN`    | `*`                                | Set to the deployed frontend origin in production.   |

The composition root lives in `backend/src/transport/`: `wiring.ts` (`buildDeps`)
picks Postgres vs. in-memory adapters from `config.databaseUrl`, `buildServer.ts`
wires both transports + cross-cutting plugins onto one Fastify instance, and
`main.ts` is the process entrypoint.

## Deploying (Neon/Supabase + Render)

1. **Database**: create a free Postgres instance on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) and copy its connection string (use the
   `sslmode=require` pooled URL Neon/Supabase give you). Migrations
   (`backend/src/infra/postgres/migrations/`) run automatically on boot — no
   separate migrate step needed.
2. **Render**: this repo includes a `render.yaml` Blueprint (`backend/Dockerfile`,
   repo root as build context). Connect the repo on Render, or run
   `render blueprint launch`, then in the service's Environment tab set:
   - `DATABASE_URL` — the Neon/Supabase connection string from step 1.
   - `SESSION_SECRET` — a long random value (e.g. `openssl rand -hex 32`).
   - `CORS_ORIGIN` — the deployed frontend's origin.

   Render's free web service plan sleeps on idle; `GET /health` is wired as
   the health check path.

## Status

Wave 0 (foundation) complete: scaffold, tooling, domain types, ports, wire schemas.
Waves 1–3 (domain/application/infra, HTTP + WS transports) complete. This wave
wires concrete adapters into the transports (composition root) and adds the
deploy setup above. Frontend (Wave 4) next.
