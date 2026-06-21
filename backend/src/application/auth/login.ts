/**
 * `login` — verifies credentials and returns a `Principal`.
 *
 * Looks the user up by normalized email and verifies the password against
 * the stored hash via the injected `PasswordHasher`. Both an unknown email
 * and a wrong password resolve to the same `InvalidCredentials` error so the
 * handler never leaks whether an email is registered.
 */
import { normalizeEmail } from '../../domain/user/index.js';
import type { PasswordHasher, UserRepository } from '../ports.js';
import { InvalidCredentials } from './errors.js';
import type { Principal } from './register.js';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginDeps {
  users: UserRepository;
  hasher: PasswordHasher;
}

export async function login(cmd: LoginCommand, deps: LoginDeps): Promise<Principal> {
  const { users, hasher } = deps;

  const normalized = normalizeEmail(cmd.email);
  const user = await users.findByEmail(normalized);
  if (!user) {
    throw new InvalidCredentials();
  }

  const ok = await hasher.verify(user.passwordHash, cmd.password);
  if (!ok) {
    throw new InvalidCredentials();
  }

  return { userId: user.id, displayName: user.displayName };
}
