import { useState } from 'react';
import { Button, Field } from '../../design';
import type { MonsterSummary, Send } from './types';

export interface AddMonsterModalProps {
  monster: MonsterSummary;
  send: Send;
  onClose: () => void;
}

/**
 * Modal to edit monster stats before adding to combat. Pre-fills with SRD data
 * but allows the DM to customize name, HP, and initiative.
 */
export function AddMonsterModal({ monster, send, onClose }: AddMonsterModalProps) {
  const [name, setName] = useState(monster.name);
  const [hp, setHp] = useState(monster.hp ?? 10);
  const [initiative, setInitiative] = useState(10);

  function handleAdd() {
    send({
      type: 'AddManualCombatant',
      name,
      maxHp: Math.max(0, hp),
      initiative,
      combatantType: 'monster',
      hpVisibility: 'dm_only',
      refId: monster.id,
    });
    onClose();
  }

  return (
    <div className="csm__backdrop" onClick={onClose}>
      <div
        className="csm amm"
        role="dialog"
        aria-modal="true"
        aria-label="Añadir monstruo"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="csm__head amm__head">
          <div>
            <p className="eyebrow">Añadir al combate</p>
            <h2 className="font-display csm__title">{monster.name}</h2>
            {monster.kind ? <p className="csm__sub">{monster.kind}</p> : null}
          </div>
          <button
            type="button"
            className="csm__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="csm__body amm__body">
          <Field
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="amm__stats">
            <Field
              label="Puntos de vida"
              type="number"
              min={0}
              value={hp}
              onChange={(e) => setHp(Math.max(0, Number(e.target.value) || 0))}
            />
            <Field
              label="Iniciativa"
              type="number"
              value={initiative}
              onChange={(e) => setInitiative(Number(e.target.value) || 0)}
            />
          </div>

          {monster.cr ? (
            <p className="amm__hint">
              VD: {monster.cr} · PV original: {monster.hp ?? '—'}
            </p>
          ) : null}
        </div>

        <footer className="amm__footer">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Añadir al combate
          </Button>
        </footer>
      </div>
    </div>
  );
}
