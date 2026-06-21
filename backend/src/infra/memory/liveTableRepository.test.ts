import { describe, expect, it } from 'vitest';
import { InMemoryLiveTableRepository } from './liveTableRepository.js';
import { newCampaignId, newLiveTableId } from '../../domain/ids.js';
import type { LiveTable } from '../../domain/types.js';

function makeLiveTable(overrides: Partial<LiveTable> = {}): LiveTable {
  return {
    id: newLiveTableId(),
    campaignId: newCampaignId(),
    combatants: [],
    combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
    rollLog: [],
    eventLog: [],
    dmNotes: '',
    version: 0,
    ...overrides,
  };
}

describe('InMemoryLiveTableRepository', () => {
  it('round-trips save -> findById', async () => {
    const repo = new InMemoryLiveTableRepository();
    const table = makeLiveTable();

    await repo.save(table);

    expect(await repo.findById(table.id)).toEqual(table);
  });

  it('findById returns null for an unknown id', async () => {
    const repo = new InMemoryLiveTableRepository();
    expect(await repo.findById(newLiveTableId())).toBeNull();
  });

  it('findByCampaignId finds the table for a campaign', async () => {
    const repo = new InMemoryLiveTableRepository();
    const campaignId = newCampaignId();
    const table = makeLiveTable({ campaignId });

    await repo.save(table);

    expect(await repo.findByCampaignId(campaignId)).toEqual(table);
  });

  it('findByCampaignId returns null when no table exists for the campaign', async () => {
    const repo = new InMemoryLiveTableRepository();
    expect(await repo.findByCampaignId(newCampaignId())).toBeNull();
  });

  it('save overwrites the existing table with the same id', async () => {
    const repo = new InMemoryLiveTableRepository();
    const table = makeLiveTable();
    await repo.save(table);

    const updated = { ...table, version: table.version + 1 };
    await repo.save(updated);

    expect(await repo.findById(table.id)).toEqual(updated);
  });
});
