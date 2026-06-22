import type { MasterSnapshot } from '@grimorio/shared/wire';
import type { MonsterSummary, SrdSource } from './types';

/**
 * A representative MasterSnapshot for tests/stories: a PC, a dm_only monster
 * (with real numeric HP, since the master sees everything), an active combat,
 * a public roll, a private (hidden) roll, an event, and dm notes.
 */
export function makeMasterSnapshot(
  overrides: Partial<MasterSnapshot> = {},
): MasterSnapshot {
  return {
    viewerRole: 'dm',
    liveTableId: 'lt-1',
    campaignId: 'camp-1',
    dmNotes: 'El altar esconde una trampa de fuego.',
    combatants: [
      {
        id: 'pc-1',
        type: 'pc',
        name: 'Lyra',
        initiative: 18,
        conditions: [{ key: 'blessed', label: 'Bendecida', color: '#7C9A82' }],
        currentHp: 24,
        maxHp: 30,
      },
      {
        id: 'mon-1',
        type: 'monster',
        name: 'Dragón joven',
        initiative: 15,
        conditions: [],
        // Master sees real HP even for a dm_only monster.
        currentHp: 90,
        maxHp: 178,
      },
    ],
    combat: {
      active: true,
      round: 2,
      order: ['pc-1', 'mon-1'],
      currentTurnIndex: 0,
    },
    rollLog: [
      {
        id: 'r-1',
        byUserId: 'u-1',
        byLabel: 'Lyra',
        notation: '1d20+5',
        results: [14],
        breakdown: '14 + 5',
        total: 19,
        tone: 'normal',
        visibility: 'public',
        at: '2026-06-21T10:00:00.000Z',
      },
      {
        id: 'r-2',
        byUserId: 'dm-1',
        byLabel: 'Máster',
        notation: '1d20',
        results: [3],
        breakdown: '3',
        total: 3,
        tone: 'normal',
        visibility: 'dm_only',
        at: '2026-06-21T10:01:00.000Z',
      },
    ],
    eventLog: [
      {
        id: 'e-1',
        text: 'Empieza el combate.',
        color: '#C9A227',
        visibility: 'public',
        at: '2026-06-21T09:59:00.000Z',
      },
    ],
    version: 7,
    ...overrides,
  };
}

const SAMPLE_MONSTERS: MonsterSummary[] = [
  { id: 'goblin', name: 'Goblin', cr: '1/4', kind: 'Humanoide pequeño', hp: 7 },
  { id: 'orc', name: 'Orco', cr: '1/2', kind: 'Humanoide mediano', hp: 15 },
  { id: 'young-red-dragon', name: 'Dragón rojo joven', cr: '10', kind: 'Dragón grande', hp: 178 },
];

/** A tiny in-memory SRD source for tests/stories. */
export function makeSrdSource(monsters: MonsterSummary[] = SAMPLE_MONSTERS): SrdSource {
  return {
    searchMonsters(query: string) {
      const q = query.trim().toLowerCase();
      if (!q) return monsters;
      return monsters.filter((m) => m.name.toLowerCase().includes(q));
    },
  };
}
