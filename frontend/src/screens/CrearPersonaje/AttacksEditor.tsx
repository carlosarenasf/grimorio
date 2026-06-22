import { useId } from 'react';
import { Button } from '../../design';

export type AttackKind = 'weapon' | 'spell' | 'save';

export interface AttackRow {
  id: string;
  name: string;
  kind: AttackKind;
  /** Attack bonus; null for save-based attacks (no to-hit). */
  bonus: number | null;
  /** Damage notation, e.g. "1d8+4"; null when not applicable. */
  damage: string | null;
}

export const ATTACK_KIND_LABELS: Record<AttackKind, string> = {
  weapon: 'Arma',
  spell: 'Conjuro',
  save: 'Salvación',
};

export function makeAttack(): AttackRow {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `atk-${Math.random().toString(36).slice(2)}`,
    name: '',
    kind: 'weapon',
    bonus: 0,
    damage: '',
  };
}

export interface AttacksEditorProps {
  attacks: AttackRow[];
  onChange: (next: AttackRow[]) => void;
}

/**
 * Paso 5 — Ataques y conjuros. Rows of (name, kind, bonus, damage) that can be
 * added and removed. Save-kind attacks have no to-hit bonus.
 */
export function AttacksEditor({ attacks, onChange }: AttacksEditorProps) {
  const baseId = useId();

  function update(id: string, patch: Partial<AttackRow>) {
    onChange(attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function remove(id: string) {
    onChange(attacks.filter((a) => a.id !== id));
  }

  function add() {
    onChange([...attacks, makeAttack()]);
  }

  return (
    <div className="cp-attacks">
      {attacks.length === 0 ? (
        <p className="cp-attacks__empty">
          Aún no has añadido ataques. Añade un arma o conjuro para empezar.
        </p>
      ) : (
        <ul className="cp-attacks__list">
          {attacks.map((atk, index) => {
            const nameId = `${baseId}-name-${atk.id}`;
            const kindId = `${baseId}-kind-${atk.id}`;
            const bonusId = `${baseId}-bonus-${atk.id}`;
            const dmgId = `${baseId}-dmg-${atk.id}`;
            const isSave = atk.kind === 'save';
            return (
              <li key={atk.id} className="cp-attacks__row" data-testid="attack-row">
                <div className="field cp-attacks__cell">
                  <label htmlFor={nameId} className="eyebrow field__label">
                    Nombre
                  </label>
                  <input
                    id={nameId}
                    className="field__control"
                    value={atk.name}
                    placeholder={`Ataque ${index + 1}`}
                    onChange={(e) => update(atk.id, { name: e.target.value })}
                  />
                </div>

                <div className="field cp-attacks__cell">
                  <label htmlFor={kindId} className="eyebrow field__label">
                    Tipo
                  </label>
                  <select
                    id={kindId}
                    className="field__control"
                    value={atk.kind}
                    onChange={(e) => {
                      const kind = e.target.value as AttackKind;
                      update(atk.id, {
                        kind,
                        bonus: kind === 'save' ? null : (atk.bonus ?? 0),
                      });
                    }}
                  >
                    <option value="weapon">{ATTACK_KIND_LABELS.weapon}</option>
                    <option value="spell">{ATTACK_KIND_LABELS.spell}</option>
                    <option value="save">{ATTACK_KIND_LABELS.save}</option>
                  </select>
                </div>

                <div className="field cp-attacks__cell">
                  <label htmlFor={bonusId} className="eyebrow field__label">
                    Bono
                  </label>
                  <input
                    id={bonusId}
                    type="number"
                    className="field__control tabular-nums"
                    value={isSave ? '' : (atk.bonus ?? 0)}
                    disabled={isSave}
                    onChange={(e) =>
                      update(atk.id, {
                        bonus: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="field cp-attacks__cell">
                  <label htmlFor={dmgId} className="eyebrow field__label">
                    Daño
                  </label>
                  <input
                    id={dmgId}
                    className="field__control"
                    value={atk.damage ?? ''}
                    placeholder="1d8+4"
                    onChange={(e) =>
                      update(atk.id, { damage: e.target.value })
                    }
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Quitar ataque ${atk.name || index + 1}`}
                  onClick={() => remove(atk.id)}
                >
                  Quitar
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" size="sm" onClick={add}>
        Añadir ataque
      </Button>
    </div>
  );
}
