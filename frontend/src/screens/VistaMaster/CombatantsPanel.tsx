import { Panel, StatNumber } from '../../design';
import type { MasterSnapshot } from './types';

export interface CombatantsPanelProps {
  snapshot: MasterSnapshot;
  /** id of the combatant targeted by HP adjust / detail actions. */
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Combatientes panel (LEFT column): the full combatant list. The master sees
 * real numeric HP for everyone (including dm_only monsters). Selecting a row
 * targets it for the active-turn HP controls.
 */
export function CombatantsPanel({
  snapshot,
  selectedId,
  onSelect,
}: CombatantsPanelProps) {
  const { combatants } = snapshot;
  return (
    <Panel
      eyebrow="Mesa"
      title="Combatientes"
      empty={
        combatants.length === 0 ? (
          <p className="vm-empty">Aún no hay combatientes. Añade uno desde el bestiario.</p>
        ) : undefined
      }
    >
      {combatants.length > 0 ? (
        <ul className="vm-combatants" aria-label="Lista de combatientes">
          {combatants.map((c) => {
            const selected = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={[
                    'vm-combatants__row',
                    selected ? 'vm-combatants__row--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="vm-combatants__name">{c.name}</span>
                  <span className="vm-combatants__type eyebrow">
                    {c.type === 'pc' ? 'PJ' : 'Monstruo'}
                  </span>
                  {c.currentHp !== undefined && c.maxHp !== undefined ? (
                    <span className="vm-combatants__hp">
                      <StatNumber
                        value={c.currentHp}
                        label={`PV de ${c.name}`}
                        role={
                          c.maxHp && c.currentHp <= c.maxHp * 0.25
                            ? 'damage'
                            : undefined
                        }
                      />
                      <span className="vm-combatants__hp-max tabular-nums">
                        /{c.maxHp}
                      </span>
                    </span>
                  ) : c.statusLabel ? (
                    <span className="vm-combatants__status">{c.statusLabel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}
