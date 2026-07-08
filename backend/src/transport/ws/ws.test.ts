import { describe, expect, it, vi } from 'vitest';
import { FakeClock, SeededRng, makeInMemoryRepos } from '../../testing/index.js';
import { StaticSrdProvider } from '../../domain/srd/index.js';
import type { Deps as LiveDeps, Principal } from '../../application/livetable/index.js';
import { getOrCreateLiveTable } from '../../application/livetable/index.js';
import type { Campaign, CharacterSheet, Combatant, LiveTable } from '../../domain/types.js';
import { newCharacterId, type CampaignId, type CharacterId, type UserId } from '../../domain/ids.js';
import type { PlayerSnapshot, MasterSnapshot } from '@grimorio/shared/wire';
import { RoomManager } from './room.js';
import { handleMessage, sendInitialSnapshot, type OutboundMessage } from './connection.js';

// ---------- fixture ----------

const CAMPAIGN_ID = 'cmp_1' as CampaignId;
const DM_ID = 'usr_dm' as UserId;
const PLAYER_ID = 'usr_player' as UserId;

const dm: Principal = { userId: DM_ID, role: 'dm' };
const player: Principal = { userId: PLAYER_ID, role: 'player' };

/** PC combatant controlled by PLAYER_ID — refId holds the controlling user id. */
const pc: Combatant = {
  id: 'cbt_pc' as Combatant['id'],
  refId: PLAYER_ID,
  type: 'pc',
  name: 'Lyra',
  initiative: 18,
  maxHp: 30,
  currentHp: 30,
  conditions: [],
  hpVisibility: 'public',
};

/** Hidden monster — players only ever see a derived status label. */
const monster: Combatant = {
  id: 'cbt_mon' as Combatant['id'],
  refId: 'goblin-mm',
  type: 'monster',
  name: 'Goblin',
  initiative: 12,
  maxHp: 7,
  currentHp: 7,
  conditions: [],
  hpVisibility: 'dm_only',
};

function seededCampaign(): Campaign {
  return {
    id: CAMPAIGN_ID,
    ownerId: DM_ID,
    name: 'Test Campaign',
    tagline: '',
    status: 'active',
    joinCode: 'RAVEN-77',
    members: [
      { userId: DM_ID, role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' },
      { userId: PLAYER_ID, role: 'player', joinedAt: '2024-01-01T00:00:00.000Z' },
    ],
    characterIds: [],
    sessionCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

function seededTable(): LiveTable {
  return {
    id: 'tbl_1' as LiveTable['id'],
    campaignId: CAMPAIGN_ID,
    combatants: [pc, monster],
    combat: { active: true, round: 1, order: [pc.id, monster.id], currentTurnIndex: 0 },
    rollLog: [],
    eventLog: [],
    dmNotes: '',
    version: 1,
  };
}

async function setup() {
  const repos = makeInMemoryRepos();
  await repos.campaigns.save(seededCampaign());
  await repos.liveTables.save(seededTable());
  const deps: LiveDeps = {
    tables: repos.liveTables,
    srd: new StaticSrdProvider(),
    rng: new SeededRng([15, 4]),
    clock: new FakeClock(),
  };
  return { repos, deps };
}

/** Parse all JSON frames a fake socket received. */
function received(socket: { send: ReturnType<typeof vi.fn> }): OutboundMessage[] {
  return socket.send.mock.calls.map((c) => JSON.parse(c[0] as string) as OutboundMessage);
}

function fakeSocket() {
  return { send: vi.fn() };
}

// ---------- RoomManager ----------

describe('RoomManager', () => {
  it('join / clientsOf / leave basic correctness', () => {
    const rooms = new RoomManager();
    const a = fakeSocket();
    const b = fakeSocket();

    expect(rooms.clientsOf('r1')).toEqual([]);

    rooms.join('r1', a, dm);
    rooms.join('r1', b, player);
    const members = rooms.clientsOf('r1');
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.principal.userId).sort()).toEqual([DM_ID, PLAYER_ID].sort());

    rooms.leave('r1', a);
    expect(rooms.clientsOf('r1')).toHaveLength(1);
    expect(rooms.clientsOf('r1')[0].principal.userId).toBe(PLAYER_ID);

    rooms.leave('r1', b);
    expect(rooms.clientsOf('r1')).toEqual([]);
  });

  it('a re-join by the same socket does not duplicate membership', () => {
    const rooms = new RoomManager();
    const a = fakeSocket();
    rooms.join('r1', a, player);
    rooms.join('r1', a, player);
    expect(rooms.clientsOf('r1')).toHaveLength(1);
  });
});

// ---------- visibility over the wire ----------

describe('handleMessage visibility', () => {
  it('RollHidden: dm socket sees the hidden roll, player socket does not', async () => {
    const { deps } = await setup();
    const rooms = new RoomManager();
    const dmSock = fakeSocket();
    const playerSock = fakeSocket();
    rooms.join(CAMPAIGN_ID, dmSock, dm);
    rooms.join(CAMPAIGN_ID, playerSock, player);

    await handleMessage(JSON.stringify({ type: 'RollHidden', notation: '1d20' }), {
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: dm,
      client: dmSock,
      rooms,
      deps,
    });

    const dmMsgs = received(dmSock);
    const playerMsgs = received(playerSock);
    expect(dmMsgs).toHaveLength(1);
    expect(playerMsgs).toHaveLength(1);

    const dmSnap = (dmMsgs[0] as { snapshot: MasterSnapshot }).snapshot;
    const playerSnap = (playerMsgs[0] as { snapshot: PlayerSnapshot }).snapshot;

    // DM's projected roll log includes the dm_only roll...
    expect(dmSnap.rollLog).toHaveLength(1);
    expect(dmSnap.rollLog[0].visibility).toBe('dm_only');
    // ...the player's does NOT.
    expect(playerSnap.rollLog).toHaveLength(0);

    // And the raw JSON the player received never contains the hidden roll.
    const playerRaw = playerSock.send.mock.calls.map((c) => c[0] as string).join('');
    expect(playerRaw).not.toContain('dm_only');
  });
});

// ---------- authorization ----------

describe('handleMessage authorization', () => {
  it('player issuing NextTurn → error to that player, no broadcast advance', async () => {
    const { deps } = await setup();
    const rooms = new RoomManager();
    const dmSock = fakeSocket();
    const playerSock = fakeSocket();
    rooms.join(CAMPAIGN_ID, dmSock, dm);
    rooms.join(CAMPAIGN_ID, playerSock, player);

    await handleMessage(JSON.stringify({ type: 'NextTurn' }), {
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: playerSock,
      rooms,
      deps,
    });

    const playerMsgs = received(playerSock);
    expect(playerMsgs).toHaveLength(1);
    expect(playerMsgs[0].kind).toBe('error');
    expect((playerMsgs[0] as { error: { code: string } }).error.code).toBe('Forbidden');

    // No broadcast to anyone else, and no turn advance persisted.
    expect(dmSock.send).not.toHaveBeenCalled();
    const table = await getOrCreateLiveTable(CAMPAIGN_ID, deps.tables);
    expect(table.combat.currentTurnIndex).toBe(0);
  });

  it('invalid/garbage message → error reply to sender only, no throw', async () => {
    const { deps } = await setup();
    const rooms = new RoomManager();
    const playerSock = fakeSocket();
    const dmSock = fakeSocket();
    rooms.join(CAMPAIGN_ID, playerSock, player);
    rooms.join(CAMPAIGN_ID, dmSock, dm);

    await expect(
      handleMessage('not-json-at-all', {
        roomId: CAMPAIGN_ID,
        campaignId: CAMPAIGN_ID,
        principal: player,
        client: playerSock,
        rooms,
        deps,
      }),
    ).resolves.toBeUndefined();

    // And a structurally-valid-JSON-but-not-a-command frame.
    await handleMessage(JSON.stringify({ type: 'Nonexistent', foo: 1 }), {
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: playerSock,
      rooms,
      deps,
    });

    const msgs = received(playerSock);
    expect(msgs).toHaveLength(2);
    expect(msgs.every((m) => m.kind === 'error')).toBe(true);
    // No collateral broadcast.
    expect(dmSock.send).not.toHaveBeenCalled();
  });
});

// ---------- reconnect ----------

describe('reconnect', () => {
  it('a second join by the same principal re-sends the current snapshot', async () => {
    const { deps } = await setup();
    const rooms = new RoomManager();

    const first = fakeSocket();
    rooms.join(CAMPAIGN_ID, first, player);
    await sendInitialSnapshot({
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: first,
      rooms,
      deps,
    });
    expect(received(first)).toHaveLength(1);
    expect(received(first)[0].kind).toBe('snapshot');

    // Reconnect: a fresh socket for the same principal re-joins and gets the snapshot.
    const second = fakeSocket();
    rooms.join(CAMPAIGN_ID, second, player);
    await sendInitialSnapshot({
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: second,
      rooms,
      deps,
    });
    const msgs = received(second);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].kind).toBe('snapshot');
    const snap = (msgs[0] as { snapshot: PlayerSnapshot }).snapshot;
    expect(snap.viewerRole).toBe('player');
    expect(snap.campaignId).toBe(CAMPAIGN_ID);
  });
});

