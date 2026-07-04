/**
 * Boot-level smoke test: builds the real composition (`buildServer`) over
 * injected in-memory deps and drives it with `app.inject`, the same way
 * `main.ts` would build it over real adapters. This is the one place that
 * checks the cross-cutting plugins (cookie, CORS, websocket upgrade) and both
 * transports are actually wired onto a single Fastify instance.
 */
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { buildServer, type ServerDeps } from './buildServer.js';
import { makeInMemoryRepos, FakeClock, FakeHasher, SeededRng } from '../testing/index.js';
import { StaticSrdProvider } from '../domain/srd/index.js';
import type { Config } from '../config.js';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    port: 3000,
    databaseUrl: undefined,
    sessionSecret: 'test-secret',
    cookieName: 'grimorio_session',
    corsOrigin: 'http://localhost:5173',
    cookieSameSite: 'lax',
    cookieSecure: false,
    ...overrides,
  };
}

function makeDeps(config: Config = makeConfig()): ServerDeps {
  const repos = makeInMemoryRepos();
  const clock = new FakeClock();
  const rng = new SeededRng(1);
  const srd = new StaticSrdProvider();

  return {
    config,
    http: {
      users: repos.users,
      campaigns: repos.campaigns,
      characters: repos.characters,
      tables: repos.liveTables,
      maps: repos.maps,
      hasher: new FakeHasher(),
      clock,
      rng,
      srd,
      config,
    },
    ws: {
      config,
      campaigns: repos.campaigns,
      live: { tables: repos.liveTables, srd, rng, clock },
    },
  };
}

describe('buildServer', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildServer(makeDeps());
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns 200 { status: "ok" }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('boots with CORS configured for the configured origin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('CORS preflight allows PATCH (the character wizard PATCHes scores)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/characters/chr_x',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(String(res.headers['access-control-allow-methods'])).toMatch(/PATCH/);
  });

  it('register then login works end-to-end through the composed HTTP transport', async () => {
    const registerRes = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        type: 'Register',
        email: 'lyra@example.com',
        password: 'password123',
        displayName: 'Lyra',
      },
    });
    expect(registerRes.statusCode).toBe(200);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { type: 'Login', email: 'lyra@example.com', password: 'password123' },
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.cookies.some((c) => c.name === 'grimorio_session')).toBe(true);
  });

  it('rejects a /ws upgrade without a session cookie', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ws/cmp_1',
      headers: {
        connection: 'Upgrade',
        upgrade: 'websocket',
        'sec-websocket-version': '13',
        'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
    });
    // No valid session cookie: the gateway closes the socket (401) rather
    // than completing the upgrade handshake.
    expect(res.statusCode).not.toBe(101);
  });

  // Real upgrade over a listening socket — `app.inject` cannot exercise the
  // @fastify/websocket handshake, so this is the only test that proves the
  // `{ websocket: true }` route actually upgrades (regression: the route used to
  // be registered before the plugin loaded and 500'd on every connection).
  it('completes a real /ws upgrade and pushes a snapshot to an authed client', async () => {
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    const port = (app.server.address() as { port: number }).port;

    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dm@ws.co', password: 'password123', displayName: 'DM' },
    });
    const cookie = reg.cookies.find((c) => c.name === 'grimorio_session')!;
    const campaign = (
      await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { grimorio_session: cookie.value },
        payload: { name: 'WS Campaign', tagline: '' },
      })
    ).json();

    const snapshot = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/${campaign.id}`, {
        headers: { cookie: `grimorio_session=${cookie.value}` },
      });
      const timer = setTimeout(() => reject(new Error('no snapshot within 4s')), 4000);
      ws.on('message', (raw: Buffer) => {
        const msg = JSON.parse(raw.toString());
        if (msg.kind === 'snapshot') {
          clearTimeout(timer);
          ws.close();
          resolve(msg.snapshot);
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    expect(snapshot.viewerRole).toBe('dm');
    expect(snapshot.campaignId).toBe(campaign.id);

    void address;
  });
});
