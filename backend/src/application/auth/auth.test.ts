import { describe, expect, it } from 'vitest';
import { FakeClock, FakeHasher, makeInMemoryRepos } from '../../testing/index.js';
import { registerUser } from './register.js';
import { login } from './login.js';
import { EmailTaken, InvalidCredentials, InvalidEmail } from './errors.js';

function makeDeps() {
  const repos = makeInMemoryRepos();
  const hasher = new FakeHasher();
  const clock = new FakeClock();
  return { repos, hasher, clock };
}

describe('registerUser', () => {
  it('creates a user and returns a Principal', async () => {
    const { repos, hasher, clock } = makeDeps();

    const principal = await registerUser(
      { email: 'lyra@example.com', displayName: 'Lyra', password: 'supersecret' },
      { users: repos.users, hasher, clock },
    );

    expect(principal.displayName).toBe('Lyra');
    expect(principal.userId).toMatch(/^usr_/);

    const stored = await repos.users.findByEmail('lyra@example.com');
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(principal.userId);
  });

  it('stores the hashed password, never the plaintext', async () => {
    const { repos, hasher, clock } = makeDeps();

    await registerUser(
      { email: 'lyra@example.com', displayName: 'Lyra', password: 'supersecret' },
      { users: repos.users, hasher, clock },
    );

    const stored = await repos.users.findByEmail('lyra@example.com');
    expect(stored?.passwordHash).toBe('hashed:supersecret');
    expect(stored?.passwordHash).not.toBe('supersecret');
  });

  it('rejects a second register with the same email (case/whitespace-insensitive)', async () => {
    const { repos, hasher, clock } = makeDeps();
    const deps = { users: repos.users, hasher, clock };

    await registerUser({ email: 'Lyra@Example.com', displayName: 'Lyra', password: 'supersecret' }, deps);

    await expect(
      registerUser({ email: '  lyra@example.com  ', displayName: 'Lyra Two', password: 'other-pass' }, deps),
    ).rejects.toBeInstanceOf(EmailTaken);
  });

  it('rejects an invalid email', async () => {
    const { repos, hasher, clock } = makeDeps();

    await expect(
      registerUser({ email: 'not-an-email', displayName: 'Lyra', password: 'supersecret' }, {
        users: repos.users,
        hasher,
        clock,
      }),
    ).rejects.toBeInstanceOf(InvalidEmail);
  });
});

describe('login', () => {
  it('returns a Principal for correct credentials', async () => {
    const { repos, hasher, clock } = makeDeps();
    const registered = await registerUser(
      { email: 'lyra@example.com', displayName: 'Lyra', password: 'supersecret' },
      { users: repos.users, hasher, clock },
    );

    const principal = await login(
      { email: 'lyra@example.com', password: 'supersecret' },
      { users: repos.users, hasher },
    );

    expect(principal).toEqual(registered);
  });

  it('rejects a wrong password', async () => {
    const { repos, hasher, clock } = makeDeps();
    await registerUser(
      { email: 'lyra@example.com', displayName: 'Lyra', password: 'supersecret' },
      { users: repos.users, hasher, clock },
    );

    await expect(
      login({ email: 'lyra@example.com', password: 'wrong-pass' }, { users: repos.users, hasher }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
  });

  it('rejects an unknown email', async () => {
    const { repos, hasher } = makeDeps();

    await expect(
      login({ email: 'ghost@example.com', password: 'whatever' }, { users: repos.users, hasher }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
  });
});
