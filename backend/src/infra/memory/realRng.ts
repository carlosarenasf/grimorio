import type { Rng } from '../../domain/ports.js';

/** Real randomness for dice (SPEC §7). Uses `Math.random`; never used by domain directly. */
export class RealRng implements Rng {
  int(min: number, max: number): number {
    if (min > max) throw new Error(`RealRng.int: min (${min}) must be <= max (${max})`);
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
