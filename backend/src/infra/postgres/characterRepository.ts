import type { Sql } from 'postgres';
import type { CharacterRepository } from '../../application/ports.js';
import type { CampaignId, CharacterId } from '../../domain/ids.js';
import type { CharacterSheet } from '../../domain/types.js';
import { toJsonbParam, toSnapshot, toSnapshots } from './rows.js';

/** Postgres-backed `CharacterRepository`: JSONB snapshot in `characters`, keyed by id, listed by campaign. */
export class PostgresCharacterRepository implements CharacterRepository {
  constructor(private readonly sql: Sql) {}

  async save(character: CharacterSheet): Promise<void> {
    await this.sql`
      INSERT INTO characters (id, campaign_id, data)
      VALUES (${character.id}, ${character.campaignId}, ${toJsonbParam(character)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET campaign_id = EXCLUDED.campaign_id, data = EXCLUDED.data
    `;
  }

  async findById(id: CharacterId): Promise<CharacterSheet | null> {
    const rows = await this.sql<{ data: CharacterSheet }[]>`
      SELECT data FROM characters WHERE id = ${id}
    `;
    return toSnapshot(rows[0]);
  }

  async listByCampaign(campaignId: CampaignId): Promise<CharacterSheet[]> {
    const rows = await this.sql<{ data: CharacterSheet }[]>`
      SELECT data FROM characters WHERE campaign_id = ${campaignId}
    `;
    return toSnapshots(rows);
  }
}
