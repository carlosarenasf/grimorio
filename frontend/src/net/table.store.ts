/**
 * Observable store for the latest live-table `Snapshot` (`shared/src/wire.ts`).
 *
 * The WS client (`ws.ts`) and the HTTP fallback (`ApiClient.getSnapshot`)
 * both feed this store via `applySnapshot`; screens subscribe to re-render.
 * Snapshots are role-filtered server-side, so this store never branches on
 * role itself — it just holds whatever the server sent.
 */
import type { PublicCombatantDTO, Snapshot } from '@grimorio/shared/wire';

export type TableListener = () => void;

export interface TableStore {
  applySnapshot(snapshot: Snapshot): void;
  get(): Snapshot | null;
  subscribe(listener: TableListener): () => void;
}

export function createTableStore(): TableStore {
  let state: Snapshot | null = null;
  const listeners = new Set<TableListener>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    applySnapshot(snapshot: Snapshot) {
      state = snapshot;
      notify();
    },
    get() {
      return state;
    },
    subscribe(listener: TableListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * The combatant whose turn it currently is, or null when combat isn't active,
 * the order is empty, or the indexed id has no matching combatant.
 */
export function getActiveCombatant(snapshot: Snapshot | null): PublicCombatantDTO | null {
  if (!snapshot) return null;
  const { combat, combatants } = snapshot;
  if (!combat.active) return null;
  const activeId = combat.order[combat.currentTurnIndex];
  if (!activeId) return null;
  return combatants.find((c) => c.id === activeId) ?? null;
}
