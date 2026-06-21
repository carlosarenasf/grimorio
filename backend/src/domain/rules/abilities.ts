/**
 * Ability score modifier (SRD 5.2): floor((score - 10) / 2).
 */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}
