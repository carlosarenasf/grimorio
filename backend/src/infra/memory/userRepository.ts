import type { UserRepository } from '../../application/ports.js';
import type { UserId } from '../../domain/ids.js';
import type { User } from '../../domain/types.js';

/** Map-backed `UserRepository` for tests and local dev (no persistence). */
export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<UserId, User>();

  async save(user: User): Promise<void> {
    this.byId.set(user.id, { ...user });
  }

  async findById(id: UserId): Promise<User | null> {
    const user = this.byId.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.byId.values()) {
      if (user.email === email) return { ...user };
    }
    return null;
  }
}
