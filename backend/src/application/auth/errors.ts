/**
 * Auth application errors — thrown by `registerUser`/`login` handlers.
 *
 * Each variant carries a `code` discriminant so transport adapters (HTTP/WS)
 * can map to the right wire status without inspecting message strings.
 */

export type AuthErrorCode = 'EmailTaken' | 'InvalidCredentials' | 'InvalidEmail';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Email already registered (post-normalization). */
export class EmailTaken extends AuthError {
  constructor(email: string) {
    super('EmailTaken', `Email already registered: ${email}`);
    this.name = 'EmailTaken';
  }
}

/** Email fails the domain's shape check. */
export class InvalidEmail extends AuthError {
  constructor(email: string) {
    super('InvalidEmail', `Invalid email: ${email}`);
    this.name = 'InvalidEmail';
  }
}

/** Wrong password, or no user for the given (normalized) email. Deliberately
 * generic so login never leaks whether an email is registered. */
export class InvalidCredentials extends AuthError {
  constructor() {
    super('InvalidCredentials', 'Invalid email or password');
    this.name = 'InvalidCredentials';
  }
}
