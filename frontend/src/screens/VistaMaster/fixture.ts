import type { MasterSnapshot } from '@grimorio/shared/wire';
import type { Monster, MonsterSummary, SrdSource } from './types';

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

/** A full monster stat block for tests. */
export function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'goblin',
    name: 'Goblin',
    cr: '1/4',
    meta: 'Humanoide Pequeño',
    ac: 15,
    hp: 7,
    speed: '9 m',
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    skills: ['Sigilo'],
    senses: ['visión en la oscuridad 18m'],
    languages: ['Común', 'Goblin'],
    traits: [
      { name: 'Agilidad de goblin', description: 'Puede moverse a través del espacio de cualquier criatura que sea de un tamaño mayor que el suyo.' },
    ],
    actions: [
      { name: 'Cimitarra', description: 'Ataque de arma cuerpo a cuerpo: +4 al ataque, alcance 1,5 m. Impacto: 3 (1d6+2) de daño cortante.', attack: { name: 'Cimitarra', bonus: 4, damage: '1d6+2', damageType: 'cortante' } },
    ],
    ...overrides,
  };
}
