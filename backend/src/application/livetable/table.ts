/**
 * LiveTable lifecycle helpers shared by the HTTP snapshot endpoint and the WS
 * gateway: one live room per campaign, created lazily and rehydrated from the
 * repository (SPEC §8 — memory is a cache, Postgres is the truth).
 */
import type { LiveTable } from '../../domain/types.js';
import { newLiveTableId, type CampaignId } from '../../domain/ids.js';
import type { LiveTableRepository } from '../ports.js';

export function emptyLiveTable(campaignId: CampaignId): LiveTable {
  return {
    id: newLiveTableId(),
    campaignId,
    combatants: [],
    combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
    rollLog: [],
    eventLog: [],
    dmNotes: '',
    version: 0,
  };
}

/** Fetch the campaign's live table, creating and persisting an empty one if absent. */
export async function getOrCreateLiveTable(
  campaignId: CampaignId,
  tables: LiveTableRepository,
): Promise<LiveTable> {
  const existing = await tables.findByCampaignId(campaignId);
  if (existing) return existing;
  const fresh = emptyLiveTable(campaignId);
  await tables.save(fresh);
  return fresh;
}
