import { Panel, StatNumber } from '../../design';
import type { PlayerSnapshot } from './types';

export interface PublicLogPanelProps {
  snapshot: PlayerSnapshot;
}

/**
 * Public roll log (DESIGN_SPEC.md §5/§6): every roll a `PlayerSnapshot`
 * carries is already public (the server never sends a player a hidden
 * roll), so this panel renders the whole `rollLog` verbatim, breakdown +
 * total, tinted by tone (crit arcane, fumble ember).
 */
export function PublicLogPanel({ snapshot }: PublicLogPanelProps) {
  const rolls = snapshot.rollLog;

  return (
    <Panel
      eyebrow="Mesa"
      title="Tiradas"
      empty={
        rolls.length === 0 ? (
          <p className="vj-empty">Aún no hay tiradas. Lanza los dados para empezar.</p>
        ) : undefined
      }
    >
      {rolls.length > 0 ? (
        <ul className="vj-log" aria-label="Tiradas">
          {rolls.map((roll) => (
            <li key={roll.id} className="vj-log__row">
              <span className="vj-log__who">{roll.byLabel}</span>
              <span className="vj-log__notation tabular-nums">{roll.notation}</span>
              <span className="vj-log__breakdown tabular-nums">{roll.breakdown}</span>
              <StatNumber
                value={roll.total}
                label={`Resultado de ${roll.byLabel}`}
                role={
                  roll.tone === 'crit'
                    ? 'active'
                    : roll.tone === 'fumble'
                      ? 'damage'
                      : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}
