export { registerUser } from './register.js';
export type { Principal, RegisterCommand, RegisterDeps } from './register.js';
export { login } from './login.js';
export type { LoginCommand, LoginDeps } from './login.js';
export { AuthError, EmailTaken, InvalidCredentials, InvalidEmail } from './errors.js';
export type { AuthErrorCode } from './errors.js';
