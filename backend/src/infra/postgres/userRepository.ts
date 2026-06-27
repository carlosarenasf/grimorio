import type { Sql } from 'postgres';
import type { UserRepository } from '../../application/ports.js';
import type { UserId } from '../../domain/ids.js';
import type { User } from '../../domain/types.js';
import { toSnapshot } from './rows.js';

/** Postgres-backed `UserRepository`: JSONB snapshot in `users`, keyed by id, looked up by email. */
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly sql: Sql) {}

  async save(user: User): Promise<void> {
    await this.sql`
      INSERT INTO users (id, email, data)
      VALUES (${user.id}, ${user.email}, ${this.sql.json(JSON.parse(JSON.stringify(user)))})
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, data = EXCLUDED.data
    `;
  }

  async findById(id: UserId): Promise<User | null> {
    const rows = await this.sql<{ data: User }[]>`
      SELECT data FROM users WHERE id = ${id}
    `;
    return toSnapshot(rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.sql<{ data: User }[]>`
      SELECT data FROM users WHERE email = ${email}
    `;
    return toSnapshot(rows[0]);
  }
}
