import type { Sql } from 'postgres';
import type { MapRepository } from '../../application/ports.js';
import type { CampaignId, MapId } from '../../domain/ids.js';
import type { MapData } from '../../domain/maps/index.js';
import { toSnapshot, toSnapshots } from './rows.js';

/**
 * Postgres-backed `MapRepository`: JSONB snapshot in `maps`, keyed by id,
 * listed by campaign via the `campaign_id` lookup column.
 */
export class PostgresMapRepository implements MapRepository {
  constructor(private readonly sql: Sql) {}

  async save(map: MapData): Promise<void> {
    await this.sql`
      INSERT INTO maps (id, campaign_id, name, data, created_at, updated_at)
      VALUES (
        ${map.id},
        ${map.campaignId},
        ${map.name},
        ${this.sql.json(JSON.parse(JSON.stringify(map)))},
        ${map.createdAt},
        ${map.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        name        = EXCLUDED.name,
        data        = EXCLUDED.data,
        updated_at  = EXCLUDED.updated_at
    `;
  }

  async findById(id: MapId): Promise<MapData | null> {
    const rows = await this.sql<{ data: MapData }[]>`
      SELECT data FROM maps WHERE id = ${id}
    `;
    return toSnapshot(rows[0]);
  }

  async listByCampaign(campaignId: CampaignId): Promise<MapData[]> {
    const rows = await this.sql<{ data: MapData }[]>`
      SELECT data FROM maps WHERE campaign_id = ${campaignId}
    `;
    return toSnapshots(rows);
  }

  async delete(id: MapId): Promise<void> {
    await this.sql`DELETE FROM maps WHERE id = ${id}`;
  }
}