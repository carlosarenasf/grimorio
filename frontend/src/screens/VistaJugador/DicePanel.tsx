import { useState } from 'react';
import { Button, Field, Panel } from '../../design';
import type { Send } from './types';

export interface DicePanelProps {
  send: Send;
}

const QUICK_DICE = ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6'];

/**
 * Dados panel (DESIGN_SPEC.md §5, RIGHT column): quick dice buttons + a free
 * notation input, both sending public RollDice — players never have a hidden
 * roll option (that's master-only).
 */
export function DicePanel({ send }: DicePanelProps) {
  const [notation, setNotation] = useState('1d20');

  function roll(n: string) {
    const value = n.trim();
    if (!value) return;
    send({ type: 'RollDice', notation: value, visibility: 'public' });
  }

  return (
    <Panel eyebrow="Dados" title="Dados">
      <div className="vj-dice">
        <div className="vj-dice__quick" role="group" aria-label="Dados rápidos">
          {QUICK_DICE.map((d) => (
            <Button
              key={d}
              type="button"
              variant="secondary"
              size="sm"
              aria-label={`Tirar ${d}`}
              onClick={() => roll(d)}
            >
              {d}
            </Button>
          ))}
        </div>

        <div className="vj-dice__custom">
          <Field
            label="Notación"
            placeholder="2d6+3"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            hint="Prueba algo como 2d6+3."
          />
          <Button type="button" onClick={() => roll(notation)}>
            Tirar
          </Button>
        </div>
      </div>
    </Panel>
  );
}
