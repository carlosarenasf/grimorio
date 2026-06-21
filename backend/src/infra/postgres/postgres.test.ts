/**
 * INTEGRATION test for the Postgres adapters. Guarded by `DATABASE_URL`: when
 * unset, the whole suite is skipped so `pnpm test` stays green without a
 * database (see rows.test.ts for the always-on pure unit coverage). When
 * set, point it at a scratch database — this test truncates tables it owns.
 *
 * Run against a real DB with e.g.:
 *   DATABASE_URL=postgres://user:pass@localhost:5432/grimorio_test \
 *     pnpm -C backend exec vitest run src/infra/postgres
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Sql } from 'postgres';
import { createSqlClient } from './client.js';
import { migrate } from './migrate.js';
import { PostgresUserRepository } from './userRepository.js';
import { PostgresCampaignRepository } from './campaignRepository.js';
import { PostgresCharacterRepository } from './characterRepository.js';
import { PostgresLiveTableRepository } from './liveTableRepository.js';
import {
  newCampaignId,
  newCharacterId,
  newLiveTableId,
  newUserId,
} from '../../domain/ids.js';
import type { Campaign, CharacterSheet, LiveTable, User } from '../../domain/types.js';

const DATABASE_URL = process.env.DATABASE_URL;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: newUserId(),
    email: `user-${Math.random().toString(36).slice(2)}@example.com`,
    passwordHash: 'hash123',
    displayName: 'Lyra',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  const ownerId = newUserId();
  return {
    id: newCampaignId(),
    ownerId,
    name: 'La Maldición de Strahd',
    tagline: 'Niebla y vampiros',
    status: 'active',
    joinCode: `RAVEN-${Math.floor(Math.random() * 100000)}`,
    members: [{ userId: ownerId, role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' }],
    characterIds: [],
    sessionCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCharacter(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: newCharacterId(),
    campaignId: newCampaignId(),
    ownerId: newUserId(),
    name: 'Brom',
    species: 'Enano',
    className: 'Guerrero',
    background: 'Soldado',
    level: 3,
    scores: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
    maxHp: 28,
    currentHp: 28,
    armorClass: 16,
    speed: 7.5,
    proficientSkills: ['athletics', 'intimidation'],
    attacks: [
      { id: 'atk_1', name: 'Hacha', kind: 'weapon', bonus: 5, damage: '1d8+3', damageType: 'tajante' },
    ],
    inventory: [{ id: 'inv_1', name: 'Cuerda', note: '15 m', qty: 1, equipped: false }],
    gold: 12,
    notes: 'Leal a su clan.',
    visibility: 'owner',
    ...overrides,
  };
}

function makeLiveTable(overrides: Partial<LiveTable> = {}): LiveTable {
  return {
    id: newLiveTableId(),
    campaignId: newCampaignId(),
    combatants: [
      {
        id: 'cbt_1' as LiveTable['combatants'][number]['id'],
        refId: null,
        type: 'pc',
        name: 'Brom',
        initiative: 14,
        maxHp: 28,
        currentHp: 20,
        conditions: [{ key: 'poisoned', label: 'Envenenado', color: 'green' }],
        hpVisibility: 'public',
      },
    ],
    combat: { active: true, round: 2, order: ['cbt_1' as LiveTable['combatants'][number]['id']], currentTurnIndex: 0 },
    rollLog: [
      {
        id: 'roll_1',
        byUserId: newUserId(),
        byLabel: 'Brom',
        notation: '1d20+5',
        results: [15],
        breakdown: '15 + 5',
        total: 20,
        tone: 'normal',
        visibility: 'public',
        at: '2024-01-01T00:00:00.000Z',
      },
    ],
    eventLog: [
      { id: 'evt_1', text: 'Empieza la ronda 2', color: 'blue', visibility: 'public', at: '2024-01-01T00:00:00.000Z' },
    ],
    dmNotes: 'El dragón está dormido.',
    version: 3,
    ...overrides,
  };
}

describe.skipIf(!DATABASE_URL)('Postgres repositories (integration)', () => {
  let sql: Sql;

  beforeAll(async () => {
    sql = createSqlClient(DATABASE_URL as string);
    await migrate(sql);
    // Scratch tables — clear between runs so lookups (email/joinCode/etc.) don't collide.
    await sql`TRUNCATE users, campaigns, characters, live_tables`;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe('PostgresUserRepository', () => {
    it('round-trips save -> findById (proves rehydration)', async () => {
      const repo = new PostgresUserRepository(sql);
      const user = makeUser();

      await repo.save(user);
      const found = await repo.findById(user.id);

      expect(found).toEqual(user);
    });

    it('findById returns null for an unknown id', async () => {
      const repo = new PostgresUserRepository(sql);
      expect(await repo.findById(newUserId())).toBeNull();
    });

    it('findByEmail finds a saved user by exact email', async () => {
      const repo = new PostgresUserRepository(sql);
      const user = makeUser();
      await repo.save(user);

      expect(await repo.findByEmail(user.email)).toEqual(user);
    });

    it('findByEmail returns null when no user matches', async () => {
      const repo = new PostgresUserRepository(sql);
      expect(await repo.findByEmail('nope-nobody@example.com')).toBeNull();
    });

    it('save upserts (overwrites) an existing user with the same id', async () => {
      const repo = new PostgresUserRepository(sql);
      const user = makeUser();
      await repo.save(user);

      const updated = { ...user, displayName: 'Lyra the Bold' };
      await repo.save(updated);

      expect(await repo.findById(user.id)).toEqual(updated);
    });
  });

  describe('PostgresCampaignRepository', () => {
    it('round-trips save -> findById (proves rehydration)', async () => {
      const repo = new PostgresCampaignRepository(sql);
      const campaign = makeCampaign();

      await repo.save(campaign);

      expect(await repo.findById(campaign.id)).toEqual(campaign);
    });

    it('findByJoinCode finds a saved campaign by exact join code', async () => {
      const repo = new PostgresCampaignRepository(sql);
      const campaign = makeCampaign();
      await repo.save(campaign);

      expect(await repo.findByJoinCode(campaign.joinCode)).toEqual(campaign);
    });

    it('findByJoinCode returns null when no campaign matches', async () => {
      const repo = new PostgresCampaignRepository(sql);
      expect(await repo.findByJoinCode('NOPE-00000')).toBeNull();
    });

    it('listForUser returns campaigns where the user is a member', async () => {
      const repo = new PostgresCampaignRepository(sql);
      const playerId = newUserId();
      const campaign = makeCampaign({
        members: [
          { userId: newUserId(), role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' },
          { userId: playerId, role: 'player', joinedAt: '2024-01-02T00:00:00.000Z' },
        ],
      });
      const otherCampaign = makeCampaign();
      await repo.save(campaign);
      await repo.save(otherCampaign);

      const found = await repo.listForUser(playerId);

      expect(found).toEqual([campaign]);
    });

    it('listForUser returns an empty array when the user has no campaigns', async () => {
      const repo = new PostgresCampaignRepository(sql);
      expect(await repo.listForUser(newUserId())).toEqual([]);
    });

    it('save upserts (overwrites) an existing campaign with the same id', async () => {
      const repo = new PostgresCampaignRepository(sql);
      const campaign = makeCampaign();
      await repo.save(campaign);

      const updated = { ...campaign, sessionCount: campaign.sessionCount + 1 };
      await repo.save(updated);

      expect(await repo.findById(campaign.id)).toEqual(updated);
    });
  });

  describe('PostgresCharacterRepository', () => {
    it('round-trips save -> findById (proves rehydration)', async () => {
      const repo = new PostgresCharacterRepository(sql);
      const character = makeCharacter();

      await repo.save(character);

      expect(await repo.findById(character.id)).toEqual(character);
    });

    it('findById returns null for an unknown id', async () => {
      const repo = new PostgresCharacterRepository(sql);
      expect(await repo.findById(newCharacterId())).toBeNull();
    });

    it('listByCampaign returns sheets linked to that campaign only', async () => {
      const repo = new PostgresCharacterRepository(sql);
      const campaignId = newCampaignId();
      const a = makeCharacter({ campaignId });
      const b = makeCharacter({ campaignId });
      const other = makeCharacter();
      await repo.save(a);
      await repo.save(b);
      await repo.save(other);

      const found = await repo.listByCampaign(campaignId);

      expect(found).toHaveLength(2);
      expect(found).toEqual(expect.arrayContaining([a, b]));
    });

    it('listByCampaign returns an empty array when no sheets are linked', async () => {
      const repo = new PostgresCharacterRepository(sql);
      expect(await repo.listByCampaign(newCampaignId())).toEqual([]);
    });
  });

  describe('PostgresLiveTableRepository', () => {
    it('round-trips save -> findById unchanged (proves a LiveTable survives save/reload)', async () => {
      const repo = new PostgresLiveTableRepository(sql);
      const table = makeLiveTable();

      await repo.save(table);
      const found = await repo.findById(table.id);

      expect(found).toEqual(table);
    });

    it('findById returns null for an unknown id', async () => {
      const repo = new PostgresLiveTableRepository(sql);
      expect(await repo.findById(newLiveTableId())).toBeNull();
    });

    it('findByCampaignId finds the table for a campaign', async () => {
      const repo = new PostgresLiveTableRepository(sql);
      const campaignId = newCampaignId();
      const table = makeLiveTable({ campaignId });
      await repo.save(table);

      expect(await repo.findByCampaignId(campaignId)).toEqual(table);
    });

    it('findByCampaignId returns null when no table exists for the campaign', async () => {
      const repo = new PostgresLiveTableRepository(sql);
      expect(await repo.findByCampaignId(newCampaignId())).toBeNull();
    });

    it('save upserts (overwrites) the existing table with the same id', async () => {
      const repo = new PostgresLiveTableRepository(sql);
      const table = makeLiveTable();
      await repo.save(table);

      const updated = { ...table, version: table.version + 1, dmNotes: 'Actualizado' };
      await repo.save(updated);

      expect(await repo.findById(table.id)).toEqual(updated);
    });
  });
});
