/**
 * User aggregate — pure domain logic, no I/O. Password hashing happens behind
 * the `PasswordHasher` port (application/infra layer); the domain only ever
 * stores an already-hashed value, never plaintext.
 */
import type { User } from '../types.js';
import { newUserId } from '../ids.js';
import { normalizeEmail } from './email.js';

export interface CreateUserInput {
  email: string;
  displayName: string;
}

/** Minimal clock contract needed here (mirrors application/ports `Clock`). */
export interface UserClock {
  now(): string;
}

/**
 * Builds a new `User`. `passwordHash` must already be hashed by the caller
 * (via the `PasswordHasher` port) — this function never sees plaintext.
 */
export function createUser(input: CreateUserInput, passwordHash: string, clock: UserClock): User {
  const displayName = input.displayName.trim();
  if (displayName === '') {
    throw new Error('displayName must not be empty');
  }

  return {
    id: newUserId(),
    email: normalizeEmail(input.email),
    passwordHash,
    displayName,
    createdAt: clock.now(),
  };
}
