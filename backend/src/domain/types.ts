/**
 * Core domain entity types — frozen from SPEC.md §5.
 *
 * These are the canonical aggregates and value objects every later wave depends
 * on. Branded ids (see ./ids.ts) are used for entity identity so distinct id
 * kinds are not interchangeable. Derived 5e values (ability mods, proficiency,
 * spell save DC, etc.) are NOT stored here — the server computes them on the fly
 * (SPEC §7); the persisted truth is only what appears below.
 */
import type { CampaignId, CharacterId, CombatantId, LiveTableId, UserId } from './ids.js';

// ---------- Visibility & roles ----------
export type Visibility = 'public' | 'dm_only' | 'owner';
export type Role = 'dm' | 'player';
export type CampaignStatus = 'planning' | 'active' | 'paused';

// ---------- Accounts ----------
export interface User {
  id: UserId;
  email: string;
  passwordHash: string; // argon2id/bcrypt; never projected to clients
  displayName: string; // "how you'll be seen at the table"
  createdAt: string;
}

// ---------- Campaign (persistent) ----------
export interface CampaignMember {
  userId: UserId;
  role: Role; // 1 'dm' + N 'player'
  joinedAt: string;
}

export interface Campaign {
  id: CampaignId;
  ownerId: UserId; // the creating DM
  name: string;
  tagline: string; // short synopsis (optional)
  status: CampaignStatus;
  joinCode: string; // e.g. "RAVEN-77"; base of the /unirse/CODE link
  members: CampaignMember[];
  characterIds: CharacterId[]; // sheets linked to this campaign
  sessionCount: number; // counter shown on the card
  createdAt: string;
}

// ---------- Character sheet (5e 2024 / SRD 5.2) ----------
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AttackKind = 'weapon' | 'spell' | 'save';

export interface Attack {
  id: string;
  name: string;
  kind: AttackKind;
  bonus: number | null; // attack bonus (null for save-based spells)
  damage: string | null; // notation: "1d8+4"
  damageType: string; // "perforante", "fuego"…
}

export interface InventoryItem {
  id: string;
  name: string;
  note: string; // "2d4+2 PV", "15 m"…
  qty: number;
  equipped: boolean; // visual tag; does NOT affect calculations (tracking only)
}

export interface CharacterSheet {
  id: CharacterId;
  campaignId: CampaignId;
  ownerId: UserId; // user id of the owning player
  name: string;
  species: string; // "Elfo"
  className: string; // "Explorador"
  background: string; // "Forastero"
  level: number; // 1–20
  scores: Record<AbilityKey, number>; // 3–20
  // Derived values are COMPUTED by the server (not persisted as truth):
  //   mod(score) = floor((score-10)/2); profBonus = ceil(level/4)+1; etc.
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number; // metres (10.5 ≈ 35 ft)
  proficientSkills: string[]; // keys of the 18 skills
  attacks: Attack[];
  inventory: InventoryItem[];
  gold: number;
  notes: string; // traits, personality, bonds…
  visibility: Visibility; // typically 'owner' (HP is projected public in combat)
}

// ---------- Combat / live session ----------
export type CombatantType = 'pc' | 'monster';

export interface Condition {
  key: string; // "poisoned", "marked", "blessed"…
  label: string;
  color: string; // colour token (chip/dot)
}

export interface Combatant {
  id: CombatantId;
  refId: string | null; // sheet (pc) or bestiary entry (monster)
  type: CombatantType;
  name: string;
  initiative: number;
  maxHp: number;
  currentHp: number;
  conditions: Condition[];
  hpVisibility: Visibility; // 'public' for PCs, 'dm_only' for hidden monsters
  // If hpVisibility === 'dm_only', the server projects to players ONLY a derived
  // label (statusLabel), never the real HP.
}

export interface CombatState {
  active: boolean;
  round: number; // round counter shown on the bar
  order: CombatantId[]; // Combatant ids, ordered desc by initiative
  currentTurnIndex: number;
}

export interface DiceRoll {
  id: string;
  byUserId: UserId;
  byLabel: string; // "Lyra", "Máster"
  notation: string; // "2d6+3", "1d20" or an attack name
  results: number[]; // individual rolls
  breakdown: string; // "20 + 8"
  total: number;
  tone: 'normal' | 'crit' | 'fumble';
  visibility: Visibility; // 'public' open, 'dm_only' hidden
  at: string; // ISO timestamp
}

export interface CombatEvent {
  // event log (separate from the roll log)
  id: string;
  text: string; // "Brom queda envenenado", "Empieza la ronda 3"
  color: string;
  visibility: Visibility;
  at: string;
}

export interface LiveTable {
  id: LiveTableId;
  campaignId: CampaignId;
  combatants: Combatant[];
  combat: CombatState;
  rollLog: DiceRoll[];
  eventLog: CombatEvent[];
  dmNotes: string; // implicit visibility 'dm_only'
  version: number; // optimistic concurrency / event ordering
}
