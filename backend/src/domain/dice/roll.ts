/**
 * Dice rolling — pure domain logic that consumes an injected Rng (never
 * Math.random directly) so results are deterministic under test (SPEC §7).
 */
import { parseNotation } from './parse.js';
import type { Rng } from '../ports.js';

export type RollTone = 'normal' | 'crit' | 'fumble';

export interface RollResult {
  results: number[];
  total: number;
  breakdown: string;
  tone: RollTone;
}

/** Rolls `count` dice with `faces` sides each using the given Rng. */
function rollDice(count: number, faces: number, rng: Rng): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i += 1) {
    results.push(rng.int(1, faces));
  }
  return results;
}

/** crit/fumble tone only ever applies to a single d20. */
function singleD20Tone(count: number, faces: number, value: number): RollTone {
  if (count !== 1 || faces !== 20) return 'normal';
  if (value === 20) return 'crit';
  if (value === 1) return 'fumble';
  return 'normal';
}

function buildBreakdown(results: number[], mod: number): string {
  const parts = results.map(String);
  if (mod !== 0) parts.push(String(mod));
  // join then normalize "+ -1" into "- 1" for readability
  return parts.join(' + ').replace(/\+ -(\d+)/g, '- $1');
}

/**
 * Rolls a dice notation string (e.g. "2d6+3") against the given Rng.
 * Returns null-safe behaviour is the caller's job — invalid notation throws,
 * since this is meant to be called only after validating with parseNotation
 * (or by trusted internal callers like rollAttack).
 */
export function rollNotation(notation: string, rng: Rng): RollResult {
  const parsed = parseNotation(notation);
  if (!parsed) {
    throw new Error(`Invalid dice notation: "${notation}"`);
  }
  const { count, faces, mod } = parsed;
  const results = rollDice(count, faces, rng);
  const total = results.reduce((sum, r) => sum + r, 0) + mod;
  const breakdown = buildBreakdown(results, mod);
  const tone = singleD20Tone(count, faces, results[0]);
  return { results, total, breakdown, tone };
}

export interface AttackInput {
  toHitBonus: number | null;
  damage: string | null;
}

export interface AttackResult {
  results: number[];
  breakdown: string;
  total: number;
  tone: RollTone;
}

/**
 * Rolls an attack: a d20 to-hit (when toHitBonus is provided) plus damage
 * notation (when provided). At least one of the two should be present for a
 * meaningful result; both are independently optional per the Attack model
 * (e.g. save-based spells have bonus: null).
 */
export function rollAttack(input: AttackInput, rng: Rng): AttackResult {
  const { toHitBonus, damage } = input;
  const results: number[] = [];
  const breakdownParts: string[] = [];
  let total = 0;
  let tone: RollTone = 'normal';

  if (toHitBonus !== null) {
    const toHitRoll = rng.int(1, 20);
    results.push(toHitRoll);
    const hitTotal = toHitRoll + toHitBonus;
    const hitBreakdown =
      toHitBonus === 0
        ? `${toHitRoll}`
        : toHitBonus > 0
          ? `${toHitRoll} + ${toHitBonus}`
          : `${toHitRoll} - ${Math.abs(toHitBonus)}`;
    breakdownParts.push(`to hit: ${hitBreakdown} = ${hitTotal}`);
    total += hitTotal;
    tone = singleD20Tone(1, 20, toHitRoll);
  }

  if (damage !== null) {
    const damageRoll = rollNotation(damage, rng);
    results.push(...damageRoll.results);
    breakdownParts.push(`damage: ${damageRoll.breakdown} = ${damageRoll.total}`);
    total += damageRoll.total;
  }

  return {
    results,
    breakdown: breakdownParts.join('; '),
    total,
    tone,
  };
}

export type AdvantageMode = 'advantage' | 'disadvantage' | 'normal';

export interface AdvantageResult {
  results: number[];
  total: number;
  breakdown: string;
  tone: RollTone;
}

/**
 * Rolls a d20 check with advantage/disadvantage/normal, applying `mod`.
 * Advantage/disadvantage roll two d20s and keep the higher/lower respectively;
 * normal rolls a single d20.
 */
export function rollWithAdvantage(
  mod: number,
  mode: AdvantageMode,
  rng: Rng,
): AdvantageResult {
  const rolls = mode === 'normal' ? [rng.int(1, 20)] : [rng.int(1, 20), rng.int(1, 20)];

  const kept =
    mode === 'advantage'
      ? Math.max(...rolls)
      : mode === 'disadvantage'
        ? Math.min(...rolls)
        : rolls[0];

  const total = kept + mod;
  const modPart = mod === 0 ? '' : mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`;
  const breakdown =
    mode === 'normal'
      ? `${kept}${modPart}`
      : `${rolls.join(' / ')} (keep ${kept})${modPart}`;

  return {
    results: rolls,
    total,
    breakdown,
    tone: singleD20Tone(1, 20, kept),
  };
}
