import type { Rng } from '../domain/ports.js';

/**
 * Deterministic `Rng` test double.
 *
 * - `new SeededRng([5, 12, 1])` replays a scripted sequence of `int()` return
 *   values, cycling back to the start once exhausted.
 * - `new SeededRng(42)` derives a repeatable pseudo-random sequence from a
 *   numeric seed (same seed -> same sequence), for tests that need many rolls
 *   without hand-scripting every value.
 *
 * In both modes the returned value is clamped into the requested [min, max].
 */
export class SeededRng implements Rng {
  private readonly script: number[] | null;
  private index = 0;
  private state: number;

  constructor(seedOrScript: number | number[]) {
    if (Array.isArray(seedOrScript)) {
      if (seedOrScript.length === 0) {
        throw new Error('SeededRng: script must contain at least one value');
      }
      this.script = seedOrScript;
      this.state = 0;
    } else {
      this.script = null;
      this.state = seedOrScript >>> 0 || 1;
    }
  }

  int(min: number, max: number): number {
    if (min > max) throw new Error(`SeededRng.int: min (${min}) must be <= max (${max})`);

    if (this.script) {
      const value = this.script[this.index % this.script.length];
      this.index += 1;
      return clamp(value, min, max);
    }

    // xorshift32: simple, deterministic, dependency-free PRNG.
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    this.state >>>= 0;

    const span = max - min + 1;
    return min + (this.state % span);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
