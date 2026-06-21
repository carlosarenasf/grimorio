/**
 * LiveTable application errors — thrown by `dispatchLiveCommand`.
 *
 * Each variant carries a `code` discriminant so transport adapters (WS/HTTP)
 * can map to the right wire status without inspecting message strings.
 */

export type LiveTableErrorCode =
  | 'Forbidden'
  | 'NotActiveTurn'
  | 'InvalidNotation'
  | 'CombatantNotFound';

export class LiveTableError extends Error {
  readonly code: LiveTableErrorCode;

  constructor(code: LiveTableErrorCode, message: string) {
    super(message);
    this.name = 'LiveTableError';
    this.code = code;
  }
}

/** Principal lacks the role/ownership required for this command. */
export class Forbidden extends LiveTableError {
  constructor(message = 'Not authorized to perform this command') {
    super('Forbidden', message);
    this.name = 'Forbidden';
  }
}

/** EndMyTurn issued by a player who does not control the active combatant. */
export class NotActiveTurn extends LiveTableError {
  constructor(message = 'It is not your turn') {
    super('NotActiveTurn', message);
    this.name = 'NotActiveTurn';
  }
}

/** Dice notation failed to parse. */
export class InvalidNotation extends LiveTableError {
  constructor(notation: string) {
    super('InvalidNotation', `Invalid dice notation: "${notation}"`);
    this.name = 'InvalidNotation';
  }
}

/** Referenced combatant id is not present on the table. */
export class CombatantNotFound extends LiveTableError {
  constructor(combatantId: string) {
    super('CombatantNotFound', `Combatant not found: ${combatantId}`);
    this.name = 'CombatantNotFound';
  }
}
