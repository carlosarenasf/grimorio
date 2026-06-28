import { describe, expect, it } from 'vitest';
import { InMemoryCampaignRepository } from './campaignRepository.js';
import { newCampaignId, newUserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  const ownerId = overrides.ownerId ?? newUserId();
  return {
    id: newCampaignId(),
    ownerId,
    name: 'La Maldición',
    tagline: 'Una aventura oscura',
    status: 'planning',
    joinCode: 'RAVEN-77',
    members: [{ userId: ownerId, role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' }],
    characterIds: [],
    sessionCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryCampaignRepository', () => {
  it('round-trips save -> findById', async () => {
    const repo = new InMemoryCampaignRepository();
    const campaign = makeCampaign();

    await repo.save(campaign);

    expect(await repo.findById(campaign.id)).toEqual(campaign);
  });

  it('findById returns null for an unknown id', async () => {
    const repo = new InMemoryCampaignRepository();
    expect(await repo.findById(newCampaignId())).toBeNull();
  });

  it('findByJoinCode finds a saved campaign by exact code', async () => {
    const repo = new InMemoryCampaignRepository();
    const campaign = makeCampaign({ joinCode: 'WOLF-12' });

    await repo.save(campaign);

    expect(await repo.findByJoinCode('WOLF-12')).toEqual(campaign);
  });

  it('findByJoinCode returns null when no campaign matches', async () => {
    const repo = new InMemoryCampaignRepository();
    await repo.save(makeCampaign({ joinCode: 'WOLF-12' }));

    expect(await repo.findByJoinCode('NOPE-00')).toBeNull();
  });

  it('listForUser returns campaigns where the user is a member', async () => {
    const repo = new InMemoryCampaignRepository();
    const dm = newUserId();
    const player = newUserId();
    const other = newUserId();

    const campaign = makeCampaign({
      ownerId: dm,
      members: [
        { userId: dm, role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' },
        { userId: player, role: 'player', joinedAt: '2024-01-02T00:00:00.000Z' },
      ],
    });
    await repo.save(campaign);

    expect(await repo.listForUser(player)).toEqual([campaign]);
    expect(await repo.listForUser(dm)).toEqual([campaign]);
    expect(await repo.listForUser(other)).toEqual([]);
  });

  it('listForUser returns multiple campaigns for the same member', async () => {
    const repo = new InMemoryCampaignRepository();
    const userId = newUserId();
    const campaignA = makeCampaign({
      ownerId: userId,
      members: [{ userId, role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' }],
    });
    const campaignB = makeCampaign({
      members: [
        { userId: newUserId(), role: 'dm', joinedAt: '2024-01-01T00:00:00.000Z' },
        { userId, role: 'player', joinedAt: '2024-01-02T00:00:00.000Z' },
      ],
    });

    await repo.save(campaignA);
    await repo.save(campaignB);

    const result = await repo.listForUser(userId);
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([campaignA, campaignB]));
  });

  it('delete removes the campaign by id', async () => {
    const repo = new InMemoryCampaignRepository();
    const campaign = makeCampaign();
    await repo.save(campaign);

    await repo.delete(campaign.id);

    expect(await repo.findById(campaign.id)).toBeNull();
  });

  it('delete is a no-op when the id does not exist', async () => {
    const repo = new InMemoryCampaignRepository();
    await repo.delete(newCampaignId());
  });
});
