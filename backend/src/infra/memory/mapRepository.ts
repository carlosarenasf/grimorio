import type { MapRepository } from '../../application/ports.js';
import type { CampaignId, MapId } from '../../domain/ids.js';
import type { MapData } from '../../domain/maps/index.js';

/** Map-backed `MapRepository` for tests and local dev (no persistence). */
export class InMemoryMapRepository implements MapRepository {
  private readonly byId = new Map<MapId, MapData>();

  async save(map: MapData): Promise<void> {
    this.byId.set(map.id, structuredCloneSafe(map));
  }

  async findById(id: MapId): Promise<MapData | null> {
    const map = this.byId.get(id);
    return map ? structuredCloneSafe(map) : null;
  }

  async listByCampaign(campaignId: CampaignId): Promise<MapData[]> {
    const result: MapData[] = [];
    for (const map of this.byId.values()) {
      if (map.campaignId === campaignId) {
        result.push(structuredCloneSafe(map));
      }
    }
    return result;
  }

  async delete(id: MapId): Promise<void> {
    this.byId.delete(id);
  }
}

/** Defensive deep clone so callers can't mutate stored snapshots by reference. */
function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}