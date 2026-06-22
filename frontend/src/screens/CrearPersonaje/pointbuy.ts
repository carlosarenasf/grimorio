// Client-side point-buy helpers — PREVIEW ONLY. The server is authoritative on
// submit (it re-validates and, for method 'roll', re-rolls). These mirror the
// 5e 2024 / SRD 5.2 point-buy table so the counter can update live.

import type { AbilityKey, AbilityScores } from './abilities';
import { ABILITY_KEYS } from './abilities';

/** Point-buy budget. */
export const POINT_BUY_BUDGET = 27;

/** Legal buy-mode range for a single ability before racial/other bonuses. */
export const BUY_MIN = 8;
export const BUY_MAX = 15;

/** Cost of each buyable score 8..15. */
export const POINT_BUY_COST: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

/** Cost of a single score; scores outside 8..15 are treated as 0 (illegal anyway). */
export function scoreCost(score: number): number {
  return POINT_BUY_COST[score] ?? 0;
}

/** Total points spent across all six abilities. */
export function totalCost(scores: AbilityScores): number {
  return ABILITY_KEYS.reduce((sum, key) => sum + scoreCost(scores[key]), 0);
}

/** Points remaining (can go negative if over budget). */
export function remainingPoints(scores: AbilityScores): number {
  return POINT_BUY_BUDGET - totalCost(scores);
}

/** Whether the spread is a legal buy: every score in 8..15 and total ≤ 27. */
export function isLegalPointBuy(scores: AbilityScores): boolean {
  for (const key of ABILITY_KEYS) {
    const v = scores[key];
    if (v < BUY_MIN || v > BUY_MAX) return false;
    if (!(v in POINT_BUY_COST)) return false;
  }
  return totalCost(scores) <= POINT_BUY_BUDGET;
}

/** Whether the counter should render in the "over budget" (red) state. */
export function isOverBudget(scores: AbilityScores): boolean {
  return totalCost(scores) > POINT_BUY_BUDGET;
}

/**
 * Whether stepping `key` by `delta` is allowed in buy mode: stays in 8..15 and
 * does not push the total over budget. (Decrements are always allowed in range.)
 */
export function canStepInBuy(
  scores: AbilityScores,
  key: AbilityKey,
  delta: number,
): boolean {
  const next = scores[key] + delta;
  if (next < BUY_MIN || next > BUY_MAX) return false;
  if (delta <= 0) return true;
  const nextScores = { ...scores, [key]: next };
  return totalCost(nextScores) <= POINT_BUY_BUDGET;
}

/** One 4d6-drop-lowest roll (PREVIEW ONLY; server re-rolls on submit). */
export function rollAbility(rng: () => number = Math.random): number {
  const dice = [0, 0, 0, 0].map(() => 1 + Math.floor(rng() * 6));
  dice.sort((a, b) => a - b);
  // drop the lowest (first after asc sort)
  return dice[1] + dice[2] + dice[3];
}

/** Roll all six abilities with 4d6-drop-lowest (PREVIEW ONLY). */
export function rollScores(rng: () => number = Math.random): AbilityScores {
  return {
    str: rollAbility(rng),
    dex: rollAbility(rng),
    con: rollAbility(rng),
    int: rollAbility(rng),
    wis: rollAbility(rng),
    cha: rollAbility(rng),
  };
}