// ---------- auto-seat the connecting player's character ----------

function ownedSheet(id: CharacterId): CharacterSheet {
  return {
    id,
    campaignId: CAMPAIGN_ID,
    ownerId: PLAYER_ID,
    name: 'Lyra',
    species: 'Elfo',
    className: 'Explorador',
    background: 'Forastero',
    level: 5,
    scores: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 11 },
    maxHp: 38,
    currentHp: 31,
    armorClass: 16,
    speed: 10.5,
    proficientSkills: [],
    attacks: [],
    inventory: [],
    gold: 0,
    notes: '',
    visibility: 'owner',
  };
}

describe('auto-seat on player connect', () => {
  it("seats the player's character and surfaces ownCharacterId", async () => {
    const repos = makeInMemoryRepos();
    await repos.campaigns.save(seededCampaign());
    const charId = newCharacterId();
    await repos.characters.save(ownedSheet(charId));
    const deps: LiveDeps = {
      tables: repos.liveTables,
      srd: new StaticSrdProvider(),
      rng: new SeededRng([1]),
      clock: new FakeClock(),
      characters: repos.characters,
    };
    const rooms = new RoomManager();
    const playerSock = fakeSocket();
    rooms.join(CAMPAIGN_ID, playerSock, player);

    await sendInitialSnapshot({
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: playerSock,
      rooms,
      deps,
    });

    const msgs = received(playerSock).filter((m) => m.kind === 'snapshot');
    const snap = (msgs.at(-1) as { snapshot: PlayerSnapshot }).snapshot;
    expect(snap.ownCharacterId).toBe(charId);
    const mine = snap.combatants.find((c) => c.type === 'pc' && c.name === 'Lyra');
    expect(mine).toBeDefined();

    // idempotent: a reconnect does not add a second PC combatant
    await sendInitialSnapshot({
      roomId: CAMPAIGN_ID,
      campaignId: CAMPAIGN_ID,
      principal: player,
      client: playerSock,
      rooms,
      deps,
    });
    const table = await repos.liveTables.findByCampaignId(CAMPAIGN_ID);
    expect(table!.combatants.filter((c) => c.type === 'pc')).toHaveLength(1);
  });
});
