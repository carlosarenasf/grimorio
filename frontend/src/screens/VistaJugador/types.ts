import type { Command } from '@grimorio/shared/commands';
import type { PlayerSnapshot } from '@grimorio/shared/wire';

/** A command sink — the screen's only side effect (a `vi.fn()` in tests). */
export type Send = (command: Command) => void;

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityScores = Record<AbilityKey, number>;

export type AttackKind = 'weapon' | 'spell' | 'save';

/** An attack/spell entry from the character sheet, ready to roll. */
export interface AttackDef {
  id: string;
  name: string;
  kind: AttackKind;
  /** Attack bonus; null for save-based spells (no "to hit" roll). */
  bonus: number | null;
  /** Damage notation, e.g. "1d8+4". */
  damage: string | null;
}

/** An inventory line (equipped gear or backpack item) — local tracking only. */
export interface InventoryItem {
  id: string;
  name: string;
  note: string;
  qty: number;
  equipped: boolean;
}

/**
 * The viewer's own character, as needed to render TU FICHA + the action
 * economy. Not part of `PlayerSnapshot` (the wire snapshot only carries
 * combat-table state) — the container resolves it from the owned
 * `CharacterDTO` and passes it in alongside the snapshot.
 */
export interface YouCharacter {
  /** The combatant id for this character on the current live table, if seated. */
  combatantId: string | null;
  characterId: string;
  name: string;
  scores: AbilityScores;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  /** Proficiency bonus, e.g. "+2". Precomputed by the caller (server-derived). */
  proficiencyBonus: number;
  /** Initiative bonus (typically the DEX modifier), shown in CA/Vel/Comp/Init. */
  initiative: number;
  attacks: AttackDef[];
  inventory: InventoryItem[];
  gold: number;
}

export type { Command, PlayerSnapshot };
