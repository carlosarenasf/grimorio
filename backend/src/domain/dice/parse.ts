/**
 * Dice notation parsing — pure, no I/O, no randomness.
 *
 * Accepts standard tabletop dice notation: `<count>d<faces>[+|-<mod>]`, e.g.
 * "2d6+3", "1d20", "d8" (count defaults to 1), "1d20-1". Whitespace around
 * tokens and operators is tolerated.
 */

const NOTATION_RE = /^(\d*)d(\d+)(?:([+-])(\d+))?$/i;

const VALID_FACES = new Set([4, 6, 8, 10, 12, 20, 100]);
const MAX_COUNT = 100;

export interface ParsedNotation {
  count: number;
  faces: number;
  mod: number;
}

export function parseNotation(input: string): ParsedNotation | null {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (trimmed === '') return null;

  const match = NOTATION_RE.exec(trimmed);
  if (!match) return null;

  const [, countStr, facesStr, sign, modStr] = match;

  const count = countStr === '' ? 1 : Number.parseInt(countStr, 10);
  const faces = Number.parseInt(facesStr, 10);
  const mod = modStr === undefined ? 0 : Number.parseInt(modStr, 10) * (sign === '-' ? -1 : 1);

  if (count < 1 || count > MAX_COUNT) return null;
  if (!VALID_FACES.has(faces)) return null;

  return { count, faces, mod };
}
