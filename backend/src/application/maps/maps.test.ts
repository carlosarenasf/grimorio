/**
 * Application-layer tests for the maps use cases.
 *
 * Drives `createMap` / `getMap` / `listMaps` / `updateMap` / `deleteMap` against
 * the in-memory repos with a fake clock, and verifies the role-based
 * authorization (DM-only for write/delete, member for read/list).
 */
import { describe, expect, it } from 'vitest';
import { FakeClock, makeInMemoryRepos } from '../../testing/index.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import { newCampaignId, newUserId } from '../../domain/ids.js';
import { createCampaign } from '../campaign/index.js';
import { SeededRng } from '../../testing/rng.js';
import {
  createMap,
  deleteMap,
  getMap,
  listMaps,
  updateMap,
  MapError,
  NotFound,
  Forbidden,
} from './index.js';

interface TestWorld {
  repos: ReturnType<typeof makeInMemoryRepos>;
  clock: FakeClock;
}

async function makeWorld(): Promise<{
  world: TestWorld;
  dmId: UserId;
  playerId: UserId;
  campaignId: CampaignId;
}> {
  const repos = makeInMemoryRepos();
  const clock = new FakeClock();
  const rng = new SeededRng([0]);
  const dmId = newUserId();
  const playerId = newUserId();
  const campaign = await createCampaign(
    { ownerId: dmId, name: 'C', tagline: 't' },
    { campaigns: repos.campaigns, clock, rng },
  );
  // Make `playerId` a campaign member via join (avoids extra use case surface).
  await repos.campaigns.save({
    ...campaign,
    members: [
      ...campaign.members,
      { userId: playerId, role: 'player', joinedAt: clock.now() },
    ],
  });
  return { world: { repos, clock }, dmId, playerId, campaignId: campaign.id };
}

