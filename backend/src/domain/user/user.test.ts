import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from './email.js';
import { createUser } from './user.js';
import type { UserClock } from './user.js';

function fakeClock(iso: string): UserClock {
  return { now: () => iso };
}

describe('isValidEmail', () => {
  it('accepts "a@b.co"', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  it('rejects "a@"', () => {
    expect(isValidEmail('a@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects a single space', () => {
    expect(isValidEmail(' ')).toBe(false);
  });

  it('rejects "a b@c.d" (internal whitespace)', () => {
    expect(isValidEmail('a b@c.d')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail(' A@B.CO ')).toBe('a@b.co');
  });
});

describe('createUser', () => {
  it('rejects an empty displayName', () => {
    expect(() =>
      createUser({ email: 'a@b.co', displayName: '' }, 'hash123', fakeClock('2024-01-01T00:00:00.000Z')),
    ).toThrow();
  });

  it('rejects a whitespace-only displayName', () => {
    expect(() =>
      createUser({ email: 'a@b.co', displayName: '   ' }, 'hash123', fakeClock('2024-01-01T00:00:00.000Z')),
    ).toThrow();
  });

  it('stores the provided passwordHash verbatim and normalizes the email', () => {
    const user = createUser(
      { email: ' A@B.CO ', displayName: 'Lyra' },
      'hash123',
      fakeClock('2024-01-01T00:00:00.000Z'),
    );

    expect(user.passwordHash).toBe('hash123');
    expect(user.email).toBe('a@b.co');
  });

  it('trims displayName and sets createdAt from the clock', () => {
    const user = createUser(
      { email: 'a@b.co', displayName: '  Lyra  ' },
      'hash123',
      fakeClock('2024-01-01T00:00:00.000Z'),
    );

    expect(user.displayName).toBe('Lyra');
    expect(user.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('generates a non-empty id prefixed with "usr_"', () => {
    const user = createUser(
      { email: 'a@b.co', displayName: 'Lyra' },
      'hash123',
      fakeClock('2024-01-01T00:00:00.000Z'),
    );

    expect(user.id).toMatch(/^usr_/);
  });
});
