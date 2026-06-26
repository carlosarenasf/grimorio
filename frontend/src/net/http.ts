/**
 * Typed HTTP client for the Grimorio REST surface (`backend/src/transport/http/routes.ts`).
 *
 * Auth is a session cookie set by the server on register/login; every request
 * is sent with `credentials: 'include'` so the browser carries that cookie.
 * Non-2xx responses are normalized into a typed `ApiError` so callers can
 * branch on `status`/`code` without parsing the body themselves.
 */
import type { Snapshot } from '@grimorio/shared/wire';
import type { Principal } from './session.store';

export type { Principal };

// ---------- Minimal response DTOs ----------
// `Campaign`/`CharacterSheet` are backend-domain types, not exported from
// `shared/`. The client treats them as opaque records of known shape so
// screens get useful field access without the net layer importing backend.

export interface CampaignDTO {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  status: 'planning' | 'active' | 'paused';
  joinCode: string;
  members: Array<{ userId: string; role: 'dm' | 'player' }>;
  characterIds: string[];
  sessionCount: number;
  createdAt: string;
}

export interface CharacterDTO {
  id: string;
  campaignId: string;
  ownerId: string;
  name: string;
  species: string;
  className: string;
  background: string;
  level: number;
  scores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  proficientSkills: string[];
  attacks?: Array<{
    id: string;
    name: string;
    kind: 'weapon' | 'spell' | 'save';
    bonus: number | null;
    damage: string | null;
    damageType: string;
  }>;
  inventory?: Array<{ id: string; name: string; note: string; qty: number; equipped: boolean }>;
  /** Chosen spell ids (resolved against the SRD for display/rolling). */
  spells?: string[];
  gold: number;
  notes: string;
  [key: string]: unknown;
}

// ---------- Request payload shapes ----------

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateCampaignPayload {
  name: string;
  tagline?: string;
}

export interface CreateCharacterPayload {
  campaignId: string;
  name: string;
  species: string;
  className: string;
  background: string;
  level: number;
  method: 'buy' | 'roll';
  scores?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
}

export type UpdateCharacterPayload = Record<string, unknown>;

/** A bestiary search result from the curated SRD (`GET /srd/monsters`). */
export interface MonsterRefDTO {
  id: string;
  name: string;
  cr: string;
  meta: string;
}

export interface SpeciesDTO {
  id: string;
  name: string;
  size: string;
  speed: number;
  description: string;
  traits: string[];
}
export interface ClassDTO {
  id: string;
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  spellcasting: 'full' | 'half' | 'none';
  description: string;
  skillChoices: number;
  skillOptions: string[];
}
export interface BackgroundDTO {
  id: string;
  name: string;
  description: string;
  abilityOptions: string[];
  skills: string[];
}
export interface SpellDTO {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  description: string;
  damage?: string | null;
}
export interface WeaponDTO {
  id: string;
  name: string;
  category: 'simple' | 'martial';
  damage: string;
  damageType: string;
  properties: string[];
  ability: 'str' | 'dex' | 'finesse';
}

// ---------- ApiError ----------

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ---------- Client ----------

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface ApiClient {
  register(payload: RegisterPayload): Promise<Principal>;
  login(payload: LoginPayload): Promise<Principal>;
  logout(): Promise<void>;
  /** Current principal from the session cookie, or throws ApiError(401) if none. */
  me(): Promise<Principal>;
  listCampaigns(): Promise<CampaignDTO[]>;
  createCampaign(payload: CreateCampaignPayload): Promise<CampaignDTO>;
  invite(campaignId: string): Promise<CampaignDTO>;
  joinByCode(joinCode: string): Promise<CampaignDTO>;
  createCharacter(payload: CreateCharacterPayload): Promise<CharacterDTO>;
  updateCharacter(characterId: string, patch: UpdateCharacterPayload): Promise<CharacterDTO>;
  getCharacter(characterId: string): Promise<CharacterDTO>;
  getSnapshot(campaignId: string): Promise<Snapshot>;
  /** Search the curated SRD bestiary; ids match what AddCombatantFromBestiary expects. */
  searchMonsters(query?: string): Promise<MonsterRefDTO[]>;
  /** Character-creation reference data (curated SRD 2024). */
  getSpecies(): Promise<SpeciesDTO[]>;
  getClasses(): Promise<ClassDTO[]>;
  getBackgrounds(): Promise<BackgroundDTO[]>;
  getSpells(classId?: string): Promise<SpellDTO[]>;
  getWeapons(): Promise<WeaponDTO[]>;
  /** Characters in a campaign (member-visible) — for the DM's seat controls. */
  listCampaignCharacters(campaignId: string): Promise<CharacterDTO[]>;
}

