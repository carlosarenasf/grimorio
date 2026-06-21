/**
 * Campaign application errors — thrown by the handlers in this module.
 *
 * Each variant carries a `code` discriminant so transport adapters (HTTP/WS)
 * can map to the right wire status without inspecting message strings.
 */

export type CampaignErrorCode = 'NotFound' | 'Forbidden' | 'UnknownCode';

export class CampaignError extends Error {
  readonly code: CampaignErrorCode;

  constructor(code: CampaignErrorCode, message: string) {
    super(message);
    this.name = 'CampaignError';
    this.code = code;
  }
}

/** No campaign exists for the given id. */
export class NotFound extends CampaignError {
  constructor(campaignId: string) {
    super('NotFound', `Campaign not found: ${campaignId}`);
    this.name = 'NotFound';
  }
}

/** Actor is not authorized to perform this action (owner/dm-only operations). */
export class Forbidden extends CampaignError {
  constructor(message = 'Not authorized to perform this action') {
    super('Forbidden', message);
    this.name = 'Forbidden';
  }
}

/** No campaign exists for the given join code. */
export class UnknownCode extends CampaignError {
  constructor(joinCode: string) {
    super('UnknownCode', `Unknown join code: ${joinCode}`);
    this.name = 'UnknownCode';
  }
}
