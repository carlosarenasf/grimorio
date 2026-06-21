/**
 * Error -> HTTP status mapping for the transport layer.
 *
 * Application errors (`AuthError`, `CampaignError`, `CharacterError`) carry a
 * `code` discriminant; this module is the ONLY place that turns those codes
 * into wire status codes, so handlers in `routes.ts` stay declarative.
 */
import { AuthError } from '../../application/auth/index.js';
import { CampaignError } from '../../application/campaign/index.js';
import { CharacterError } from '../../application/character/index.js';

/** Thrown by `requireSession` / membership checks when there's no valid session. */
export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Thrown by the snapshot route when the session user isn't a campaign member. */
export class NotCampaignMemberError extends Error {
  constructor(message = 'Not a member of this campaign') {
    super(message);
    this.name = 'NotCampaignMemberError';
  }
}

const AUTH_STATUS: Record<AuthError['code'], number> = {
  InvalidEmail: 400,
  EmailTaken: 409,
  InvalidCredentials: 401,
};

const CAMPAIGN_STATUS: Record<import('../../application/campaign/index.js').CampaignErrorCode, number> = {
  NotFound: 404,
  Forbidden: 403,
  UnknownCode: 404,
};

const CHARACTER_STATUS: Record<import('../../application/character/index.js').CharacterErrorCode, number> = {
  NotFound: 404,
  Forbidden: 403,
  NotCampaignMember: 403,
  IllegalPointBuy: 400,
};

/** Map a thrown error to an HTTP status code; 500 for anything unrecognised. */
export function statusForError(err: unknown): number {
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof NotCampaignMemberError) return 403;
  if (err instanceof AuthError) return AUTH_STATUS[err.code];
  if (err instanceof CampaignError) return CAMPAIGN_STATUS[err.code];
  if (err instanceof CharacterError) return CHARACTER_STATUS[err.code];
  return 500;
}

/** Wire error body: `{ error: code, message }`. Falls back to a generic code for unknowns. */
export function bodyForError(err: unknown): { error: string; message: string } {
  if (err instanceof UnauthorizedError) return { error: 'Unauthorized', message: err.message };
  if (err instanceof NotCampaignMemberError) {
    return { error: 'NotCampaignMember', message: err.message };
  }
  if (err instanceof AuthError || err instanceof CampaignError || err instanceof CharacterError) {
    return { error: err.code, message: err.message };
  }
  if (err instanceof Error) return { error: 'InternalError', message: err.message };
  return { error: 'InternalError', message: 'Unknown error' };
}
