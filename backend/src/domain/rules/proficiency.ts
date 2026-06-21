/**
 * Proficiency bonus (SRD 5.2): ceil(level / 4) + 1.
 */
export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}
