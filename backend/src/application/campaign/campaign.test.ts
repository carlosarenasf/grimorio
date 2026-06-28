import { describe, expect, it } from 'vitest';
import { FakeClock, makeInMemoryRepos, SeededRng } from '../../testing/index.js';
import type { UserId } from '../../domain/ids.js';
import { newUserId } from '../../domain/ids.js';
import {
  createCampaign,
  deleteCampaign,
  Forbidden,
  issueInvite,
  joinByCode,
  listCampaignsForUser,
  NotFound,
  NotOwner,
  UnknownCode,
  updateCampaign,
} from './index.js';

function makeDeps() {
  const repos = makeInMemoryRepos();
  const clock = new FakeClock();
  const rng = new SeededRng([0, 1]);
  return { repos, clock, rng };
}

describe('createCampaign', () => {
  it('persists and returns a campaign with owner as dm, status planning', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'La Mina Perdida', tagline: 'Una aventura clásica' },
      { campaigns: repos.campaigns, clock, rng },
    );

    expect(campaign.ownerId).toBe(ownerId);
    expect(campaign.status).toBe('planning');
    expect(campaign.members).toEqual([
      expect.objectContaining({ userId: ownerId, role: 'dm' }),
    ]);

    const persisted = await repos.campaigns.findById(campaign.id);
    expect(persisted).toEqual(campaign);
  });
});

describe('updateCampaign', () => {
  it('rejects a non-owner with Forbidden', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();
    const intruderId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await expect(
      updateCampaign(
        { campaignId: campaign.id, actorId: intruderId, name: 'Hacked' },
        { campaigns: repos.campaigns },
      ),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('lets the owner change fields', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag original' },
      { campaigns: repos.campaigns, clock, rng },
    );

    const updated = await updateCampaign(
      {
        campaignId: campaign.id,
        actorId: ownerId,
        name: 'Nuevo nombre',
        tagline: 'nuevo tagline',
        status: 'active',
      },
      { campaigns: repos.campaigns },
    );

    expect(updated.name).toBe('Nuevo nombre');
    expect(updated.tagline).toBe('nuevo tagline');
    expect(updated.status).toBe('active');

    const persisted = await repos.campaigns.findById(campaign.id);
    expect(persisted?.name).toBe('Nuevo nombre');
  });
});

describe('issueInvite', () => {
  it('rejects a non-dm with Forbidden', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();
    const intruderId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await expect(
      issueInvite({ campaignId: campaign.id, actorId: intruderId }, { campaigns: repos.campaigns, rng }),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it('regenerates the join code for the dm', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );
    const originalCode = campaign.joinCode;

    const updated = await issueInvite(
      { campaignId: campaign.id, actorId: ownerId },
      { campaigns: repos.campaigns, rng: new SeededRng([5, 42]) },
    );

    expect(updated.joinCode).not.toBe(originalCode);
  });
});

describe('joinByCode', () => {
  it('rejects an unknown code with UnknownCode', async () => {
    const { repos } = makeDeps();
    const userId: UserId = newUserId();

    await expect(
      joinByCode({ joinCode: 'NOPE-00', userId }, { campaigns: repos.campaigns }),
    ).rejects.toBeInstanceOf(UnknownCode);
  });

  it('adds the user as player on a valid code', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();
    const playerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    const joined = await joinByCode(
      { joinCode: campaign.joinCode, userId: playerId },
      { campaigns: repos.campaigns },
    );

    expect(joined.members).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: playerId, role: 'player' })]),
    );
  });

  it('is idempotent: joining twice does not duplicate the member', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();
    const playerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await joinByCode({ joinCode: campaign.joinCode, userId: playerId }, { campaigns: repos.campaigns });
    const second = await joinByCode(
      { joinCode: campaign.joinCode, userId: playerId },
      { campaigns: repos.campaigns },
    );

    const playerEntries = second.members.filter((m) => m.userId === playerId);
    expect(playerEntries).toHaveLength(1);
  });
});

describe('listCampaignsForUser', () => {
  it('returns only the campaigns the user belongs to', async () => {
    const { repos, clock } = makeDeps();
    const ownerA: UserId = newUserId();
    const ownerB: UserId = newUserId();

    const campaignA = await createCampaign(
      { ownerId: ownerA, name: 'Campaña A', tagline: 'tag A' },
      { campaigns: repos.campaigns, clock, rng: new SeededRng([0]) },
    );
    const campaignB = await createCampaign(
      { ownerId: ownerB, name: 'Campaña B', tagline: 'tag B' },
      { campaigns: repos.campaigns, clock, rng: new SeededRng([1]) },
    );

    const listA = await listCampaignsForUser(ownerA, { campaigns: repos.campaigns });
    const listB = await listCampaignsForUser(ownerB, { campaigns: repos.campaigns });

    expect(listA.map((c) => c.id)).toEqual([campaignA.id]);
    expect(listB.map((c) => c.id)).toEqual([campaignB.id]);
  });
});

describe('deleteCampaign', () => {
  it('throws NotFound for a non-existent campaign', async () => {
    const { repos } = makeDeps();
    await expect(
      deleteCampaign(
        { campaignId: 'cmp-nonexistent' as any, actorId: newUserId() },
        { campaigns: repos.campaigns, characters: repos.characters, tables: repos.liveTables },
      ),
    ).rejects.toBeInstanceOf(NotFound);
  });

  it('throws NotOwner when a non-owner tries to delete', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();
    const intruderId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'Original', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await expect(
      deleteCampaign(
        { campaignId: campaign.id, actorId: intruderId },
        { campaigns: repos.campaigns, characters: repos.characters, tables: repos.liveTables },
      ),
    ).rejects.toBeInstanceOf(NotOwner);
  });

  it('deletes the campaign when the owner calls it', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'A borrar', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await deleteCampaign(
      { campaignId: campaign.id, actorId: ownerId },
      { campaigns: repos.campaigns, characters: repos.characters, tables: repos.liveTables },
    );

    expect(await repos.campaigns.findById(campaign.id)).toBeNull();
  });

  it('also deletes characters and live table associated with the campaign', async () => {
    const { repos, clock, rng } = makeDeps();
    const ownerId: UserId = newUserId();

    const campaign = await createCampaign(
      { ownerId, name: 'A borrar', tagline: 'tag' },
      { campaigns: repos.campaigns, clock, rng },
    );

    await repos.characters.save({
      id: 'chr-1' as any,
      campaignId: campaign.id,
      ownerId,
      name: 'Brom',
      species: 'Elfo',
      className: 'Explorador',
      background: 'Forastero',
      level: 1,
      scores: { str: 10, dex: 14, con: 12, int: 10, wis: 12, cha: 8 },
      maxHp: 10,
      currentHp: 10,
      armorClass: 14,
      speed: 9,
      proficientSkills: [],
      attacks: [],
      inventory: [],
      gold: 0,
      notes: '',
      visibility: 'owner',
    });

    await repos.liveTables.save({
      id: 'tbl-1' as any,
      campaignId: campaign.id,
      combatants: [],
      combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
      rollLog: [],
      eventLog: [],
      dmNotes: '',
      version: 0,
    });

    await deleteCampaign(
      { campaignId: campaign.id, actorId: ownerId },
      { campaigns: repos.campaigns, characters: repos.characters, tables: repos.liveTables },
    );

    expect(await repos.characters.listByCampaign(campaign.id)).toEqual([]);
    expect(await repos.liveTables.findByCampaignId(campaign.id)).toBeNull();
    expect(await repos.campaigns.findById(campaign.id)).toBeNull();
  });
});