describe('createMap', () => {
  it('persists a map with three default layers and returns it', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const map = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'Bosque',
        type: 'exterior',
        environment: 'bosque',
        width: 20,
        height: 15,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    expect(map.layers.map((l) => l.name)).toEqual(['Suelo', 'Objetos', 'Techo']);
    const persisted = await world.repos.maps.findById(map.id);
    expect(persisted).toEqual(map);
  });

  it('rejects a non-dm actor with Forbidden', async () => {
    const { world, playerId, campaignId } = await makeWorld();
    await expect(
      createMap(
        {
          campaignId,
          actorId: playerId,
          name: 'X',
          type: 'exterior',
          environment: 'bosque',
          width: 10,
          height: 10,
        },
        { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('rejects an unrelated user (not a campaign member) with Forbidden', async () => {
    const { world, campaignId } = await makeWorld();
    await expect(
      createMap(
        {
          campaignId,
          actorId: newUserId(),
          name: 'X',
          type: 'exterior',
          environment: 'bosque',
          width: 10,
          height: 10,
        },
        { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('throws NotFound when the campaign does not exist', async () => {
    const { world, dmId } = await makeWorld();
    await expect(
      createMap(
        {
          campaignId: newCampaignId(),
          actorId: dmId,
          name: 'X',
          type: 'exterior',
          environment: 'bosque',
          width: 10,
          height: 10,
        },
        { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });
});

describe('getMap', () => {
  it('returns the map for the dm of the campaign', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'Bosque',
        type: 'exterior',
        environment: 'bosque',
        width: 20,
        height: 15,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    const got = await getMap(
      { mapId: created.id, actorId: dmId },
      { campaigns: world.repos.campaigns, maps: world.repos.maps },
    );
    expect(got).toEqual(created);
  });

  it('returns the map for a player member of the campaign', async () => {
    const { world, dmId, playerId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'Bosque',
        type: 'exterior',
        environment: 'bosque',
        width: 20,
        height: 15,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    const got = await getMap(
      { mapId: created.id, actorId: playerId },
      { campaigns: world.repos.campaigns, maps: world.repos.maps },
    );
    expect(got.id).toBe(created.id);
  });

  it('throws NotFound when the map does not exist', async () => {
    const { world, dmId } = await makeWorld();
    await expect(
      getMap(
        { mapId: 'map_missing' as any, actorId: dmId },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });

  it('rejects a non-member with Forbidden', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'Bosque',
        type: 'exterior',
        environment: 'bosque',
        width: 20,
        height: 15,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    await expect(
      getMap(
        { mapId: created.id, actorId: newUserId() },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});

describe('listMaps', () => {
  it('lists all maps of the campaign for a member', async () => {
    const { world, dmId, playerId, campaignId } = await makeWorld();
    const a = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );
    const b = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'B',
        type: 'interior',
        environment: 'casa',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    const dmList = await listMaps(
      { campaignId, actorId: dmId },
      { campaigns: world.repos.campaigns, maps: world.repos.maps },
    );
    expect(dmList.map((m) => m.id).sort()).toEqual([a.id, b.id].sort());

    const playerList = await listMaps(
      { campaignId, actorId: playerId },
      { campaigns: world.repos.campaigns, maps: world.repos.maps },
    );
    expect(playerList.map((m) => m.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('rejects a non-member with Forbidden', async () => {
    const { world, campaignId } = await makeWorld();
    await expect(
      listMaps(
        { campaignId, actorId: newUserId() },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('throws NotFound when the campaign does not exist', async () => {
    const { world, dmId } = await makeWorld();
    await expect(
      listMaps(
        { campaignId: newCampaignId(), actorId: dmId },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });
});

describe('updateMap', () => {
  it('updates scalar fields and bumps updatedAt', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    world.clock.set('2026-08-01T00:00:00.000Z');
    const updated = await updateMap(
      {
        mapId: created.id,
        actorId: dmId,
        name: 'Renombrado',
        type: 'interior',
        environment: 'casa',
        width: 30,
        height: 20,
        gridSize: 48,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    expect(updated).toMatchObject({
      name: 'Renombrado',
      type: 'interior',
      environment: 'casa',
      width: 30,
      height: 20,
      gridSize: 48,
    });
    expect(updated.updatedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(updated.createdAt).toBe(created.createdAt);
  });

  it('replaces layers when provided', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    const layers = [
      {
        id: 'layer-1',
        name: 'Personalizado',
        visible: true,
        elements: [
          {
            id: 'el-1',
            tileId: 'tile-tree',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            rotation: 0,
            layerId: 'layer-1',
          },
        ],
      },
    ];

    const updated = await updateMap(
      { mapId: created.id, actorId: dmId, layers },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    expect(updated.layers).toEqual(layers);
  });

  it('rejects a non-dm actor (a player) with Forbidden', async () => {
    const { world, dmId, playerId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    await expect(
      updateMap(
        { mapId: created.id, actorId: playerId, name: 'hack' },
        { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('throws NotFound when the map does not exist', async () => {
    const { world, dmId } = await makeWorld();
    await expect(
      updateMap(
        { mapId: 'map_missing' as any, actorId: dmId, name: 'n' },
        { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });
});

describe('deleteMap', () => {
  it('removes the map when the dm calls it', async () => {
    const { world, dmId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    await deleteMap(
      { mapId: created.id, actorId: dmId },
      { campaigns: world.repos.campaigns, maps: world.repos.maps },
    );

    expect(await world.repos.maps.findById(created.id)).toBeNull();
  });

  it('rejects a non-dm actor (a player) with Forbidden', async () => {
    const { world, dmId, playerId, campaignId } = await makeWorld();
    const created = await createMap(
      {
        campaignId,
        actorId: dmId,
        name: 'A',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { campaigns: world.repos.campaigns, maps: world.repos.maps, clock: world.clock },
    );

    await expect(
      deleteMap(
        { mapId: created.id, actorId: playerId },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('throws NotFound when the map does not exist', async () => {
    const { world, dmId } = await makeWorld();
    await expect(
      deleteMap(
        { mapId: 'map_missing' as any, actorId: dmId },
        { campaigns: world.repos.campaigns, maps: world.repos.maps },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });
});

describe('errors', () => {
  it('MapError subclasses carry a stable code', () => {
    expect(new NotFound('id').code).toBe('NotFound');
    expect(new Forbidden().code).toBe('Forbidden');
    expect(new NotFound('id')).toBeInstanceOf(MapError);
  });
});