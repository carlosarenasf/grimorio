import type { AbilityKey } from '../types.js';

/** SRD 5.2 point-buy cost table, score -> points spent. */
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const MIN_SCORE = 8;
const MAX_SCORE = 15;
const MAX_POINTS = 27;

/**
 * Cost in points to buy a single ability score via point-buy.
 * Scores outside the legal 8..15 range have no defined cost; callers should
 * gate on `isLegalPointBuy` before relying on totals for such scores.
 */
export function pointBuyCost(score: number): number {
  const cost = POINT_BUY_COSTS[score];
  if (cost === undefined) {
    throw new RangeError(`pointBuyCost: score ${score} is outside the legal 8..15 range`);
  }
  return cost;
}

/** Total points spent across all six ability scores. */
export function pointBuyTotal(scores: Record<AbilityKey, number>): number {
  return Object.values(scores).reduce((sum, score) => sum + pointBuyCost(score), 0);
}

/** True iff every score is within 8..15 and the total spend is at most 27. */
export function isLegalPointBuy(scores: Record<AbilityKey, number>): boolean {
  const inRange = Object.values(scores).every(
    (score) => score >= MIN_SCORE && score <= MAX_SCORE,
  );
  if (!inRange) return false;
  return pointBuyTotal(scores) <= MAX_POINTS;
}
