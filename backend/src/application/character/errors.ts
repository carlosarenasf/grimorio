/**
 * Application-level errors for the character use cases.
 *
 * These are distinct from domain errors (which are plain `Error` throws from
 * `domain/character/create.ts`): `CharacterError` carries a `code` so the
 * transport layer (3b) can map it to the right HTTP status / wire error
 * without string-matching messages.
 */

export type CharacterErrorCode =
  | 'NotCampaignMember'
  | 'Forbidden'
  | 'NotFound'
  | 'IllegalPointBuy';

export class CharacterError extends Error {
  readonly code: CharacterErrorCode;

  constructor(code: CharacterErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CharacterError';
    this.code = code;
  }
}
