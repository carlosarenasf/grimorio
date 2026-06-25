import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import type { DieType } from './Dice3D';
import type { DiceRollView } from './DiceRoller';

// three.js is heavy — load the 3D dice scene only when the modal first opens.
const DiceCanvas = lazy(() =>
  import('./DiceCanvas').then((m) => ({ default: m.DiceCanvas })),
);

const DIE_TYPES: { type: DieType; faces: number }[] = [
  { type: 'd4', faces: 4 },
  { type: 'd6', faces: 6 },
  { type: 'd8', faces: 8 },
  { type: 'd10', faces: 10 },
  { type: 'd12', faces: 12 },
  { type: 'd20', faces: 20 },
  { type: 'd100', faces: 100 },
];

export interface DiceModalProps {
  open: boolean;
  onClose: () => void;
  /** Sends the built notation (e.g. "2d20+3"); the server resolves it. */
  onRoll: (notation: string) => void;
  /** The latest roll from the live snapshot — used to settle the animation. */
  latestRoll?: DiceRollView | null;
}

/**
 * Dice tray modal: pick how many dice of which type (+ modifier), roll, and
 * watch them tumble in 3D before settling on the server-resolved result.
 */
export function DiceModal({ open, onClose, onRoll, latestRoll }: DiceModalProps) {
  const [faces, setFaces] = useState(20);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rolling, setRolling] = useState(false);
  // The roll id present when we pressed "Tirar", so we can detect OUR result.
  const startId = useRef<string | null>(null);
  const [settled, setSettled] = useState<DiceRollView | null>(null);

  const dieType = (DIE_TYPES.find((d) => d.faces === faces)?.type ?? 'd20') as DieType;
  const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
  const notation = `${count}d${faces}${modStr}`;

  // Settle the tumble once a new roll arrives (min spin time for the effect).
  useEffect(() => {
    if (!rolling) return;
    if (latestRoll && latestRoll.id !== startId.current) {
      const t = setTimeout(() => {
        setSettled(latestRoll);
        setRolling(false);
      }, 650);
      return () => clearTimeout(t);
    }
    // Safety stop if no result comes back (e.g. cold start).
    const t = setTimeout(() => setRolling(false), 2600);
    return () => clearTimeout(t);
  }, [rolling, latestRoll]);

  if (!open) return null;

  function roll() {
    startId.current = latestRoll?.id ?? null;
    setSettled(null);
    setRolling(true);
    onRoll(notation);
  }

  const showResults = !rolling && settled && settled.results && settled.results.length > 0;
  const trayCount = showResults ? settled!.results!.length : count;
  const tone = settled?.tone ?? 'normal';

  return (
    <div className="dice-modal__backdrop" onClick={onClose}>
      <div
        className="dice-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tirar dados"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dice-modal__head">
          <h2 className="font-display dice-modal__title">Tirar dados</h2>
          <button
            type="button"
            className="dice-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* 3D tray (three.js, lazy-loaded) */}
        <div className="dice-modal__tray">
          <Suspense fallback={<div className="dice-canvas" />}>
            <DiceCanvas
              dice={Array.from({ length: Math.min(trayCount, 30) }, () => dieType)}
              rolling={rolling}
              results={showResults ? settled!.results! : null}
              tone={tone}
            />
          </Suspense>
        </div>

        <div className="dice-modal__result" aria-live="polite">
          {showResults ? (
            <>
              <span className="dice-modal__total" data-tone={tone}>
                {settled!.total}
              </span>
              <span className="dice-modal__detail">
                {settled!.notation}
                {settled!.breakdown ? ` = ${settled!.breakdown}` : ''}
                {tone === 'crit' ? ' · ¡Crítico!' : tone === 'fumble' ? ' · ¡Pifia!' : ''}
              </span>
            </>
          ) : rolling ? (
            <span className="dice-modal__detail">Tirando {notation}…</span>
          ) : (
            <span className="dice-modal__detail">Elige tu tirada y lanza.</span>
          )}
        </div>

        {/* Picker */}
        <div className="dice-modal__picker">
          <div className="dice-modal__dies" role="group" aria-label="Tipo de dado">
            {DIE_TYPES.map((d) => (
              <button
                key={d.type}
                type="button"
                className="dice-modal__die-btn"
                data-selected={faces === d.faces || undefined}
                aria-pressed={faces === d.faces}
                onClick={() => setFaces(d.faces)}
              >
                {d.type}
              </button>
            ))}
          </div>

          <div className="dice-modal__controls">
            <label className="dice-modal__ctl">
              <span className="eyebrow">Cantidad</span>
              <div className="dice-modal__stepper">
                <button type="button" aria-label="Menos dados" onClick={() => setCount((c) => Math.max(1, c - 1))}>
                  −
                </button>
                <span className="tabular-nums">{count}</span>
                <button type="button" aria-label="Más dados" onClick={() => setCount((c) => Math.min(30, c + 1))}>
                  +
                </button>
              </div>
            </label>

            <label className="dice-modal__ctl">
              <span className="eyebrow">Modificador</span>
              <div className="dice-modal__stepper">
                <button type="button" aria-label="Menos modificador" onClick={() => setModifier((m) => m - 1)}>
                  −
                </button>
                <span className="tabular-nums">{modifier >= 0 ? `+${modifier}` : modifier}</span>
                <button type="button" aria-label="Más modificador" onClick={() => setModifier((m) => m + 1)}>
                  +
                </button>
              </div>
            </label>

            <span className="dice-modal__notation tabular-nums" aria-label="Notación">
              {notation}
            </span>
          </div>
        </div>

        <div className="dice-modal__actions">
          <Button variant="primary" size="lg" onClick={roll} disabled={rolling}>
            {rolling ? 'Tirando…' : `Tirar ${notation}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