function defaultBaseUrl(): string {
  const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
  return env?.VITE_API_URL ?? 'http://localhost:3000';
}

/** Pull a `code` out of a known error body shape (`{ error, message }`). */
function codeFromErrorBody(body: unknown): string | undefined {
  if (body && typeof body === 'object') {
    const rec = body as Record<string, unknown>;
    if (typeof rec.error === 'string') return rec.error;
    if (typeof rec.code === 'string') return rec.code;
  }
  return undefined;
}

function messageFromErrorBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const rec = body as Record<string, unknown>;
    if (typeof rec.message === 'string') return rec.message;
  }
  return fallback;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? defaultBaseUrl();
  const fetchImpl = options.fetch ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const init: RequestInit = {
      method,
      credentials: 'include',
    };
    // Only declare a JSON content-type when we actually send a body — otherwise
    // Fastify rejects a bodyless POST (e.g. logout) with "Body cannot be empty".
    if (body !== undefined) {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify(body);
    }

    const response = await fetchImpl(`${baseUrl}${path}`, init);

    if (response.status === 204) {
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText || 'Request failed');
      }
      return undefined as T;
    }

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? JSON.parse(text) : undefined;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        messageFromErrorBody(parsed, response.statusText || 'Request failed'),
        codeFromErrorBody(parsed),
      );
    }

    return parsed as T;
  }

  return {
    register(payload) {
      return request<Principal>('POST', '/auth/register', payload);
    },
    login(payload) {
      return request<Principal>('POST', '/auth/login', payload);
    },
    logout() {
      return request<void>('POST', '/auth/logout');
    },
    me() {
      return request<Principal>('GET', '/auth/me');
    },
    listCampaigns() {
      return request<CampaignDTO[]>('GET', '/campaigns');
    },
    createCampaign(payload) {
      return request<CampaignDTO>('POST', '/campaigns', {
        name: payload.name,
        tagline: payload.tagline ?? '',
      });
    },
    invite(campaignId) {
      return request<CampaignDTO>('POST', `/campaigns/${campaignId}/invite`, {});
    },
    joinByCode(joinCode) {
      return request<CampaignDTO>('POST', `/join/${joinCode}`, { joinCode });
    },
    createCharacter(payload) {
      return request<CharacterDTO>('POST', '/characters', payload);
    },
    updateCharacter(characterId, patch) {
      return request<CharacterDTO>('PATCH', `/characters/${characterId}`, patch);
    },
    getCharacter(characterId) {
      return request<CharacterDTO>('GET', `/characters/${characterId}`);
    },
    getSnapshot(campaignId) {
      return request<Snapshot>('GET', `/tables/${campaignId}/snapshot`);
    },
    searchMonsters(query = '') {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      return request<MonsterRefDTO[]>('GET', `/srd/monsters${qs}`);
    },
    getSpecies() {
      return request<SpeciesDTO[]>('GET', '/srd/species');
    },
    getClasses() {
      return request<ClassDTO[]>('GET', '/srd/classes');
    },
    getBackgrounds() {
      return request<BackgroundDTO[]>('GET', '/srd/backgrounds');
    },
    getSpells(classId) {
      const qs = classId ? `?class=${encodeURIComponent(classId)}` : '';
      return request<SpellDTO[]>('GET', `/srd/spells${qs}`);
    },
    getWeapons() {
      return request<WeaponDTO[]>('GET', '/srd/weapons');
    },
    listCampaignCharacters(campaignId) {
      return request<CharacterDTO[]>('GET', `/campaigns/${campaignId}/characters`);
    },
  };
}
