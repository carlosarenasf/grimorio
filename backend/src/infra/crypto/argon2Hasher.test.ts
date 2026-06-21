import { describe, expect, it } from 'vitest';
import { Argon2Hasher } from './argon2Hasher.js';

describe('Argon2Hasher', () => {
  it('hash() produces an argon2id hash string', async () => {
    const hasher = new Argon2Hasher();
    const hash = await hasher.hash('correct-horse-battery-staple');

    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('verify() returns true for the correct password', async () => {
    const hasher = new Argon2Hasher();
    const hash = await hasher.hash('correct-horse-battery-staple');

    expect(await hasher.verify(hash, 'correct-horse-battery-staple')).toBe(true);
  });

  it('verify() returns false for an incorrect password', async () => {
    const hasher = new Argon2Hasher();
    const hash = await hasher.hash('correct-horse-battery-staple');

    expect(await hasher.verify(hash, 'wrong-password')).toBe(false);
  });
});
