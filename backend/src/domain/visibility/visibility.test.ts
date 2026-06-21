import { describe, expect, it } from 'vitest';
import { hpStatusLabel } from './statusLabel.js';
import { projectCombatant, projectLiveTable } from './project.js';
import type { Combatant, LiveTable } from '../types.js';
import type { CombatantId, LiveTableId, CampaignId, UserId } from '../ids.js';

const dmViewer = { userId: 'usr_dm' as UserId, role: 'dm' as const };
const playerViewer = { userId: 'usr_player' as UserId, role: 'player' as const };

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'cbt_1' as CombatantId,
    refId: null,
    type: 'monster',
    name: 'Goblin',
    initiative: 12,
    maxHp: 20,
    currentHp: 20,
    conditions: [],
    hpVisibility: 'dm_only',
    ...overrides,
  };
}

function makeLiveTable(overrides: Partial<LiveTable> = {}): LiveTable {
  return {
    id: 'tbl_1' as LiveTableId,
    campaignId: 'cmp_1' as CampaignId,
    combatants: [],
    combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
    rollLog: [],
    eventLog: [],
    dmNotes: '',
    version: 1,
    ...overrides,
  };
}

describe('hpStatusLabel', () => {
  it('returns Intacto at full hp', () => {
    expect(hpStatusLabel(20, 20)).toBe('Intacto');
  });

  it('returns Herido at 50% hp', () => {
    expect(hpStatusLabel(10, 20)).toBe('Herido');
  });

  it('returns Malherido at 20% hp', () => {
    expect(hpStatusLabel(4, 20)).toBe('Malherido');
  });

  it('returns Caído at 0 hp', () => {
    expect(hpStatusLabel(0, 20)).toBe('Caído');
  });

  it('returns Intacto just above the 0.66 boundary', () => {
    expect(hpStatusLabel(14, 20)).toBe('Intacto'); // 0.70
  });

  it('returns Herido exactly at the 0.66 boundary', () => {
    expect(hpStatusLabel(13.2, 20)).toBe('Herido'); // 0.66 exactly
  });

  it('returns Malherido exactly at the 0.33 boundary', () => {
    expect(hpStatusLabel(6.6, 20)).toBe('Malherido'); // 0.33 exactly
  });

  it('returns Caído for negative hp', () => {
    expect(hpStatusLabel(-5, 20)).toBe('Caído');
  });
});

describe('projectCombatant', () => {
  it('gives the master numeric HP for a dm_only monster', () => {
    const c = makeCombatant({ hpVisibility: 'dm_only', currentHp: 5, maxHp: 20 });
    const dto = projectCombatant(c, dmViewer);
    expect(dto.currentHp).toBe(5);
    expect(dto.maxHp).toBe(20);
    expect(dto.statusLabel).toBeUndefined();
  });

  it('omits numeric HP and gives a statusLabel to a player for a dm_only monster', () => {
    const c = makeCombatant({ hpVisibility: 'dm_only', currentHp: 5, maxHp: 20 });
    const dto = projectCombatant(c, playerViewer);
    expect(dto.currentHp).toBeUndefined();
    expect(dto.maxHp).toBeUndefined();
    expect(dto.statusLabel).toBe('Malherido');
  });

  it('gives numeric HP to both master and player for a public PC', () => {
    const c = makeCombatant({ type: 'pc', hpVisibility: 'public', currentHp: 15, maxHp: 30 });
    const masterDto = projectCombatant(c, dmViewer);
    const playerDto = projectCombatant(c, playerViewer);
    expect(masterDto.currentHp).toBe(15);
    expect(masterDto.maxHp).toBe(30);
    expect(playerDto.currentHp).toBe(15);
    expect(playerDto.maxHp).toBe(30);
    expect(playerDto.statusLabel).toBeUndefined();
  });

  it('carries over id, type, name, initiative and conditions unchanged', () => {
    const c = makeCombatant({
      id: 'cbt_42' as CombatantId,
      type: 'pc',
      name: 'Lyra',
      initiative: 18,
      hpVisibility: 'public',
      conditions: [{ key: 'blessed', label: 'Bendecido', color: '#fff' }],
    });
    const dto = projectCombatant(c, playerViewer);
    expect(dto.id).toBe('cbt_42');
    expect(dto.type).toBe('pc');
    expect(dto.name).toBe('Lyra');
    expect(dto.initiative).toBe(18);
    expect(dto.conditions).toEqual([{ key: 'blessed', label: 'Bendecido', color: '#fff' }]);
  });
});

