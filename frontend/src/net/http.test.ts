import { describe, expect, it, vi } from 'vitest';
import { createApiClient, ApiError } from './http';

/** Build a fake `fetch` that records calls and replays a canned response. */
function fakeFetch(response: {
  status: number;
  body: unknown;
}): { fetch: typeof fetch; calls: Array<{ url: string; init?: RequestInit }> } {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  });
  return { fetch: fetchFn as unknown as typeof fetch, calls };
}

describe('createApiClient', () => {
  it('login() POSTs to /auth/login with credentials included and returns the principal', async () => {
    const principal = { userId: 'u1', displayName: 'Gandalf' };
    const { fetch, calls } = fakeFetch({ status: 200, body: principal });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.login({ email: 'g@shire.test', password: 'mellon123' });

    expect(result).toEqual(principal);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('http://api.test/auth/login');
    expect(calls[0]!.init?.method).toBe('POST');
    expect(calls[0]!.init?.credentials).toBe('include');
    expect(calls[0]!.init?.headers).toMatchObject({ 'content-type': 'application/json' });
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({
      email: 'g@shire.test',
      password: 'mellon123',
    });
  });

  it('throws a typed ApiError with status 401 on invalid credentials', async () => {
    const { fetch } = fakeFetch({
      status: 401,
      body: { error: 'InvalidCredentials', message: 'Bad email or password' },
    });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    await expect(
      client.login({ email: 'g@shire.test', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'InvalidCredentials',
      message: 'Bad email or password',
    });

    await expect(
      client.login({ email: 'g@shire.test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('register() POSTs to /auth/register', async () => {
    const principal = { userId: 'u2', displayName: 'Frodo' };
    const { fetch, calls } = fakeFetch({ status: 200, body: principal });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.register({
      email: 'f@shire.test',
      password: 'ringbearer',
      displayName: 'Frodo',
    });

    expect(result).toEqual(principal);
    expect(calls[0]!.url).toBe('http://api.test/auth/register');
    expect(calls[0]!.init?.method).toBe('POST');
  });

  it('logout() POSTs to /auth/logout and resolves with no body (204)', async () => {
    const { fetch, calls } = fakeFetch({ status: 204, body: undefined });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    await expect(client.logout()).resolves.toBeUndefined();
    expect(calls[0]!.url).toBe('http://api.test/auth/logout');
    expect(calls[0]!.init?.method).toBe('POST');
    expect(calls[0]!.init?.credentials).toBe('include');
  });

  it('listCampaigns() GETs /campaigns', async () => {
    const campaigns = [{ id: 'c1', name: 'Curse of Strahd' }];
    const { fetch, calls } = fakeFetch({ status: 200, body: campaigns });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.listCampaigns();

    expect(result).toEqual(campaigns);
    expect(calls[0]!.url).toBe('http://api.test/campaigns');
    expect(calls[0]!.init?.method ?? 'GET').toBe('GET');
    expect(calls[0]!.init?.credentials).toBe('include');
  });

  it('createCampaign() POSTs to /campaigns with the body', async () => {
    const campaign = { id: 'c1', name: 'Curse of Strahd', tagline: 'Gothic horror' };
    const { fetch, calls } = fakeFetch({ status: 200, body: campaign });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.createCampaign({ name: 'Curse of Strahd', tagline: 'Gothic horror' });

    expect(result).toEqual(campaign);
    expect(calls[0]!.url).toBe('http://api.test/campaigns');
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({
      name: 'Curse of Strahd',
      tagline: 'Gothic horror',
    });
  });

  it('invite() POSTs to /campaigns/:id/invite', async () => {
    const campaign = { id: 'c1', joinCode: 'RAVEN-77' };
    const { fetch, calls } = fakeFetch({ status: 200, body: campaign });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.invite('c1');

    expect(result).toEqual(campaign);
    expect(calls[0]!.url).toBe('http://api.test/campaigns/c1/invite');
    expect(calls[0]!.init?.method).toBe('POST');
  });

  it('joinByCode() POSTs to /join/:code', async () => {
    const campaign = { id: 'c1', name: 'Curse of Strahd' };
    const { fetch, calls } = fakeFetch({ status: 200, body: campaign });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.joinByCode('RAVEN-77');

    expect(result).toEqual(campaign);
    expect(calls[0]!.url).toBe('http://api.test/join/RAVEN-77');
    expect(calls[0]!.init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({ joinCode: 'RAVEN-77' });
  });

  it('createCharacter() POSTs to /characters', async () => {
    const character = { id: 'ch1', name: 'Aragorn' };
    const { fetch, calls } = fakeFetch({ status: 200, body: character });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.createCharacter({
      campaignId: 'c1',
      name: 'Aragorn',
      species: 'Human',
      className: 'Ranger',
      background: 'Outlander',
      level: 1,
      method: 'roll',
    });

    expect(result).toEqual(character);
    expect(calls[0]!.url).toBe('http://api.test/characters');
    expect(calls[0]!.init?.method).toBe('POST');
  });

  it('updateCharacter() PATCHes to /characters/:id with the patch body', async () => {
    const character = { id: 'ch1', name: 'Aragorn', currentHp: 10 };
    const { fetch, calls } = fakeFetch({ status: 200, body: character });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.updateCharacter('ch1', { currentHp: 10 });

    expect(result).toEqual(character);
    expect(calls[0]!.url).toBe('http://api.test/characters/ch1');
    expect(calls[0]!.init?.method).toBe('PATCH');
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({ currentHp: 10 });
  });

  it('getSnapshot() GETs /tables/:campaignId/snapshot', async () => {
    const snapshot = { liveTableId: 't1', campaignId: 'c1', viewerRole: 'player' };
    const { fetch, calls } = fakeFetch({ status: 200, body: snapshot });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    const result = await client.getSnapshot('c1');

    expect(result).toEqual(snapshot);
    expect(calls[0]!.url).toBe('http://api.test/tables/c1/snapshot');
  });

  it('defaults baseUrl when not provided', async () => {
    const { fetch, calls } = fakeFetch({ status: 200, body: [] });
    const client = createApiClient({ fetch });

    await client.listCampaigns();

    expect(calls[0]!.url.startsWith('http://localhost:3000')).toBe(true);
  });

  it('throws ApiError without a code when the error body has no recognizable code field', async () => {
    const { fetch } = fakeFetch({ status: 500, body: { message: 'boom' } });
    const client = createApiClient({ baseUrl: 'http://api.test', fetch });

    await expect(client.listCampaigns()).rejects.toMatchObject({
      status: 500,
      code: undefined,
      message: 'boom',
    });
  });
});
