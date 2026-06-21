/**
 * Campaign invite/join codes — pure domain logic, deterministic under an
 * injected Rng (never Math.random; see SPEC §7 and application/ports.ts).
 *
 * Format: an uppercase word from a fixed list, a hyphen, and two digits,
 * e.g. "RAVEN-77". Used as the human-shareable base of the /unirse/CODE link.
 */
import type { Rng } from '../ports.js';

const WORDS = [
  'RAVEN',
  'WOLF',
  'DRAGON',
  'EMBER',
  'STORM',
  'SHADOW',
  'IRON',
  'FROST',
  'CRYPT',
  'TOMB',
  'BLADE',
  'GHOST',
  'ASH',
  'RUNE',
  'FANG',
  'GRIM',
];

/** Generates a join code like "RAVEN-77" using the given Rng. */
export function generateJoinCode(rng: Rng): string {
  const word = WORDS[rng.int(0, WORDS.length - 1)];
  const digits = rng.int(0, 99).toString().padStart(2, '0');
  return `${word}-${digits}`;
}
