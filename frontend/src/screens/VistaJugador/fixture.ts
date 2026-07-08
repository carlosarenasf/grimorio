import type { PlayerSnapshot } from '@grimorio/shared/wire';
import type { YouCharacter } from './types';

/**
 * A representative PlayerSnapshot for tests/stories: the viewer's own PC
 * (active turn), a teammate PC, and a dm_only monster projected with a
 * `statusLabel` instead of numeric HP — the visibility guarantee this
 * screen must surface verbatim.
 */
export function makePlayerSnapshot(
  overrides: Partial<PlayerSnapshot> = {},
): PlayerSnapshot {
  return {
    viewerRole: 'player',
    liveTableId: 'lt-1',
    campaignId: 'camp-1',
    ownCharacterId: 'char-1',
    combatants: [
      {
        id: 'pc-1',
        type: 'pc',
        name: 'Lyra',
        initiative: 18,
        conditions: [],
        currentHp: 24,
        maxHp: 30,
      },
      {
        id: 'pc-2',
        type: 'pc',
        name: 'Brom',
        initiative: 12,
        conditions: [],
        currentHp: 19,
        maxHp: 22,
      },
      {
        id: 'mon-1',
        type: 'monster',
        name: 'Dragón joven',
        initiative: 15,
        conditions: [],
        statusLabel: 'Herido',
      },
    ],
    combat: {
      active: true,
      round: 2,
      order: ['pc-1', 'mon-1', 'pc-2'],
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

/** The viewer's own character sheet data (TU FICHA + economía de acciones). */
export function makeYouCharacter(overrides: Partial<YouCharacter> = {}): YouCharacter {
  return {
    combatantId: 'pc-1',
    characterId: 'char-1',
    name: 'Lyra',
    species: 'Elfa',
    className: 'Mago',
    background: 'Savia',
    level: 3,
    scores: { str: 14, dex: 16, con: 13, int: 10, wis: 12, cha: 8 },
    maxHp: 30,
    currentHp: 24,
    armorClass: 15,
    speed: 9,
    proficiencyBonus: 2,
    initiative: 3,
    attacks: [
      { id: 'atk-1', name: 'Espada corta', kind: 'weapon', bonus: 5, damage: '1d6+3' },
      { id: 'atk-2', name: 'Rayo de escarcha', kind: 'spell', bonus: 4, damage: '1d8' },
    ],
    inventory: [
      { id: 'inv-1', name: 'Cota de cuero', note: 'Armadura ligera', qty: 1, equipped: true },
      { id: 'inv-2', name: 'Espada corta', note: 'Arma', qty: 1, equipped: true },
      { id: 'inv-3', name: 'Antorcha', note: '', qty: 3, equipped: false },
      { id: 'inv-4', name: 'Poción de curación', note: '2d4+2 PV', qty: 2, equipped: false },
    ],
    gold: 35,
    notes: 'Busco la fuente de la magia arcana.',
    traits: [
      { id: 'trait-1', name: 'Visión en oscuridad', description: 'Puedes ver en la oscuridad a 18m de distancia.', source: 'species' },
      { id: 'trait-2', name: 'Suerte', description: 'Puedes repetir una tirada de 1 en un d20.', source: 'species' },
      { id: 'trait-3', name: 'Ira', description: 'Ventaja en tiradas de daño cuerpo a cuerpo con Fuerza.', source: 'class' },
      { id: 'trait-4', name: 'Sentido agudo', description: 'Competencia en Percepción.', source: 'background' },
    ],
    spells: [
      { id: 'spell-1', name: 'Rayo de escarcha', level: 0, school: 'Evocación', description: 'Un rayo de hielo que causa 1d8 de daño.', damage: '1d8' },
      { id: 'spell-2', name: 'Proyectil mágico', level: 1, school: 'Evocación', description: 'Tres dardos de fuerza que impactan automáticamente.', damage: '1d4+1' },
    ],
    hasSpellcasting: true,
    proficientSkills: ['arcana', 'history', 'perception'],
    ...overrides,
  };
}
