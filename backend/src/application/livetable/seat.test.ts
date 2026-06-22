import { describe, expect, it } from 'vitest';
import { seatCharacter } from './seat.js';
import { emptyLiveTable } from './table.js';
import { newCampaignId, newCharacterId, newUserId } from '../../domain/ids.js';
import type { CharacterSheet } from '../../domain/types.js';
import { FakeClock } from '../../testing/index.js';

function sheet(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: newCharacterId(),
    campaignId: newCampaignId(),
    ownerId: newUserId(),
    name: 'Lyra',
    species: 'Elfo',
    className: 'Explorador',
    background: 'Forastero',
    level: 5,
    scores: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 11 },
    maxHp: 38,
    currentHp: 31,
    armorClass: 16,
    speed: 10.5,
    proficientSkills: [],
    attacks: [],
    inventory: [],
    gold: 0,
    notes: '',
    visibility: 'owner',
    ...overrides,
  };
}

describe('seatCharacter', () => {
  it('adds a PC combatant linked to the character and its owner', () => {
    const table = emptyLiveTable(newCampaignId());
    const s = sheet();
    const result = seatCharacter(table, s, new FakeClock());
    expect(result).not.toBeNull();
    const t = result!.table;
    expect(t.combatants).toHaveLength(1);
    const c = t.combatants[0];
    expect(c.type).toBe('pc');
    expect(c.refId).toBe(s.id); // refId holds the CharacterId
    expect(c.controllerUserId).toBe(s.ownerId);
    expect(c.hpVisibility).toBe('public');
    expect(c.maxHp).toBe(38);
    expect(c.currentHp).toBe(31);
    expect(result!.event.type).toBe('CombatantAdded');
  });

  it('is idempotent — returns null when the character is already seated', () => {
    const table = emptyLiveTable(newCampaignId());
    const s = sheet();
    const first = seatCharacter(table, s, new FakeClock())!;
    const second = seatCharacter(first.table, s, new FakeClock());
    expect(second).toBeNull();
  });

  it('appends the new combatant to the turn order when combat is active', () => {
    const base = emptyLiveTable(newCampaignId());
    const active = { ...base, combat: { ...base.combat, active: true } };
    const s = sheet();
    const result = seatCharacter(active, s, new FakeClock())!;
    expect(result.table.combat.order).toContain(result.table.combatants[0].id);
  });
});
