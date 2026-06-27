# CLAUDE.md — Working conventions for Grimorio

Guidance for any AI assistant or contributor working in this repo. Keep changes
consistent with what's here. Companion docs: `README.md` (architecture),
`SPEC.md` / `DESIGN_SPEC.md` (product + design), `DEPLOY.md` (hosting/CI).

Grimorio is a real-time D&D 5e (2024 / SRD 5.2) virtual tabletop with persistent
accounts, campaigns, character sheets, and live combat — built around a
**server-authoritative, role-based visibility** guarantee.

## Stack & layout

- **pnpm monorepo** (`pnpm-workspace.yaml`): `shared`, `backend`, `frontend`. Node **>=20**, pnpm **10**.
- **shared** — zod command schemas + wire DTOs (the contract between client and server).
- **backend** — Fastify + `@fastify/websocket` + `@fastify/cookie` + `@fastify/cors`, Postgres (`postgres.js`), argon2, Vitest.
- **frontend** — React 18 + Vite + Vitest (jsdom) + Testing Library; router-less, state-based navigation in `app.tsx`; design system in `frontend/src/design`.

## Architecture & boundaries (backend)

Hexagonal / clean architecture, **enforced by an ESLint `import/no-restricted-paths` rule** — do not import across layers the wrong way:

- `domain/**` — pure domain: no I/O, no Node builtins. Owns `Rng`/`Clock` ports, dice, 5e rules, visibility projection.
- `application/**` — use cases (command handlers) + repository/SRD ports.
- `infra/**` — port adapters (Postgres, in-memory, WS broadcaster).
- `transport/**` — Fastify HTTP routes + WebSocket gateway, composition root (`wiring.ts`, `buildServer.ts`, `main.ts`).

If a domain module needs something from a lower layer, the dependency is inverted through a port — never import `application`/`infra` from `domain`.

## Core invariants (do not break these)

- **Role-based visibility is the product.** The server projects every snapshot per-viewer (`domain/visibility/project.ts`); a **player must never receive `dm_only` data** (hidden monster HP, DM notes, hidden rolls). When touching snapshots/projection, keep this guarantee and its tests green.
- **Server-authoritative.** The client sends *intent + notation* only; the server rolls dice and computes 5e derived stats. Never trust client-supplied results.
- **Commands are a zod discriminated union on `type`.** WS clients send full commands; **HTTP routes inject `type` server-side via `withType()`** (REST bodies carry only data fields). Validate at the transport boundary before any handler runs.
- **Role is resolved per-campaign**, never carried in the session cookie (which holds identity only).

## Conventions

- **TDD with Vitest.** Add/keep tests for behavior changes. Run **`make check`** (typecheck + test + lint) before committing.
- **Match surrounding style.** Code and comments in **English**; user-facing UI strings in **Spanish**. Comments explain *why*, not *what*.
- **CSS is tokens-only** in the design system (`design/tokens.css` → `components.css`); no magic values — reference custom properties.
- **Postgres vs memory:** repos use Postgres when `DATABASE_URL` is set, else in-memory adapters (dev/tests). Migrations live in `infra/postgres/migrations/` and run **idempotently on boot**; add new ones to the ordered list in `migrate.ts`.
- **Commits/pushes:** only when asked. Branch off `main` for new work. Keep commits scoped with a clear message.

## Security rules (the repo is PUBLIC)

- **Never commit secrets.** `.gitignore` excludes `.env` / `.env.*` (only `.env.example` is tracked). No keys, tokens, connection strings, or `.pem`/`.key` files in git — ever.
- **Where secrets live:** `DATABASE_URL` and `SESSION_SECRET` only in **Render** env vars (server-side). Render **Deploy Hook** URLs only in **GitHub → Secrets** (used by the Action). Never in the repo.
- **Frontend is public by nature.** Vite **inlines `VITE_*` vars into the public bundle** — only ever put **public URLs** there (`VITE_API_URL`). Never a secret in a `VITE_` variable.
- **Session cookie:** `httpOnly` (JS can't read it) + `Secure` + `SameSite=None` in production (auto-enabled by `NODE_ENV=production`; override via `COOKIE_SAMESITE`/`COOKIE_SECURE` only if co-hosting front+back on one domain).
- **Fail-closed config:** `assertSafeForProduction` (in `config.ts`) refuses to boot in production with the default `SESSION_SECRET` or a wildcard `CORS_ORIGIN`. Keep it. `CORS_ORIGIN` must be the explicit frontend origin in prod.
- **Don't paste real secrets** into chat, PRs, commits, or logs. Generate with `openssl rand -hex 32`. If a secret ever leaks, **rotate it** (it stays in git history) rather than just deleting the line.

## Deploy & CI

- **Hosting (free + persistent):** **Neon** (Postgres, persistent across sessions) + **Render** (backend Docker web service + frontend static site). Full steps in `DEPLOY.md`.
- **CI/CD:** `.github/workflows/deploy.yml` runs typecheck + tests + lint + frontend build on push to `main`, and **only on green** triggers the Render deploy hooks. Render's own auto-deploy is turned **off** so deploys are gated by CI.
- Frontend ↔ backend talk cross-origin: set `VITE_API_URL` (frontend, build-time) and `CORS_ORIGIN` (backend) to the exact deployed origins. WS URL derives from `VITE_API_URL` (`https`→`wss`).

## Decision log (notable choices)

- **`updateCharacter` does not enforce point-buy.** The wizard's 4d6 / standard-array path creates with `method:'roll'` then PATCHes scores that can legally exceed point-buy (e.g. a 17). Only `createCharacter` with `method:'buy'` enforces a legal 27-point buy.
- **HTTP PATCH body *is* the patch** (`withType` wraps it as `{ characterId, patch }`). `CharacterCorePatch` includes `attacks`, `inventory`, `spells` so equip/inventory persist.
- **CORS allows `PATCH`/`PUT`/`DELETE`** explicitly (the wizard PATCHes) — a missing method silently breaks the browser with a "CORS error".
- **Dice are real 3D** (three.js polyhedra with numbered faces), lazy-loaded into a separate chunk so the main bundle stays small; jsdom-guarded so tests don't need WebGL.
- **Player combat:** every character has a basic "Golpe sin armas" attack; chosen spells resolve (via the SRD spell list) into the action economy; weapons come from a catalogue (`GET /srd/weapons`) and equipping one adds both a weapon attack and an equipped inventory item (shared id, removed together).
- **DM tooling:** can view any player's sheet (`📜`) and invite from the live table.
- **Dev hygiene:** run a single backend (`:3000`) and a single frontend (`:5173`) — stale duplicate Vite instances serve old bundles and cause confusing "it still fails" reports.
