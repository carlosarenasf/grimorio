import { lazy, Suspense, useState } from 'react';
import { Button, DiceModal, DICE_PALETTE, Field, Panel } from '../../design';
import type { DiceRollView } from '../../design';
import type { Send } from './types';

const DiceResult3D = lazy(() =>
  import('../../design/DiceResult3D').then((m) => ({ default: m.DiceResult3D })),
);

export interface DicePanelProps {
  send: Send;
  /** Latest public roll from the snapshot — drives the animated die + result. */
  latestRoll?: DiceRollView | null;
}

const QUICK_DICE = ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6'];

/**
 * Dados panel (DESIGN_SPEC.md §5, RIGHT column): quick dice buttons + a free
 * notation input, both sending public RollDice — players never have a hidden
 * roll option (that's master-only).
 */
export function DicePanel({ send, latestRoll }: DicePanelProps) {
  const [notation, setNotation] = useState('1d20');
  const [modalOpen, setModalOpen] = useState(false);
  const [color, setColor] = useState(DICE_PALETTE[0]!);

  function roll(n: string) {
    const value = n.trim();
    if (!value) return;
    send({ type: 'RollDice', notation: value, visibility: 'public' });
  }

  return (
    <Panel eyebrow="Dados" title="Dados">
      <div className="vj-dice">
        <Suspense fallback={<div className="dice-canvas" />}>
          <DiceResult3D latestRoll={latestRoll} color={color} />
        </Suspense>
        <Button type="button" variant="primary" onClick={() => setModalOpen(true)}>
          🎲 Tirar dados…
        </Button>
        <DiceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onRoll={(n) => roll(n)}
          latestRoll={latestRoll}
          color={color}
          onColorChange={setColor}
        />
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
