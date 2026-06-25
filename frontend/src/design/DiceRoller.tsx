import { useEffect, useRef, useState } from 'react';

export interface DiceRollView {
  id: string;
  total: number;
  tone: 'normal' | 'crit' | 'fumble';
  notation: string;
  breakdown: string;
  byLabel?: string;
  /** Individual die results (for the 3D tray to show each die's face). */
  results?: number[];
}

export interface DiceRollerProps {
  /** The most recent roll to display; a change of `id` replays the animation. */
  latestRoll?: DiceRollView | null;
}

/**
 * Animated die + prominent result. Server-authoritative: the parent feeds the
 * latest roll from the live snapshot; when its `id` changes we spin the die for
 * a beat, then reveal the total (gold for a crit, ember for a fumble). The
 * spin honours `prefers-reduced-motion` via the global token CSS.
 */
export function DiceRoller({ latestRoll }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestRoll || latestRoll.id === lastId.current) return;
    lastId.current = latestRoll.id;
    setRolling(true);
    const t = setTimeout(() => setRolling(false), 850);
    return () => clearTimeout(t);
  }, [latestRoll?.id]);

  const tone = latestRoll?.tone ?? 'normal';

  return (
    <div className="dice-roller" data-tone={tone} data-rolling={rolling ? 'true' : 'false'}>
      <div className="dice-roller__stage" aria-hidden="true">
        <svg className="dice-roller__die" viewBox="0 0 100 100" width="84" height="84">
          <polygon
            className="dice-roller__shape"
            points="50,4 88,28 88,72 50,96 12,72 12,28"
          />
          <text
            className="dice-roller__num"
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {rolling ? '?' : (latestRoll?.total ?? '—')}
          </text>
        </svg>
      </div>

      <div className="dice-roller__result" role="status" aria-live="polite">
        {latestRoll ? (
          rolling ? (
            <span className="dice-roller__rolling">Tirando {latestRoll.notation}…</span>
          ) : (
            <>
              <span className="dice-roller__total">{latestRoll.total}</span>
              <span className="dice-roller__detail">
                {latestRoll.byLabel ? `${latestRoll.byLabel} · ` : ''}
                {latestRoll.notation}
                {latestRoll.breakdown ? ` = ${latestRoll.breakdown}` : ''}
                {tone === 'crit' ? ' · ¡Crítico!' : tone === 'fumble' ? ' · ¡Pifia!' : ''}
              </span>
            </>
          )
        ) : (
          <span className="dice-roller__empty">Tira para empezar.</span>
        )}
      </div>
    </div>
  );
}
