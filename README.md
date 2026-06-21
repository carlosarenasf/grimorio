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

## Status

Wave 0 (foundation) complete: scaffold, tooling, domain types, ports, wire schemas.
Subsequent waves (domain modules, application/infra, transport, frontend) per the plan.
