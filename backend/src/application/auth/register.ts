/**
 * `registerUser` — creates a new account.
 *
 * Validates + normalizes the email via the domain, rejects duplicates,
 * hashes the password through the injected `PasswordHasher` (the domain and
 * this handler never see/store plaintext), persists the user, and returns
 * the resulting `Principal`.
 */
import { createUser, isValidEmail, normalizeEmail } from '../../domain/user/index.js';
import type { UserId } from '../../domain/ids.js';
import type { Clock, PasswordHasher, UserRepository } from '../ports.js';
import { EmailTaken, InvalidEmail } from './errors.js';

export interface Principal {
  userId: UserId;
  displayName: string;
}

export interface RegisterCommand {
  email: string;
  displayName: string;
  password: string;
}

export interface RegisterDeps {
  users: UserRepository;
  hasher: PasswordHasher;
  clock: Clock;
}

export async function registerUser(cmd: RegisterCommand, deps: RegisterDeps): Promise<Principal> {
  const { users, hasher, clock } = deps;

  const normalized = normalizeEmail(cmd.email);
  if (!isValidEmail(normalized)) {
    throw new InvalidEmail(cmd.email);
  }

  const existing = await users.findByEmail(normalized);
  if (existing) {
    throw new EmailTaken(normalized);
  }

  const passwordHash = await hasher.hash(cmd.password);
  const user = createUser({ email: cmd.email, displayName: cmd.displayName }, passwordHash, clock);

  await users.save(user);

  return { userId: user.id, displayName: user.displayName };
}
