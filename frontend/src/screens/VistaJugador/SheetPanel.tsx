import { useState } from 'react';
import { Button, Panel, StatNumber } from '../../design';
import { ABILITY_LABELS, ABILITY_ORDER, allModifiers } from './derived';
import type { Send, YouCharacter } from './types';

export interface SheetPanelProps {
  you: YouCharacter;
  /** Lets the player heal or damage their OWN character (any time). */
  send?: Send;
}

/**
 * TU FICHA (DESIGN_SPEC.md §5): HP bar, the 6 ability modifiers, and the
 * CA/Vel/Comp/Init quartet. Read-only here — HP changes arrive via the
 * server snapshot, this panel only renders the viewer's own character.
 */
export function SheetPanel({ you, send }: SheetPanelProps) {
  const mods = allModifiers(you.scores);
  const hpRatio = you.maxHp > 0 ? you.currentHp / you.maxHp : 1;
  const hpRole = hpRatio <= 0.25 ? 'damage' : undefined;
  const [amount, setAmount] = useState('1');
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const canAdjust = Boolean(send && you.combatantId);

  return (
    <Panel eyebrow="Tu ficha" title={you.name}>
      <div className="vj-sheet">
        <div className="vj-sheet__hp">
          <StatNumber
            className="vj-sheet__hp-current"
            value={you.currentHp}
            label={`PV actuales de ${you.name}`}
            role={hpRole}
          />
          <span className="vj-sheet__hp-max tabular-nums">/ {you.maxHp} PV</span>
          <div
            className="vj-sheet__hp-bar"
            role="progressbar"
            aria-label="Barra de PV"
            aria-valuemin={0}
            aria-valuemax={you.maxHp}
            aria-valuenow={you.currentHp}
          >
            <div
              className={[
                'vj-sheet__hp-bar-fill',
                hpRole ? 'vj-sheet__hp-bar-fill--damage' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ width: `${Math.max(0, Math.min(1, hpRatio)) * 100}%` }}
            />
          </div>
          {canAdjust ? (
            <div className="vj-sheet__hpctl" role="group" aria-label="Ajustar tus PV">
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Cantidad de PV"
                className="vj-sheet__hpctl-amount"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={amt <= 0}
                onClick={() =>
                  send!({ type: 'ApplyHealing', combatantId: you.combatantId!, amount: amt })
                }
              >
                Curarme
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={amt <= 0}
                onClick={() =>
                  send!({ type: 'ApplyDamage', combatantId: you.combatantId!, amount: amt })
                }
              >
                Daño
              </Button>
            </div>
          ) : null}
        </div>

        <ul className="vj-sheet__mods" aria-label="Modificadores de característica">
          {ABILITY_ORDER.map((key) => (
            <li key={key} className="vj-sheet__mod">
              <span className="eyebrow vj-sheet__mod-label">{ABILITY_LABELS[key]}</span>
              <StatNumber value={mods[key]} label={`Mod ${ABILITY_LABELS[key]}`} signed />
            </li>
          ))}
        </ul>

        <dl className="vj-sheet__stats">
          <div className="vj-sheet__stat">
            <dt className="eyebrow">CA</dt>
            <dd>
              <StatNumber value={you.armorClass} label="CA" />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Velocidad</dt>
            <dd>
              <StatNumber value={you.speed} label="Velocidad" />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Competencia</dt>
            <dd>
              <StatNumber value={you.proficiencyBonus} label="Competencia" signed />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Iniciativa</dt>
            <dd>
              <StatNumber value={you.initiative} label="Iniciativa" signed />
            </dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}
