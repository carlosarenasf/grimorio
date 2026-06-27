import type { Sql } from 'postgres';
import type { LiveTableRepository } from '../../application/ports.js';
import type { CampaignId, LiveTableId } from '../../domain/ids.js';
import type { LiveTable } from '../../domain/types.js';
import { toSnapshot } from './rows.js';

/** Postgres-backed `LiveTableRepository`: JSONB snapshot in `live_tables`, one room per campaign. */
export class PostgresLiveTableRepository implements LiveTableRepository {
  constructor(private readonly sql: Sql) {}

  async save(table: LiveTable): Promise<void> {
    await this.sql`
      INSERT INTO live_tables (id, campaign_id, data)
      VALUES (${table.id}, ${table.campaignId}, ${this.sql.json(JSON.parse(JSON.stringify(table)))})
      ON CONFLICT (id) DO UPDATE SET campaign_id = EXCLUDED.campaign_id, data = EXCLUDED.data
    `;
  }

  async findById(id: LiveTableId): Promise<LiveTable | null> {
    const rows = await this.sql<{ data: LiveTable }[]>`
      SELECT data FROM live_tables WHERE id = ${id}
    `;
    return toSnapshot(rows[0]);
  }

  async findByCampaignId(campaignId: CampaignId): Promise<LiveTable | null> {
    const rows = await this.sql<{ data: LiveTable }[]>`
      SELECT data FROM live_tables WHERE campaign_id = ${campaignId}
    `;
    return toSnapshot(rows[0]);
  }
}
