/**
 * HTTP transport integration tests — drive the Fastify app end-to-end with
 * `app.inject`, wiring in-memory repos + fakes through `registerHttpRoutes`.
 * These tests exercise the wire contract (status codes, cookies, JSON
 * shapes), not the application logic itself (covered by its own unit tests).
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerHttpRoutes } from './index.js';
import type { HttpDeps } from './index.js';
import { verifySession } from '../auth/session.js';
import { makeInMemoryRepos, FakeClock, FakeHasher, SeededRng } from '../../testing/index.js';
import { StaticSrdProvider } from '../../domain/srd/index.js';
import type { Config } from '../../config.js';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    port: 3000,
    databaseUrl: undefined,
    sessionSecret: 'test-secret',
    cookieName: 'grimorio_session',
    corsOrigin: '*',
    cookieSameSite: 'lax',
    cookieSecure: false,
    ...overrides,
  };
}

function buildApp(config: Config = makeConfig()): { app: FastifyInstance; deps: HttpDeps } {
  const app = Fastify();
  const repos = makeInMemoryRepos();
  const deps: HttpDeps = {
    users: repos.users,
    campaigns: repos.campaigns,
    characters: repos.characters,
    tables: repos.liveTables,
    maps: repos.maps,
    hasher: new FakeHasher(),
    clock: new FakeClock(),
    rng: new SeededRng(1),
    srd: new StaticSrdProvider(),
    config,
  };
  registerHttpRoutes(app, deps);
  return { app, deps };
}

function cookieFromResponse(res: { cookies: Array<{ name: string; value: string }> }, name: string) {
  return res.cookies.find((c) => c.name === name)?.value;
}

describe('HTTP transport', () => {
  let app: FastifyInstance;
  let config: Config;

  beforeEach(() => {
    config = makeConfig();
    ({ app } = buildApp(config));
  });

  afterEach(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('register then login sets a session cookie that verifies to the right user', async () => {
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
      const registerBody = registerRes.json();
      expect(registerBody).toMatchObject({ displayName: 'Lyra' });
      expect(typeof registerBody.userId).toBe('string');

      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          type: 'Login',
          email: 'lyra@example.com',
          password: 'password123',
        },
      });
      expect(loginRes.statusCode).toBe(200);
      const loginBody = loginRes.json();
      expect(loginBody).toMatchObject({ userId: registerBody.userId, displayName: 'Lyra', token: expect.any(String) });

      const cookie = cookieFromResponse(loginRes, config.cookieName);
      expect(cookie).toBeDefined();
      const principal = verifySession(cookie, config.sessionSecret);
      expect(principal).toEqual({ userId: registerBody.userId, displayName: 'Lyra' });
    });

    it('rejects a bad register body (missing email) with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          type: 'Register',
          password: 'password123',
          displayName: 'Lyra',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('login with wrong password returns 401', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          type: 'Register',
          email: 'lyra@example.com',
          password: 'password123',
          displayName: 'Lyra',
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { type: 'Login', email: 'lyra@example.com', password: 'wrong-password' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('registering the same email twice returns 409', async () => {
      const payload = {
        type: 'Register',
        email: 'dup@example.com',
        password: 'password123',
        displayName: 'Dup',
      };
      const first = await app.inject({ method: 'POST', url: '/auth/register', payload });
      expect(first.statusCode).toBe(200);

      const second = await app.inject({ method: 'POST', url: '/auth/register', payload });
      expect(second.statusCode).toBe(409);
    });

    it('GET /auth/me returns the principal when logged in, 401 otherwise', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'me@example.com', password: 'password123', displayName: 'Me' },
      });
      const cookie = reg.cookies.find((c) => c.name === config.cookieName)!.value;

      const meRes = await app.inject({
        method: 'GET',
        url: '/auth/me',
        cookies: { [config.cookieName]: cookie },
      });
      expect(meRes.statusCode).toBe(200);
      expect(meRes.json()).toMatchObject({ displayName: 'Me' });

      const anon = await app.inject({ method: 'GET', url: '/auth/me' });
      expect(anon.statusCode).toBe(401);
    });

    it('logout clears the cookie and returns 204', async () => {
      const res = await app.inject({ method: 'POST', url: '/auth/logout' });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('session guard', () => {
    it('an authed request without the cookie returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/campaigns' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('campaigns', () => {
    async function registerAndCookie(app: FastifyInstance, email: string, displayName: string) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { type: 'Register', email, password: 'password123', displayName },
      });
      const body = res.json();
      const cookie = cookieFromResponse(res, config.cookieName)!;
      return { userId: body.userId as string, cookie };
    }

    it('POST /campaigns creates a campaign; GET /campaigns returns it for that user only', async () => {
      const dm = await registerAndCookie(app, 'dm@example.com', 'DM');
      const other = await registerAndCookie(app, 'other@example.com', 'Other');

      const createRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'La Mazmorra', tagline: 'Una aventura' },
      });
      expect(createRes.statusCode).toBe(200);
      const campaign = createRes.json();
      expect(campaign.name).toBe('La Mazmorra');
      expect(campaign.ownerId).toBe(dm.userId);

      const listRes = await app.inject({
        method: 'GET',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(listRes.statusCode).toBe(200);
      const list = listRes.json();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(campaign.id);

      const otherListRes = await app.inject({
        method: 'GET',
        url: '/campaigns',
        cookies: { [config.cookieName]: other.cookie },
      });
      expect(otherListRes.statusCode).toBe(200);
      expect(otherListRes.json()).toHaveLength(0);
    });

    it('invite then join adds the joining user as a player member', async () => {
      const dm = await registerAndCookie(app, 'dm2@example.com', 'DM2');
      const player = await registerAndCookie(app, 'player2@example.com', 'Player2');

      const createRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'Cripta', tagline: '' },
      });
      const campaign = createRes.json();

      const inviteRes = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/invite`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'InviteToCampaign', campaignId: campaign.id },
      });
      expect(inviteRes.statusCode).toBe(200);
      const invited = inviteRes.json();
      expect(typeof invited.joinCode).toBe('string');

      const joinRes = await app.inject({
        method: 'POST',
        url: `/join/${invited.joinCode}`,
        cookies: { [config.cookieName]: player.cookie },
        payload: { type: 'JoinCampaign', joinCode: invited.joinCode },
      });
      expect(joinRes.statusCode).toBe(200);
      const joined = joinRes.json();
      expect(joined.members.some((m: { userId: string }) => m.userId === player.userId)).toBe(
        true,
      );
    });

    it('join with an unknown code returns 404', async () => {
      const player = await registerAndCookie(app, 'player3@example.com', 'Player3');
      const res = await app.inject({
        method: 'POST',
        url: '/join/NOPE-00',
        cookies: { [config.cookieName]: player.cookie },
        payload: { type: 'JoinCampaign', joinCode: 'NOPE-00' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('characters', () => {
    async function registerAndCookie(app: FastifyInstance, email: string, displayName: string) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { type: 'Register', email, password: 'password123', displayName },
      });
      const body = res.json();
      const cookie = cookieFromResponse(res, config.cookieName)!;
      return { userId: body.userId as string, cookie };
    }

    it('creates and patches a character for a campaign member', async () => {
      const dm = await registerAndCookie(app, 'dm3@example.com', 'DM3');

      const createCampaignRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'Bosque', tagline: '' },
      });
      const campaign = createCampaignRes.json();

      const createCharRes = await app.inject({
        method: 'POST',
        url: '/characters',
        cookies: { [config.cookieName]: dm.cookie },
        payload: {
          type: 'CreateCharacter',
          campaignId: campaign.id,
          name: 'Lyra',
          species: 'Elfo',
          className: 'Explorador',
          background: 'Forastero',
          level: 1,
          method: 'roll',
          scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        },
      });
      expect(createCharRes.statusCode).toBe(200);
      const character = createCharRes.json();
      expect(character.name).toBe('Lyra');

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/characters/${character.id}`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { name: 'Lyra Stormbringer' },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.json().name).toBe('Lyra Stormbringer');
    });

    it('rejects a bad CreateCharacter body with 400', async () => {
      const dm = await registerAndCookie(app, 'dm4@example.com', 'DM4');
      const res = await app.inject({
        method: 'POST',
        url: '/characters',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCharacter', name: 'Sin Campaign' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('GET /characters/:id returns the sheet for its owner and 403 for a stranger', async () => {
      const dm = await registerAndCookie(app, 'dm-get@example.com', 'DMGet');
      const stranger = await registerAndCookie(app, 'stranger-get@example.com', 'Stranger');

      const campaign = (
        await app.inject({
          method: 'POST',
          url: '/campaigns',
          cookies: { [config.cookieName]: dm.cookie },
          payload: { type: 'CreateCampaign', name: 'Ruinas', tagline: '' },
        })
      ).json();

      const character = (
        await app.inject({
          method: 'POST',
          url: '/characters',
          cookies: { [config.cookieName]: dm.cookie },
          payload: {
            type: 'CreateCharacter',
            campaignId: campaign.id,
            name: 'Kael',
            species: 'Humano',
            className: 'Guerrero',
            background: 'Soldado',
            level: 1,
            method: 'roll',
            scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          },
        })
      ).json();

      const ownerRes = await app.inject({
        method: 'GET',
        url: `/characters/${character.id}`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(ownerRes.statusCode).toBe(200);
      expect(ownerRes.json().name).toBe('Kael');

      const strangerRes = await app.inject({
        method: 'GET',
        url: `/characters/${character.id}`,
        cookies: { [config.cookieName]: stranger.cookie },
      });
      expect(strangerRes.statusCode).toBe(403);
    });
  });

  describe('srd', () => {
    it('GET /srd/monsters returns curated bestiary refs for an authed user', async () => {
      const reg = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'srd@example.com', password: 'password123', displayName: 'DM' },
      });
      const cookie = reg.cookies.find((c) => c.name === config.cookieName)!.value;
      const res = await app.inject({
        method: 'GET',
        url: '/srd/monsters?q=goblin',
        cookies: { [config.cookieName]: cookie },
      });
      expect(res.statusCode).toBe(200);
      const list = res.json();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((m: { id: string }) => m.id === 'goblin-mm')).toBe(true);
    });

    it('GET /srd/monsters requires auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/srd/monsters' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('live table snapshot', () => {
    async function registerAndCookie(app: FastifyInstance, email: string, displayName: string) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { type: 'Register', email, password: 'password123', displayName },
      });
      const body = res.json();
      const cookie = cookieFromResponse(res, config.cookieName)!;
      return { userId: body.userId as string, cookie };
    }

    it('returns a dm-role projection for the owner and 403 for a non-member', async () => {
      const dm = await registerAndCookie(app, 'dm5@example.com', 'DM5');
      const stranger = await registerAndCookie(app, 'stranger@example.com', 'Stranger');

      const createCampaignRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'Torre', tagline: '' },
      });
      const campaign = createCampaignRes.json();

      const snapshotRes = await app.inject({
        method: 'GET',
        url: `/tables/${campaign.id}/snapshot`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(snapshotRes.statusCode).toBe(200);
      const snapshot = snapshotRes.json();
      expect(snapshot.viewerRole).toBe('dm');
      expect(snapshot.campaignId).toBe(campaign.id);

      const forbiddenRes = await app.inject({
        method: 'GET',
        url: `/tables/${campaign.id}/snapshot`,
        cookies: { [config.cookieName]: stranger.cookie },
      });
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('returns a player-role projection for a joined player', async () => {
      const dm = await registerAndCookie(app, 'dm6@example.com', 'DM6');
      const player = await registerAndCookie(app, 'player6@example.com', 'Player6');

      const createCampaignRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'Costa', tagline: '' },
      });
      const campaign = createCampaignRes.json();

      const inviteRes = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/invite`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'InviteToCampaign', campaignId: campaign.id },
      });
      const { joinCode } = inviteRes.json();

      await app.inject({
        method: 'POST',
        url: `/join/${joinCode}`,
        cookies: { [config.cookieName]: player.cookie },
        payload: { type: 'JoinCampaign', joinCode },
      });

      const snapshotRes = await app.inject({
        method: 'GET',
        url: `/tables/${campaign.id}/snapshot`,
        cookies: { [config.cookieName]: player.cookie },
      });
      expect(snapshotRes.statusCode).toBe(200);
      expect(snapshotRes.json().viewerRole).toBe('player');
    });
  });

  describe('maps', () => {
    async function registerAndCookie(app: FastifyInstance, email: string, displayName: string) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { type: 'Register', email, password: 'password123', displayName },
      });
      const body = res.json();
      const cookie = cookieFromResponse(res, config.cookieName)!;
      return { userId: body.userId as string, cookie };
    }

    async function createCampaignAndInvitePlayer(
      dm: { userId: string; cookie: string },
      player: { userId: string; cookie: string },
    ) {
      const createCampaignRes = await app.inject({
        method: 'POST',
        url: '/campaigns',
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateCampaign', name: 'Mazmorra', tagline: '' },
      });
      const campaign = createCampaignRes.json();
      const inviteRes = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/invite`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'InviteToCampaign', campaignId: campaign.id },
      });
      const { joinCode } = inviteRes.json();
      await app.inject({
        method: 'POST',
        url: `/join/${joinCode}`,
        cookies: { [config.cookieName]: player.cookie },
        payload: { type: 'JoinCampaign', joinCode },
      });
      return campaign;
    }

    it('DM creates a map, lists it, fetches it, updates it, deletes it', async () => {
      const dm = await registerAndCookie(app, 'dm-map@example.com', 'MapDM');
      const player = await registerAndCookie(app, 'player-map@example.com', 'MapPlayer');
      const campaign = await createCampaignAndInvitePlayer(dm, player);

      const createRes = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: {
          type: 'CreateMap',
          campaignId: campaign.id,
          name: 'Bosque',
          mapType: 'exterior',
          environment: 'bosque',
          width: 20,
          height: 15,
        },
      });
      expect(createRes.statusCode).toBe(200);
      const map = createRes.json();
      expect(map.name).toBe('Bosque');
      expect(map.layers.map((l: { name: string }) => l.name)).toEqual([
        'Suelo',
        'Objetos',
        'Techo',
      ]);

      const listRes = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json().map((m: { id: string }) => m.id)).toEqual([map.id]);

      // A joined player can also see the map (member read).
      const playerListRes = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: player.cookie },
      });
      expect(playerListRes.statusCode).toBe(200);

      const getRes = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps/${map.id}`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(getRes.statusCode).toBe(200);
      expect(getRes.json().id).toBe(map.id);

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/campaigns/${campaign.id}/maps/${map.id}`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { name: 'Renombrado', gridSize: 48 },
      });
      expect(patchRes.statusCode).toBe(200);
      const patched = patchRes.json();
      expect(patched.name).toBe('Renombrado');
      expect(patched.gridSize).toBe(48);

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/campaigns/${campaign.id}/maps/${map.id}`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(deleteRes.statusCode).toBe(204);

      const after = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps/${map.id}`,
        cookies: { [config.cookieName]: dm.cookie },
      });
      expect(after.statusCode).toBe(404);
    });

    it('a player cannot create, update, or delete a map (403)', async () => {
      const dm = await registerAndCookie(app, 'dm-priv@example.com', 'PrivDM');
      const player = await registerAndCookie(app, 'player-priv@example.com', 'PrivPlayer');
      const campaign = await createCampaignAndInvitePlayer(dm, player);

      const createRes = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: player.cookie },
        payload: {
          type: 'CreateMap',
          campaignId: campaign.id,
          name: 'X',
          mapType: 'exterior',
          environment: 'bosque',
          width: 10,
          height: 10,
        },
      });
      expect(createRes.statusCode).toBe(403);

      // DM creates one for the player to attempt to edit.
      const created = (
        await app.inject({
          method: 'POST',
          url: `/campaigns/${campaign.id}/maps`,
          cookies: { [config.cookieName]: dm.cookie },
          payload: {
            type: 'CreateMap',
            campaignId: campaign.id,
            name: 'X',
            mapType: 'exterior',
            environment: 'bosque',
            width: 10,
            height: 10,
          },
        })
      ).json();

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/campaigns/${campaign.id}/maps/${created.id}`,
        cookies: { [config.cookieName]: player.cookie },
        payload: { name: 'hacked' },
      });
      expect(patchRes.statusCode).toBe(403);

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/campaigns/${campaign.id}/maps/${created.id}`,
        cookies: { [config.cookieName]: player.cookie },
      });
      expect(deleteRes.statusCode).toBe(403);
    });

    it('a stranger (non-member) cannot list or get maps (403)', async () => {
      const dm = await registerAndCookie(app, 'dm-stranger@example.com', 'SntDM');
      const stranger = await registerAndCookie(app, 'stranger-map@example.com', 'Snt');
      const campaign = (
        await app.inject({
          method: 'POST',
          url: '/campaigns',
          cookies: { [config.cookieName]: dm.cookie },
          payload: { type: 'CreateCampaign', name: 'M', tagline: '' },
        })
      ).json();

      const created = (
        await app.inject({
          method: 'POST',
          url: `/campaigns/${campaign.id}/maps`,
          cookies: { [config.cookieName]: dm.cookie },
          payload: {
            type: 'CreateMap',
            campaignId: campaign.id,
            name: 'Real',
            mapType: 'exterior',
            environment: 'bosque',
            width: 10,
            height: 10,
          },
        })
      ).json();

      const listRes = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: stranger.cookie },
      });
      expect(listRes.statusCode).toBe(403);

      const getRes = await app.inject({
        method: 'GET',
        url: `/campaigns/${campaign.id}/maps/${created.id}`,
        cookies: { [config.cookieName]: stranger.cookie },
      });
      expect(getRes.statusCode).toBe(403);
    });

    it('rejects a bad CreateMap body with 400', async () => {
      const dm = await registerAndCookie(app, 'dm-bad@example.com', 'Bad');
      const campaign = (
        await app.inject({
          method: 'POST',
          url: '/campaigns',
          cookies: { [config.cookieName]: dm.cookie },
          payload: { type: 'CreateCampaign', name: 'M', tagline: '' },
        })
      ).json();

      const res = await app.inject({
        method: 'POST',
        url: `/campaigns/${campaign.id}/maps`,
        cookies: { [config.cookieName]: dm.cookie },
        payload: { type: 'CreateMap', campaignId: campaign.id, name: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('requires auth: listing maps without a cookie returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/campaigns/cmp_x/maps',
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
