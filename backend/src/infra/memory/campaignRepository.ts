import type { CampaignRepository } from '../../application/ports.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';

/** Map-backed `CampaignRepository` for tests and local dev (no persistence). */
export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly byId = new Map<CampaignId, Campaign>();

  async save(campaign: Campaign): Promise<void> {
    this.byId.set(campaign.id, { ...campaign });
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    const campaign = this.byId.get(id);
    return campaign ? { ...campaign } : null;
  }

  async findByJoinCode(joinCode: string): Promise<Campaign | null> {
    for (const campaign of this.byId.values()) {
      if (campaign.joinCode === joinCode) return { ...campaign };
    }
    return null;
  }

  async listForUser(userId: UserId): Promise<Campaign[]> {
    const result: Campaign[] = [];
    for (const campaign of this.byId.values()) {
      if (campaign.members.some((m) => m.userId === userId)) {
        result.push({ ...campaign });
      }
    }
    return result;
  }
}
