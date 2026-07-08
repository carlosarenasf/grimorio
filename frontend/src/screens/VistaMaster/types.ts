import type { Command } from '@grimorio/shared/commands';
import type { MasterSnapshot } from '@grimorio/shared/wire';

/** A command sink — the screen's only side effect (a `vi.fn()` in tests). */
export type Send = (command: Command) => void;

/** A bestiary entry as surfaced by the injected SRD source. */
export interface MonsterSummary {
  id: string;
  name: string;
  /** Challenge rating label, e.g. "1/4", "5". Optional for flexibility. */
  cr?: string;
  /** Short type/size line, e.g. "Humanoide mediano". */
  kind?: string;
  /** Suggested hit points, shown as a hint in the bestiary row. */
  hp?: number;
}

/** Full monster stat block from the SRD. */
export interface Monster {
  id: string;
  name: string;
  cr: string;
  meta: string;
  ac: number;
  hp: number;
  speed: string;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows?: string[];
  skills?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  languages?: string[];
  traits?: Array<{ name: string; description: string }>;
  actions?: Array<{ name: string; description: string; attack?: { name: string; bonus: number | null; damage: string | null; damageType: string } }>;
  reactions?: Array<{ name: string; description: string }>;
  legendaryActions?: Array<{ name: string; description: string }>;
  attacks?: Array<{ name: string; bonus: number | null; damage: string | null; damageType: string }>;
  externalUrl?: string;
  imageUrl?: string;
}

/**
 * Injected SRD bestiary source. Kept tiny so tests can pass a stub and the
 * real container can wire a curated SRD 5.2 subset later (SPEC §9).
 */
export interface SrdSource {
  searchMonsters(query: string): MonsterSummary[];
}

export type { Command, MasterSnapshot };
