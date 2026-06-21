import { describe, expect, it } from 'vitest';
import { makeInMemoryRepos } from './repos.js';
import { newUserId } from '../domain/ids.js';
import type { User } from '../domain/types.js';

describe('makeInMemoryRepos', () => {
  it('returns fresh repos for users, campaigns, characters, and live tables', async () => {
    const repos = makeInMemoryRepos();

    expect(repos.users).toBeDefined();
    expect(repos.campaigns).toBeDefined();
    expect(repos.characters).toBeDefined();
    expect(repos.liveTables).toBeDefined();
  });

  it('each call produces independent repo instances (no shared state)', async () => {
    const first = makeInMemoryRepos();
    const second = makeInMemoryRepos();

    const user: User = {
      id: newUserId(),
      email: 'a@b.co',
      passwordHash: 'hash',
      displayName: 'Lyra',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    await first.users.save(user);

    expect(await first.users.findById(user.id)).toEqual(user);
    expect(await second.users.findById(user.id)).toBeNull();
  });
});
