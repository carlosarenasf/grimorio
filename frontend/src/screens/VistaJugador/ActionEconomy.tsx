import { useState } from 'react';
import { Button, Panel } from '../../design';
import { ACTIONS, getAction } from './actions';
import type { ActionKey } from './actions';
import type { Send, YouCharacter } from './types';

export interface ActionEconomyProps {
  you: YouCharacter;
  send: Send;
  /** Whether it is currently the viewer's turn — gates the whole panel. */
  isYourTurn: boolean;
}

/**
 * "¿Qué haces?" — the action economy (DESIGN_SPEC.md §5). Atacar/Conjuro are
 * "reveal" actions: choosing them lists the character's attacks/spells, each
 * with a "Lanzar" that sends RollAttack. The remaining 6 are simple actions:
 * SRD 5.2 text + "Confirmar", which (per design) ends the turn.
 */
export function ActionEconomy({ you, send, isYourTurn }: ActionEconomyProps) {
  const [chosen, setChosen] = useState<ActionKey | null>(null);
  const action = chosen ? getAction(chosen) : null;

  function choose(key: ActionKey) {
    setChosen(key);
  }

  function confirmSimple() {
    if (!action) return;
    if (action.endsTurn) {
      send({ type: 'EndMyTurn' });
    }
    setChosen(null);
  }

  function launchAttack(attack: YouCharacter['attacks'][number]) {
    send({
      type: 'RollAttack',
      name: attack.name,
      toHitBonus: attack.bonus,
      damage: attack.damage,
      visibility: 'public',
    });
  }

  const attacksToShow =
    action?.reveals === 'attacks'
      ? you.attacks.filter((a) => a.kind === 'weapon' || a.kind === 'save')
      : action?.reveals === 'spells'
        ? you.attacks.filter((a) => a.kind === 'spell')
        : [];

  return (
    <Panel eyebrow="Tu turno" title="¿Qué haces?">
      <div className="vj-actions">
        <div className="vj-actions__grid" role="group" aria-label="Acciones disponibles">
          {ACTIONS.map((a) => (
            <Button
              key={a.key}
              type="button"
              variant={chosen === a.key ? 'primary' : 'secondary'}
              size="sm"
              disabled={!isYourTurn}
              aria-pressed={chosen === a.key}
              onClick={() => choose(a.key)}
            >
              {a.label}
            </Button>
          ))}
        </div>

        {action ? (
          <div className="vj-actions__detail">
            {action.reveals ? (
              attacksToShow.length > 0 ? (
                <ul className="vj-actions__attacks" aria-label={`${action.label} disponibles`}>
                  {attacksToShow.map((attack) => (
                    <li key={attack.id} className="vj-actions__attack">
                      <span className="vj-actions__attack-name">{attack.name}</span>
                      <span className="vj-actions__attack-stats tabular-nums">
                        {attack.bonus !== null ? `+${attack.bonus}` : '—'}
                        {attack.damage ? ` · ${attack.damage}` : ''}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        aria-label={`Lanzar ${attack.name}`}
                        onClick={() => launchAttack(attack)}
                      >
                        Lanzar
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="vj-empty">
                  {action.reveals === 'spells'
                    ? 'No tienes conjuros preparados.'
                    : 'No tienes ataques en tu ficha.'}
                </p>
              )
            ) : (
              <div className="vj-actions__simple">
                <p className="vj-actions__description">{action.description}</p>
                <Button type="button" onClick={confirmSimple}>
                  Confirmar
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
