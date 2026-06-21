/**
 * Small, pure update helpers for an existing `CharacterSheet`. Each returns a
 * new sheet; none mutate the input. HP changes always go through `clampHp` so
 * `currentHp` never drifts outside `0..maxHp`.
 */
import type { CharacterSheet } from '../types.js';
import { clampHp } from './sheet.js';

/** Applies a signed HP delta (damage is negative, healing is positive), clamped to 0..maxHp. */
export function applyHpDelta(sheet: CharacterSheet, delta: number): CharacterSheet {
  return clampHp({ ...sheet, currentHp: sheet.currentHp + delta });
}

/** Sets `currentHp` directly, clamped to 0..maxHp. */
export function setCurrentHp(sheet: CharacterSheet, currentHp: number): CharacterSheet {
  return clampHp({ ...sheet, currentHp });
}

/** Updates `maxHp` and re-clamps `currentHp` so it never exceeds the new max. */
export function setMaxHp(sheet: CharacterSheet, maxHp: number): CharacterSheet {
  return clampHp({ ...sheet, maxHp });
}
