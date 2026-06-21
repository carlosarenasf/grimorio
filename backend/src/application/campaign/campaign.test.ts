import { describe, expect, it } from 'vitest';
import { FakeClock, makeInMemoryRepos, SeededRng } from '../../testing/index.js';
import type { UserId } from '../../domain/ids.js';
import { newUserId } from '../../domain/ids.js';
import {
  createCampaign,
  Forbidden,
  issueInvite,
  joinByCode,
  listCampaignsForUser,
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
