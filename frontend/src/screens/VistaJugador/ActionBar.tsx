import { Button } from '../../design';
import type { Send } from './types';

export interface ActionBarProps {
  send: Send;
  /** Whether it is currently the viewer's turn — gates "Terminar turno". */
  isYourTurn: boolean;
}

/**
 * Bottom action bar (DESIGN_SPEC.md §5): "Tirar d20" is always available;
 * "Terminar turno →" appears only on your turn (per design, the viewer must
 * be active to end their own turn).
 */
export function ActionBar({ send, isYourTurn }: ActionBarProps) {
  return (
    <footer className="vj-action-bar" aria-label="Barra de acción">
      <Button
        type="button"
        variant="secondary"
        onClick={() => send({ type: 'RollDice', notation: '1d20', visibility: 'public' })}
      >
        Tirar d20
      </Button>
      {isYourTurn ? (
        <Button type="button" onClick={() => send({ type: 'EndMyTurn' })}>
          Terminar turno →
        </Button>
      ) : null}
    </footer>
  );
}
