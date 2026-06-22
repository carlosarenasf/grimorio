import { Button, Panel, StatNumber } from '../../design';
import type { MasterSnapshot, Send } from './types';

export interface ActiveTurnPanelProps {
  snapshot: MasterSnapshot;
  send: Send;
  /** The combatant targeted by the HP controls (the selected/active one). */
  targetId: string | null;
  /** Current amount entered in the HP-adjust field. */
  amount: string;
  onAmountChange: (value: string) => void;
}

/**
 * Active-turn panel (CENTER): the targeted combatant's HP shown big, quick
 * attacks placeholder, and the HP-adjust controls (amount + heal/damage).
 * Damage/heal send ApplyDamage/ApplyHealing for the targeted combatant.
 */
export function ActiveTurnPanel({
  snapshot,
  send,
  targetId,
  amount,
  onAmountChange,
}: ActiveTurnPanelProps) {
  const target = snapshot.combatants.find((c) => c.id === targetId) ?? null;
  const parsed = Number.parseInt(amount, 10);
  const validAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  function adjust(type: 'ApplyDamage' | 'ApplyHealing') {
    if (!target || validAmount <= 0) return;
    send({ type, combatantId: target.id, amount: validAmount });
  }

  return (
    <Panel
      eyebrow="Turno activo"
      title={target ? target.name : 'Sin objetivo'}
    >
      {target ? (
        <div className="vm-active">
          <div className="vm-active__hp">
            {target.currentHp !== undefined && target.maxHp !== undefined ? (
              <>
                <StatNumber
                  className="vm-active__hp-current"
                  value={target.currentHp}
                  label={`PV actuales de ${target.name}`}
                  role={
                    target.maxHp && target.currentHp <= target.maxHp * 0.25
                      ? 'damage'
                      : undefined
                  }
                />
                <span className="vm-active__hp-max tabular-nums">
                  / {target.maxHp} PV
                </span>
              </>
            ) : (
              <span className="vm-active__status">{target.statusLabel}</span>
            )}
          </div>

          <div className="vm-active__adjust">
            <label className="eyebrow" htmlFor="vm-hp-amount">
              Cantidad de PV
            </label>
            <input
              id="vm-hp-amount"
              className="field__control vm-active__amount tabular-nums"
              type="number"
              min={0}
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
            />
            <div className="vm-active__adjust-buttons">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => adjust('ApplyHealing')}
                disabled={validAmount <= 0}
              >
                Curar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => adjust('ApplyDamage')}
                disabled={validAmount <= 0}
              >
                Daño
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="vm-empty">
          Selecciona un combatiente para ajustar sus PV.
        </p>
      )}
    </Panel>
  );
}
