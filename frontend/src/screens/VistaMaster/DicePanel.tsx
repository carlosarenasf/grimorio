import { lazy, Suspense, useState } from 'react';
import { Button, DiceModal, DICE_PALETTE, Field, Panel } from '../../design';
import type { DiceRollView } from '../../design';
import type { Send } from './types';

const DiceResult3D = lazy(() =>
  import('../../design/DiceResult3D').then((m) => ({ default: m.DiceResult3D })),
);

export interface DicePanelProps {
  send: Send;
  /** Latest roll from the live snapshot — drives the animated die + result. */
  latestRoll?: DiceRollView | null;
}

const QUICK_DICE = ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6'];

/**
 * Dados panel (RIGHT column): quick dice buttons + a free notation input that
 * send RollDice (public), plus the dashed "tirada oculta" button that sends
 * RollHidden (dm-only result, surfaced only in the master's log).
 */
export function DicePanel({ send, latestRoll }: DicePanelProps) {
  const [notation, setNotation] = useState('1d20');
  const [modalOpen, setModalOpen] = useState(false);
  const [color, setColor] = useState(DICE_PALETTE[0]!);

  function rollOpen(n: string) {
    const value = n.trim();
    if (!value) return;
    send({ type: 'RollDice', notation: value, visibility: 'public' });
  }

  function rollHidden() {
    const value = notation.trim();
    if (!value) return;
    send({ type: 'RollHidden', notation: value });
  }

  return (
    <Panel eyebrow="Dados" title="Tirar">
      <div className="vm-dice">
        <Suspense fallback={<div className="dice-canvas" />}>
          <DiceResult3D latestRoll={latestRoll} color={color} />
        </Suspense>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          🎲 Tirar dados…
        </Button>
        <DiceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onRoll={(n) => rollOpen(n)}
          latestRoll={latestRoll}
          color={color}
          onColorChange={setColor}
        />
        <div className="vm-dice__quick" role="group" aria-label="Dados rápidos">
          {QUICK_DICE.map((d) => (
            <Button
              key={d}
              variant="secondary"
              size="sm"
              aria-label={`Tirar ${d}`}
              onClick={() => rollOpen(d)}
            >
              {d}
            </Button>
          ))}
        </div>

        <div className="vm-dice__custom">
          <Field
            label="Notación"
            placeholder="2d6+3"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            hint="Prueba algo como 2d6+3."
          />
          <div className="vm-dice__custom-actions">
            <Button onClick={() => rollOpen(notation)}>Tirar</Button>
            <button
              type="button"
              className="vm-dice__hidden"
              onClick={rollHidden}
            >
              Tirada oculta
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
