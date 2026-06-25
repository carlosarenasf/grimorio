/**
 * Application ports (hexagonal architecture) — interfaces ONLY, no implementations.
 *
 * The application layer orchestrates the pure domain through these ports; infra
 * adapters (Postgres, argon2, WS broadcaster, SRD JSON) implement them in Wave 2.
 * Keeping them here lets handlers be tested against in-memory fakes and keeps the
 * domain free of I/O. Exact shapes are frozen in Wave 0 so downstream waves rely
 * on stable signatures.
 */
import type {
  Campaign,
  CharacterSheet,
  Condition,
  LiveTable,
  Role,
  User,
} from '../domain/types.js';
import type { CampaignId, CharacterId, LiveTableId, UserId } from '../domain/ids.js';

// ---------- Domain-owned primitives (re-exported for application/infra) ----------

// `Rng` and `Clock` are defined in the domain (it depends on them) and re-exported
// here so application handlers and infra adapters import them from one place.
export type { Clock, Rng } from '../domain/ports.js';

// ---------- Infrastructure primitives ----------

/** Password hashing port (argon2id/bcrypt adapter). Domain never sees plaintext. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

// ---------- Repositories ----------

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface CampaignRepository {
  save(campaign: Campaign): Promise<void>;
  findById(id: CampaignId): Promise<Campaign | null>;
  findByJoinCode(joinCode: string): Promise<Campaign | null>;
  /** Campaigns the user is a member of (for the Campañas list). */
  listForUser(userId: UserId): Promise<Campaign[]>;
}

export interface CharacterRepository {
  save(character: CharacterSheet): Promise<void>;
  findById(id: CharacterId): Promise<CharacterSheet | null>;
  /** Sheets linked to a campaign. */
  listByCampaign(campaignId: CampaignId): Promise<CharacterSheet[]>;
}

export interface LiveTableRepository {
  save(table: LiveTable): Promise<void>;
  findById(id: LiveTableId): Promise<LiveTable | null>;
  /** The live table for a campaign (one room per campaign); used to rehydrate. */
  findByCampaignId(campaignId: CampaignId): Promise<LiveTable | null>;
}

// ---------- Broadcaster ----------

/**
 * Role-aware payload for a single recipient. The application produces these via
 * the visibility projection (domain) so the broadcaster only routes already
 * filtered data — it never decides visibility itself. The concrete `data` type
 * is the wire DTO union (shared/), kept `unknown` here to avoid a transport dep.
 */
export interface RoleAwarePayload {
  userId: UserId;
  role: Role;
  data: unknown;
}

/**
 * Per-room fan-out. `toRoom` delivers each recipient their own role-filtered
 * payload. The exact wire envelope is finalised with the WS gateway (3b); the
 * interface is frozen here.
 */
export interface Broadcaster {
  toRoom(roomId: string, payloads: RoleAwarePayload[]): void;
}

// ---------- SRD provider (1h) ----------

export interface MonsterRef {
  id: string;
  name: string;
  cr: string; // challenge rating, e.g. "1/4", "5"
  meta: string; // size/type line, e.g. "Humanoide Mediano"
}

export interface MonsterAttack {
  name: string;
  bonus: number | null;
  damage: string | null; // "1d8+2"
  damageType: string;
}

export interface Monster extends MonsterRef {
  ac: number;
  hp: number;
  speed: string; // "9 m"
  attacks: MonsterAttack[];
}

export interface RuleSection {
  id: string;
  title: string;
  body: string;
}

export interface SpeciesDef {
  id: string;
  name: string;
  size: string;
  speed: number;
  description: string;
  traits: string[];
}

export interface ClassDef {
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

export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  abilityOptions: string[];
  skills: string[];
}

export interface SpellDef {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  description: string;
}

/** Curated SRD 5.2 data source (conditions, rules, bestiary, creation reference). */
export interface SrdProvider {
  searchMonsters(query: string): MonsterRef[];
  getMonster(id: string): Monster | null;
  conditions(): Condition[];
  rulesReference(): RuleSection[];
  species(): SpeciesDef[];
  classes(): ClassDef[];
  backgrounds(): BackgroundDef[];
  spells(classId?: string): SpellDef[];
}
