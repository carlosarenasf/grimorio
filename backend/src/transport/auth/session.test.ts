import { describe, expect, it } from 'vitest';
import { signSession, verifySession } from './session.js';

describe('session token', () => {
  const secret = 'test-secret';

  it('round-trips a signed principal', () => {
    const token = signSession({ userId: 'usr_1', displayName: 'Lyra' }, secret);
    expect(verifySession(token, secret)).toEqual({ userId: 'usr_1', displayName: 'Lyra' });
  });

  it('rejects a tampered payload', () => {
    const token = signSession({ userId: 'usr_1', displayName: 'Lyra' }, secret);
    const tampered = 'x' + token.slice(1);
    expect(verifySession(tampered, secret)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = signSession({ userId: 'usr_1', displayName: 'Lyra' }, secret);
    expect(verifySession(token, 'other-secret')).toBeNull();
  });

  it('returns null for missing/garbage tokens', () => {
    expect(verifySession(undefined, secret)).toBeNull();
    expect(verifySession('garbage', secret)).toBeNull();
  });
});
