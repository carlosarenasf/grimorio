import type { PasswordHasher } from '../application/ports.js';

/**
 * Deterministic `PasswordHasher` test double. NOT cryptographically secure —
 * for application-layer tests only. `hash(pw)` is a pure, predictable function
 * of `pw` so assertions can construct expected hashes without async I/O.
 */
export class FakeHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hashed(password);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return hash === hashed(password);
  }
}

function hashed(password: string): string {
  return `hashed:${password}`;
}
