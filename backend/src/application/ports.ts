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
import type { MapData } from '../domain/maps/mapData.js';
import type { CampaignId, CharacterId, LiveTableId, MapId, UserId } from '../domain/ids.js';

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
  delete(id: CampaignId): Promise<void>;
}

export interface CharacterRepository {
  save(character: CharacterSheet): Promise<void>;
  findById(id: CharacterId): Promise<CharacterSheet | null>;
  /** Sheets linked to a campaign. */
  listByCampaign(campaignId: CampaignId): Promise<CharacterSheet[]>;
  deleteByCampaign(campaignId: CampaignId): Promise<void>;
}

export interface LiveTableRepository {
  save(table: LiveTable): Promise<void>;
  findById(id: LiveTableId): Promise<LiveTable | null>;
  /** The live table for a campaign (one room per campaign); used to rehydrate. */
  findByCampaignId(campaignId: CampaignId): Promise<LiveTable | null>;
  deleteByCampaign(campaignId: CampaignId): Promise<void>;
}

export interface MapRepository {
  save(map: MapData): Promise<void>;
  findById(id: MapId): Promise<MapData | null>;
  /** Maps belonging to a campaign. */
  listByCampaign(campaignId: CampaignId): Promise<MapData[]>;
  delete(id: MapId): Promise<void>;
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
  description?: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attack?: MonsterAttack;
}

export interface Monster extends MonsterRef {
  ac: number;
  hp: number;
  speed: string; // "9 m"
  attacks: MonsterAttack[];
  // Stats completos (D&D 2024)
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows?: string[]; // ej: ["DES", "CON"]
  skills?: string[]; // ej: ["Percepción", "Sigilo"]
  damageResistances?: string[]; // ej: ["fuego"]
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: string[]; // ej: ["visión en la oscuridad 18m"]
  languages?: string[];
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
  /** URL to the monster's page on 5e.tools. */
  externalUrl?: string;
  /**
   * Optional remote art URL for a token/portrait. SRD 5.2 does not include
   * art; this is a user-supplied link to community/Creator-licensed art.
   * The frontend renders it with CORS allowed; the backend does not proxy.
   */
  imageUrl?: string;
}

export interface RuleSection {
  id: string;
  title: string;
  body: string;
}

export interface SpeciesTrait {
  name: string;
  description: string;
}

export interface SpeciesDef {
  id: string;
  name: string;
  size: string;
  speed: number;
  description: string;
  traits: SpeciesTrait[];
  /** URL to the species page on 5e.tools (Spanish where available). */
  externalUrl?: string;
}

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
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
  features: ClassFeature[];
  /** URL to the class page on 5e.tools. */
  externalUrl?: string;
  /**
   * Spell slot count per character level (1-20), indexed by slot level 1-9.
   * Only meaningful for full / half casters. A 0 in a position means no
   * slot at that level. The keys of the record are 1-20.
   */
  spellSlots?: Record<number, [number, number, number, number, number, number, number, number, number]>;
  /**
   * Warlock pact magic — short-rest based, with at most a few slots at the
   * highest level. [count, slot level] per character level (1-20).
   */
  warlockSpellSlots?: Record<number, [number, number]>;
}

export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  abilityOptions: string[];
  skills: string[];
  externalUrl?: string;
}

export interface SpellDef {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  description: string;
  damage?: string | null;
  /** URL to the spell page on 5e.tools. */
  externalUrl?: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  category: 'simple' | 'martial';
  damage: string;
  damageType: string;
  properties: string[];
  ability: 'str' | 'dex' | 'finesse';
  externalUrl?: string;
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
  weapons(): WeaponDef[];
}
