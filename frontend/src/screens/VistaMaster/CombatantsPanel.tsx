import { useState } from 'react';
import { Panel, StatNumber } from '../../design';
import type { MasterSnapshot } from './types';

export interface CombatantsPanelProps {
  snapshot: MasterSnapshot;
  /** id of the combatant targeted by HP adjust / detail actions. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Apply damage / healing to any combatant directly from its row. */
  onDamage: (id: string, amount: number) => void;
  onHeal: (id: string, amount: number) => void;
  /** Remove a combatant from the battle. */
  onRemove: (id: string) => void;
  /** Open a PC's character sheet (given its characterId). */
  onViewSheet?: (characterId: string) => void;
}

/**
 * Combatientes panel (LEFT column): the full combatant list. The master sees
 * real numeric HP for everyone (including dm_only monsters) and can damage or
 * heal ANY combatant directly from its row by the chosen amount.
 */
export function CombatantsPanel({
  snapshot,
  selectedId,
  onSelect,
  onDamage,
  onHeal,
  onRemove,
  onViewSheet,
}: CombatantsPanelProps) {
  const { combatants } = snapshot;
  const [amount, setAmount] = useState('1');
  const amt = Math.max(0, Math.round(Number(amount) || 0));

  return (
    <Panel
      eyebrow="Mesa"
      title="Combatientes"
      actions={
        <label className="vm-combatants__amount">
          <span className="eyebrow">PV</span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="PV a aplicar por fila"
          />
        </label>
      }
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
              <li
                key={c.id}
                className={[
                  'vm-combatants__row',
                  selected ? 'vm-combatants__row--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="vm-combatants__pick"
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
                          c.maxHp && c.currentHp <= c.maxHp * 0.25 ? 'damage' : undefined
                        }
                      />
                      <span className="vm-combatants__hp-max tabular-nums">/{c.maxHp}</span>
                    </span>
                  ) : c.statusLabel ? (
                    <span className="vm-combatants__status">{c.statusLabel}</span>
                  ) : null}
                </button>
                {onViewSheet && c.type === 'pc' && c.characterId ? (
                  <button
                    type="button"
                    className="vm-hpbtn vm-hpbtn--sheet"
                    aria-label={`Ver la ficha de ${c.name}`}
                    title="Ver ficha"
                    onClick={() => onViewSheet(c.characterId as string)}
                  >
                    📜
                  </button>
                ) : null}
                <div className="vm-combatants__hpctl" role="group" aria-label={`Ajustar PV de ${c.name}`}>
                  <button
                    type="button"
                    className="vm-hpbtn vm-hpbtn--dmg"
                    aria-label={`Quitar ${amt} PV a ${c.name}`}
                    disabled={amt <= 0}
                    onClick={() => onDamage(c.id, amt)}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="vm-hpbtn vm-hpbtn--heal"
                    aria-label={`Curar ${amt} PV a ${c.name}`}
                    disabled={amt <= 0}
                    onClick={() => onHeal(c.id, amt)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="vm-hpbtn vm-hpbtn--remove"
                    aria-label={`Sacar a ${c.name} del combate`}
                    title="Sacar del combate"
                    onClick={() => onRemove(c.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}
