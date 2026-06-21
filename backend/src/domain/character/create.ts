/**
 * Character creation. Pure domain: no I/O, no Math.random — ability rolls go
 * through the injected `Rng` port so creation is deterministic in tests.
 */
import type { AbilityKey, CharacterSheet } from '../types.js';
import type { CampaignId, UserId } from '../ids.js';
import { newCharacterId } from '../ids.js';
import { abilityMod, isLegalPointBuy } from '../rules/index.js';
import type { Rng } from '../ports.js';

export interface CreateCharacterInput {
  campaignId: CampaignId;
  ownerId: UserId;
  name: string;
  species: string;
  className: string;
  background: string;
  level: number;
  method: 'buy' | 'roll';
  scores?: Record<AbilityKey, number>;
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Hit die size by class name (SRD 5.2). Unrecognised class names fall back to
 * d8 — a reasonable middle-ground (documented assumption: this module does
 * not own a full class table, that lives in a future content/SRD module).
 */
const HIT_DICE: Record<string, number> = {
  Bárbaro: 12,
  Guerrero: 10,
  Paladín: 10,
  Explorador: 10,
  Pícaro: 8,
  Clérigo: 8,
  Druida: 8,
  Monje: 8,
  Bardo: 8,
  Brujo: 8,
  Mago: 6,
  Hechicero: 6,
};

function hitDie(className: string): number {
  return HIT_DICE[className] ?? 8;
}

/**
 * Starting max HP (documented assumption): level 1 = hit die max + CON mod;
 * each additional level adds the hit die average (rounded up) + CON mod, the
 * standard SRD "fixed" HP progression (no per-level rolling). Never negative.
 */
function startingMaxHp(className: string, level: number, conMod: number): number {
  const die = hitDie(className);
  const dieAverage = Math.ceil((die + 1) / 2);
  const first = die + conMod;
  const rest = (level - 1) * (dieAverage + conMod);
  return Math.max(0, first + rest);
}

/** Rolls a single ability score: 4d6, drop the lowest die. */
function rollAbilityScore(rng: Rng): number {
  const rolls = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)];
  rolls.sort((a, b) => a - b);
  return rolls[1]! + rolls[2]! + rolls[3]!;
}

function rollScores(rng: Rng): Record<AbilityKey, number> {
  return Object.fromEntries(ABILITIES.map((key) => [key, rollAbilityScore(rng)])) as Record<
    AbilityKey,
    number
  >;
}

function resolveScores(input: CreateCharacterInput, rng?: Rng): Record<AbilityKey, number> {
  if (input.method === 'buy') {
    if (!input.scores) {
      throw new Error('createCharacter: method "buy" requires `scores`');
    }
    if (!isLegalPointBuy(input.scores)) {
      throw new Error(
        'createCharacter: illegal point-buy — scores must be 8..15 and total at most 27 points',
      );
    }
    return input.scores;
  }
  // method === 'roll'
  if (!rng) {
    throw new Error('createCharacter: method "roll" requires an `Rng`');
  }
  return rollScores(rng);
}

export function createCharacter(input: CreateCharacterInput, rng?: Rng): CharacterSheet {
  if (!Number.isInteger(input.level) || input.level < 1 || input.level > 20) {
    throw new Error(`createCharacter: level must be an integer in 1..20, got ${input.level}`);
  }

  const scores = resolveScores(input, rng);
  const conMod = abilityMod(scores.con);
  const maxHp = startingMaxHp(input.className, input.level, conMod);

  const sheet: CharacterSheet = {
    id: newCharacterId(),
    campaignId: input.campaignId,
    ownerId: input.ownerId,
    name: input.name,
    species: input.species,
    className: input.className,
    background: input.background,
    level: input.level,
    scores,
    maxHp,
    currentHp: maxHp,
    armorClass: 10 + abilityMod(scores.dex),
    speed: 9,
    proficientSkills: [],
    attacks: [],
    inventory: [],
    gold: 0,
    notes: '',
    visibility: 'owner',
  };

  return sheet;
}
