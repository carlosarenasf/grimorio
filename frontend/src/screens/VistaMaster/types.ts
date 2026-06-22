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

/**
 * Injected SRD bestiary source. Kept tiny so tests can pass a stub and the
 * real container can wire a curated SRD 5.2 subset later (SPEC §9).
 */
export interface SrdSource {
  searchMonsters(query: string): MonsterSummary[];
}

export type { Command, MasterSnapshot };
