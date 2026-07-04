/**
 * Map application errors — thrown by the maps use cases.
 *
 * Mirrors the campaign error pattern: a `code` discriminant lets the
 * transport layer map each variant to an HTTP status without string-matching.
 */
export type MapErrorCode = 'NotFound' | 'Forbidden';

export class MapError extends Error {
  readonly code: MapErrorCode;

  constructor(code: MapErrorCode, message: string) {
    super(message);
    this.name = 'MapError';
    this.code = code;
  }
}

/** No map exists for the given id (or the campaign does not exist on write/list). */
export class NotFound extends MapError {
  constructor(id: string) {
    super('NotFound', `Map not found: ${id}`);
    this.name = 'NotFound';
  }
}

/** Actor is not authorized (not a dm for write/delete, not a member for read/list). */
export class Forbidden extends MapError {
  constructor(message = 'Not authorized to perform this action on the map') {
    super('Forbidden', message);
    this.name = 'Forbidden';
  }
}