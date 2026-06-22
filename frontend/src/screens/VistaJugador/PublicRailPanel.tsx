import { InitiativeRail, Panel } from '../../design';
import type { InitiativeToken } from '../../design';
import { getActiveCombatant } from '../../net';
import type { PlayerSnapshot } from './types';

export interface PublicRailPanelProps {
  snapshot: PlayerSnapshot;
}

/**
 * The public Initiative Rail (DESIGN_SPEC.md §4/§5), rendered exactly as the
 * server projected it: monsters carry a `statusLabel` and NEVER numeric HP
 * (the visibility guarantee — `PlayerSnapshot` structurally cannot hold a
 * hidden monster's real HP, so this panel has no number to leak even by
 * accident). PCs show real HP, which is always public.
 */
export function PublicRailPanel({ snapshot }: PublicRailPanelProps) {
  const active = getActiveCombatant(snapshot);
  const tokens: InitiativeToken[] = snapshot.combatants.map((c) => ({
    id: c.id,
    name: c.name,
    initiative: c.initiative,
    type: c.type,
    hp: c.currentHp,
    maxHp: c.maxHp,
    statusLabel: c.statusLabel,
    conditions: c.conditions.map((cond) => ({ label: cond.label, color: cond.color })),
  }));

  return (
    <Panel eyebrow="Mesa" title="Iniciativa">
      <InitiativeRail tokens={tokens} activeId={active?.id ?? null} />
    </Panel>
  );
}
