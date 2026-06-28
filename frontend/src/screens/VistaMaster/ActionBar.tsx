import { useState } from 'react';
import { Button } from '../../design';
import type { MasterSnapshot, Send } from './types';

export interface ActionBarProps {
  snapshot: MasterSnapshot;
  send: Send;
}

export function ActionBar({
  snapshot,
  send,
}: ActionBarProps) {
  const combatActive = snapshot.combat.active;
  const [confirmEnd, setConfirmEnd] = useState(false);

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
