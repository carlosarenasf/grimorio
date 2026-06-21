import type { LiveTableRepository } from '../../application/ports.js';
import type { CampaignId, LiveTableId } from '../../domain/ids.js';
import type { LiveTable } from '../../domain/types.js';

/** Map-backed `LiveTableRepository` for tests and local dev (no persistence). */
export class InMemoryLiveTableRepository implements LiveTableRepository {
  private readonly byId = new Map<LiveTableId, LiveTable>();

  async save(table: LiveTable): Promise<void> {
    this.byId.set(table.id, { ...table });
  }

  async findById(id: LiveTableId): Promise<LiveTable | null> {
    const table = this.byId.get(id);
    return table ? { ...table } : null;
  }

  async findByCampaignId(campaignId: CampaignId): Promise<LiveTable | null> {
    for (const table of this.byId.values()) {
      if (table.campaignId === campaignId) return { ...table };
    }
    return null;
  }
}
