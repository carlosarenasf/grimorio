import type { Sql } from 'postgres';
import type { CampaignRepository } from '../../application/ports.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';
import { toSnapshot, toSnapshots } from './rows.js';

/**
 * Postgres-backed `CampaignRepository`: JSONB snapshot in `campaigns`, keyed
 * by id, looked up by join code or by membership.
 *
 * `listForUser` derives membership from the JSONB `data.members` array (see
 * migrations/001_init.sql for the rationale) rather than a join table: it
 * uses a JSONB containment query (`data -> 'members' @> '[{"userId": ...}]'`)
 * so the lookup stays a single indexed query without a second table to keep
 * in sync on every `save`.
 */
export class PostgresCampaignRepository implements CampaignRepository {
  constructor(private readonly sql: Sql) {}

  async save(campaign: Campaign): Promise<void> {
    await this.sql`
      INSERT INTO campaigns (id, join_code, data)
      VALUES (${campaign.id}, ${campaign.joinCode}, ${this.sql.json(JSON.parse(JSON.stringify(campaign)))})
      ON CONFLICT (id) DO UPDATE SET join_code = EXCLUDED.join_code, data = EXCLUDED.data
    `;
  }

  async findById(id: CampaignId): Promise<Campaign | null> {
    const rows = await this.sql<{ data: Campaign }[]>`
      SELECT data FROM campaigns WHERE id = ${id}
    `;
    return toSnapshot(rows[0]);
  }

  async findByJoinCode(joinCode: string): Promise<Campaign | null> {
    const rows = await this.sql<{ data: Campaign }[]>`
      SELECT data FROM campaigns WHERE join_code = ${joinCode}
    `;
    return toSnapshot(rows[0]);
  }

  async listForUser(userId: UserId): Promise<Campaign[]> {
    const rows = await this.sql<{ data: Campaign }[]>`
      SELECT data FROM campaigns
      WHERE data -> 'members' @> ${this.sql.json([{ userId }])}
    `;
    return toSnapshots(rows);
  }
}
