// Grimorio network client barrel (frontend/src/net).

export { createApiClient, ApiError } from './http';
export type {
  ApiClient,
  ApiClientOptions,
  Principal,
  CampaignDTO,
  CharacterDTO,
  RegisterPayload,
  LoginPayload,
  CreateCampaignPayload,
  CreateCharacterPayload,
  UpdateCharacterPayload,
} from './http';

export { createLiveConnection } from './ws';
export type {
  LiveConnection,
  LiveConnectionOptions,
  LiveError,
  SnapshotListener,
  ErrorListener,
} from './ws';

export { createSessionStore } from './session.store';
export type { SessionStore, SessionListener } from './session.store';

export { createTableStore, getActiveCombatant } from './table.store';
export type { TableStore, TableListener } from './table.store';
