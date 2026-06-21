import * as argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports.js';

/** `PasswordHasher` backed by argon2id (via the `argon2` native package). */
export class Argon2Hasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
