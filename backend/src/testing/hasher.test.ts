import { describe, expect, it } from 'vitest';
import { FakeHasher } from './hasher.js';

describe('FakeHasher', () => {
  it('hash() is deterministic for the same password', async () => {
    const hasher = new FakeHasher();
    expect(await hasher.hash('secret')).toBe(await hasher.hash('secret'));
  });

  it('hash() differs for different passwords', async () => {
    const hasher = new FakeHasher();
    expect(await hasher.hash('secret')).not.toBe(await hasher.hash('other'));
  });

  it('verify() returns true when the password matches the hash', async () => {
    const hasher = new FakeHasher();
    const hash = await hasher.hash('secret');
    expect(await hasher.verify(hash, 'secret')).toBe(true);
  });

  it('verify() returns false when the password does not match', async () => {
    const hasher = new FakeHasher();
    const hash = await hasher.hash('secret');
    expect(await hasher.verify(hash, 'wrong')).toBe(false);
  });
});