describe('projectLiveTable — master snapshot', () => {
  it('includes dmNotes verbatim', () => {
    const table = makeLiveTable({ dmNotes: 'El dragón está dormido bajo el puente.' });
    const snapshot = projectLiveTable(table, dmViewer);
    expect(snapshot.viewerRole).toBe('dm');
    if (snapshot.viewerRole === 'dm') {
      expect(snapshot.dmNotes).toBe('El dragón está dormido bajo el puente.');
    }
  });

  it('includes numeric HP for dm_only combatants', () => {
    const table = makeLiveTable({
      combatants: [makeCombatant({ hpVisibility: 'dm_only', currentHp: 7, maxHp: 20 })],
    });
    const snapshot = projectLiveTable(table, dmViewer);
    expect(snapshot.combatants[0]?.currentHp).toBe(7);
  });

  it('includes dm_only dice rolls in the roll log', () => {
    const table = makeLiveTable({
      rollLog: [
        {
          id: 'roll_1',
          byUserId: 'usr_dm' as UserId,
          byLabel: 'Máster',
          notation: '1d20',
          results: [15],
          breakdown: '15',
          total: 15,
          tone: 'normal',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const snapshot = projectLiveTable(table, dmViewer);
    expect(snapshot.rollLog).toHaveLength(1);
  });

  it('includes dm_only combat events in the event log', () => {
    const table = makeLiveTable({
      eventLog: [
        {
          id: 'evt_1',
          text: 'El máster prepara una trampa secreta',
          color: '#000',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const snapshot = projectLiveTable(table, dmViewer);
    expect(snapshot.eventLog).toHaveLength(1);
  });
});

describe('projectLiveTable — player snapshot', () => {
  it('never contains a dmNotes field', () => {
    const table = makeLiveTable({ dmNotes: 'El dragón está dormido bajo el puente.' });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.viewerRole).toBe('player');
    expect('dmNotes' in snapshot).toBe(false);
  });

  it('never leaks the dmNotes text anywhere in the serialized snapshot', () => {
    const secret = 'El dragón está dormido bajo el puente.';
    const table = makeLiveTable({ dmNotes: secret });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(JSON.stringify(snapshot)).not.toContain(secret);
  });

  it('omits numeric HP and exposes only a statusLabel for a dm_only monster', () => {
    const table = makeLiveTable({
      combatants: [makeCombatant({ hpVisibility: 'dm_only', currentHp: 4, maxHp: 20 })],
    });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.combatants[0]?.currentHp).toBeUndefined();
    expect(snapshot.combatants[0]?.maxHp).toBeUndefined();
    expect(snapshot.combatants[0]?.statusLabel).toBe('Malherido');
  });

  it('shows numeric HP for public PCs', () => {
    const table = makeLiveTable({
      combatants: [makeCombatant({ type: 'pc', hpVisibility: 'public', currentHp: 25, maxHp: 30 })],
    });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.combatants[0]?.currentHp).toBe(25);
    expect(snapshot.combatants[0]?.maxHp).toBe(30);
  });

  it('excludes dm_only dice rolls from the roll log', () => {
    const table = makeLiveTable({
      rollLog: [
        {
          id: 'roll_1',
          byUserId: 'usr_dm' as UserId,
          byLabel: 'Máster',
          notation: '1d20',
          results: [15],
          breakdown: '15',
          total: 15,
          tone: 'normal',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'roll_2',
          byUserId: 'usr_player' as UserId,
          byLabel: 'Lyra',
          notation: '1d20',
          results: [10],
          breakdown: '10',
          total: 10,
          tone: 'normal',
          visibility: 'public',
          at: '2026-01-01T00:00:01.000Z',
        },
      ],
    });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.rollLog).toHaveLength(1);
    expect(snapshot.rollLog[0]?.id).toBe('roll_2');
  });

  it('excludes dm_only combat events from the event log', () => {
    const table = makeLiveTable({
      eventLog: [
        {
          id: 'evt_1',
          text: 'El máster prepara una trampa secreta',
          color: '#000',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'evt_2',
          text: 'Empieza la ronda 3',
          color: '#0f0',
          visibility: 'public',
          at: '2026-01-01T00:00:01.000Z',
        },
      ],
    });
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.eventLog).toHaveLength(1);
    expect(snapshot.eventLog[0]?.id).toBe('evt_2');
  });

  it('never leaks dm_only roll or event log text anywhere in the serialized snapshot', () => {
    const table = makeLiveTable({
      rollLog: [
        {
          id: 'roll_1',
          byUserId: 'usr_dm' as UserId,
          byLabel: 'Máster',
          notation: '1d20',
          results: [15],
          breakdown: '15',
          total: 15,
          tone: 'normal',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
      ],
      eventLog: [
        {
          id: 'evt_1',
          text: 'SECRETO_DEL_MASTER_UNICO',
          color: '#000',
          visibility: 'dm_only',
          at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const snapshot = projectLiveTable(table, playerViewer);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('roll_1');
    expect(json).not.toContain('SECRETO_DEL_MASTER_UNICO');
  });

  it('carries the viewer own character id', () => {
    const table = makeLiveTable();
    const snapshot = projectLiveTable(table, playerViewer);
    expect(snapshot.viewerRole).toBe('player');
    if (snapshot.viewerRole === 'player') {
      expect(snapshot).toHaveProperty('ownCharacterId');
    }
  });
});
