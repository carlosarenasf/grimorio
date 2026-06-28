/**
 * Level-up rules (D&D 2024 / SRD 5.2). Pure domain: no I/O, no mutation.
 *
 * When a character levels up:
 * - HP increases by hit die average (fixed) OR rolled hit die + CON mod
 * - Proficiency bonus is derived from level (already handled by `withDerived`)
 * - ASI (Ability Score Improvement) at levels 4, 8, 12, 16, 19 for most classes
 * - Level must be > current level and <= 20
 */
import type { AbilityKey, CharacterSheet } from '../types.js';
import type { Rng } from '../ports.js';
import { abilityMod } from '../rules/abilities.js';
import { clampHp } from './sheet.js';

/**
 * Hit die size by class name (SRD 5.2). Unrecognised class names fall back to
 * d8 — a reasonable middle-ground.
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

export function hitDie(className: string): number {
  return HIT_DICE[className] ?? 8;
}

/**
 * Levels at which most classes get an Ability Score Improvement (ASI).
 * Fighter gets extra ASIs at 6 and 14; Rogue at 10. This is the base list
 * for "most classes" — callers can override for specific classes.
 */
const BASE_ASI_LEVELS = [4, 8, 12, 16, 19];

const FIGHTER_ASI_LEVELS = [4, 6, 8, 12, 14, 16, 19];
const ROGUE_ASI_LEVELS = [4, 8, 10, 12, 16, 19];

export function asiLevelsForClass(className: string): number[] {
  if (className === 'Guerrero') return FIGHTER_ASI_LEVELS;
  if (className === 'Pícaro') return ROGUE_ASI_LEVELS;
  return BASE_ASI_LEVELS;
}

/** Returns true if the character gains an ASI at the given level for their class. */
export function gainsAsiAtLevel(className: string, level: number): boolean {
  return asiLevelsForClass(className).includes(level);
}

export interface LevelUpInput {
  /** 'fixed' uses the hit die average; 'roll' uses the injected Rng. */
  hpMethod: 'fixed' | 'roll';
  /** Optional ASI: add +2 to one ability, or +1 to two abilities. */
  asi?:
    | { type: 'single'; ability: AbilityKey }
    | { type: 'double'; ability1: AbilityKey; ability2: AbilityKey };
}

export interface LevelUpResult {
  sheet: CharacterSheet;
  hpGained: number;
  asiApplied: boolean;
}

/**
 * Levels up a character by 1 level. Returns the new sheet plus metadata about
 * what changed. Throws if the level would exceed 20 or if ASI is requested
 * but not allowed at the new level.
 */
export function levelUp(
  sheet: CharacterSheet,
  input: LevelUpInput,
  rng?: Rng,
): LevelUpResult {
  const newLevel = sheet.level + 1;

  if (newLevel > 20) {
    throw new Error(`levelUp: cannot level past 20 (current: ${sheet.level})`);
  }

  const conMod = abilityMod(sheet.scores.con);
  const die = hitDie(sheet.className);
  let hpGained: number;

  if (input.hpMethod === 'fixed') {
    const dieAverage = Math.ceil((die + 1) / 2);
    hpGained = Math.max(1, dieAverage + conMod);
  } else {
    if (!rng) {
      throw new Error('levelUp: hpMethod "roll" requires an Rng');
    }
    const roll = rng.int(1, die);
    hpGained = Math.max(1, roll + conMod);
  }

  let newScores = { ...sheet.scores };
  let asiApplied = false;

  if (input.asi) {
    if (!gainsAsiAtLevel(sheet.className, newLevel)) {
      throw new Error(
        `levelUp: ASI not available at level ${newLevel} for ${sheet.className}`,
      );
    }

    if (input.asi.type === 'single') {
      const newScore = newScores[input.asi.ability] + 2;
      if (newScore > 20) {
        throw new Error(
          `levelUp: ASI would raise ${input.asi.ability} above 20 (current: ${newScores[input.asi.ability]})`,
        );
      }
      newScores = { ...newScores, [input.asi.ability]: newScore };
    } else {
      const newScore1 = newScores[input.asi.ability1] + 1;
      const newScore2 = newScores[input.asi.ability2] + 1;
      if (newScore1 > 20 || newScore2 > 20) {
        throw new Error('levelUp: ASI would raise an ability above 20');
      }
      newScores = {
        ...newScores,
        [input.asi.ability1]: newScore1,
        [input.asi.ability2]: newScore2,
      };
    }
    asiApplied = true;
  }

  const newMaxHp = sheet.maxHp + hpGained;
  const updated: CharacterSheet = {
    ...sheet,
    level: newLevel,
    scores: newScores,
    maxHp: newMaxHp,
    currentHp: newMaxHp,
  };

  const clamped = clampHp(updated);

  return { sheet: clamped, hpGained, asiApplied };
}
