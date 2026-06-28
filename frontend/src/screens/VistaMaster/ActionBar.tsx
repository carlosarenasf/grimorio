import { useState } from 'react';
import { Button } from '../../design';
import type { MasterSnapshot, Send } from './types';

export interface ActionBarProps {
  snapshot: MasterSnapshot;
  send: Send;
  /** The combatant targeted by the heal/damage shortcuts. */
  targetId: string | null;
  /** Amount entered in the central HP-adjust field. */
  amount: string;
  /** Focus the dice notation input (so "Tirar" routes the user there). */
  onFocusDice: () => void;
}

/**
 * Bottom action bar (DESIGN_SPEC.md §5): the master's constant-use combat
 * controls — quick d20, heal/damage to the target by the current amount, and
 * turn navigation. Keyboard-usable real buttons.
 */
export function ActionBar({
  snapshot,
  send,
  targetId,
  amount,
  onFocusDice,
}: ActionBarProps) {
  const parsed = Number.parseInt(amount, 10);
  const validAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const canAdjust = !!targetId && validAmount > 0;
  const combatActive = snapshot.combat.active;
  const [confirmEnd, setConfirmEnd] = useState(false);

  function adjust(type: 'ApplyDamage' | 'ApplyHealing') {
    if (!targetId || validAmount <= 0) return;
    send({ type, combatantId: targetId, amount: validAmount });
  }

  function handleEndCombat() {
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    send({ type: 'EndCombat' });
    setConfirmEnd(false);
  }

  return (
    <footer className="vm-action-bar" aria-label="Barra de acción">
      <div className="vm-action-bar__group">
        <Button
          variant="secondary"
          onClick={() => {
            send({ type: 'RollDice', notation: '1d20', visibility: 'public' });
            onFocusDice();
          }}
        >
          Tirar 1d20
        </Button>
        <Button
          variant="secondary"
          disabled={!canAdjust}
          aria-label="Curar al objetivo"
          onClick={() => adjust('ApplyHealing')}
        >
          Curar objetivo
        </Button>
        <Button
          variant="secondary"
          disabled={!canAdjust}
          aria-label="Aplicar daño al objetivo"
          onClick={() => adjust('ApplyDamage')}
        >
          Daño objetivo
        </Button>
      </div>
      <div className="vm-action-bar__group">
        {combatActive ? (
          <Button variant="secondary" onClick={() => send({ type: 'PrevTurn' })}>
            Turno anterior
          </Button>
        ) : (
          <Button variant="primary" onClick={() => send({ type: 'StartCombat' })}>
            Empezar combate
          </Button>
        )}
        <Button
          variant="primary"
          disabled={!combatActive}
          onClick={() => send({ type: 'NextTurn' })}
        >
          Siguiente turno
        </Button>
        <Button
          variant="secondary"
          disabled={!combatActive}
          onClick={handleEndCombat}
          onBlur={() => setConfirmEnd(false)}
        >
          {confirmEnd ? '¿Seguro? Clic de nuevo' : 'Terminar combate'}
        </Button>
      </div>
    </footer>
  );
}
