import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from './userRepository.js';
import { newUserId } from '../../domain/ids.js';
import type { User } from '../../domain/types.js';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: newUserId(),
    email: 'a@b.co',
    passwordHash: 'hash123',
    displayName: 'Lyra',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryUserRepository', () => {
  it('round-trips save -> findById', async () => {
    const repo = new InMemoryUserRepository();
    const user = makeUser();

    await repo.save(user);
    const found = await repo.findById(user.id);

    expect(found).toEqual(user);
  });

  it('findById returns null for an unknown id', async () => {
    const repo = new InMemoryUserRepository();
    expect(await repo.findById(newUserId())).toBeNull();
  });

  it('findByEmail finds a saved user by exact email', async () => {
    const repo = new InMemoryUserRepository();
    const user = makeUser({ email: 'lyra@example.com' });

    await repo.save(user);
    const found = await repo.findByEmail('lyra@example.com');

    expect(found).toEqual(user);
  });

  it('findByEmail returns null when no user matches', async () => {
    const repo = new InMemoryUserRepository();
    await repo.save(makeUser({ email: 'lyra@example.com' }));

    expect(await repo.findByEmail('nope@example.com')).toBeNull();
  });

  it('save overwrites an existing user with the same id', async () => {
    const repo = new InMemoryUserRepository();
    const user = makeUser();
    await repo.save(user);

    const updated = { ...user, displayName: 'Lyra the Bold' };
    await repo.save(updated);

    expect(await repo.findById(user.id)).toEqual(updated);
  });
});
