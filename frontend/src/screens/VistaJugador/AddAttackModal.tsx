import { useState } from 'react';
import { Button, Field } from '../../design';

export interface NewAttackData {
  name: string;
  kind: 'weapon' | 'spell' | 'save';
  bonus: number | null;
  damage: string | null;
  damageType: string;
}

export interface AddAttackModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (attack: NewAttackData) => void;
}

const DAMAGE_TYPES = [
  'fuego',
  'frío',
  'eléctrico',
  'ácido',
  'veneno',
  'radiante',
  'necrótico',
  'fuerza',
  'psíquico',
  'trueno',
  'perforante',
  'cortante',
  'contundente',
] as const;

/**
 * Modal para crear un ataque personalizado con nombre, bonus, daño y tipo.
 */
export function AddAttackModal({ open, onClose, onAdd }: AddAttackModalProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'weapon' | 'spell' | 'save'>('weapon');
  const [bonus, setBonus] = useState('');
  const [damage, setDamage] = useState('');
  const [damageType, setDamageType] = useState<string>('fuego');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    onAdd({
      name: trimmed,
      kind,
      bonus: bonus === '' ? null : Number(bonus),
      damage: damage.trim() || null,
      damageType,
    });

    setName('');
    setKind('weapon');
    setBonus('');
    setDamage('');
    setDamageType('fuego');
    onClose();
  }

  return (
    <div className="dice-modal__backdrop" onClick={onClose}>
      <form
        className="dice-modal vj-add-attack-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Añadir ataque"
      >
        <div className="dice-modal__head">
          <h2 className="dice-modal__title">Añadir ataque</h2>
          <button
            type="button"
            className="dice-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="vj-add-attack-modal__form">
          <Field
            label="Nombre"
            placeholder="Ej: Hacha a dos manos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Field
            label="Tipo"
            as="select"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'weapon' | 'spell' | 'save')}
          >
            <option value="weapon">Arma</option>
            <option value="spell">Conjuro</option>
            <option value="save">Salvación</option>
          </Field>

          <Field
            label="Bonus de ataque"
            placeholder="Ej: 5"
            type="number"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            hint="Dejar vacío si no tiene tirada de ataque"
          />

          <Field
            label="Daño"
            placeholder="Ej: 1d8+3"
            value={damage}
            onChange={(e) => setDamage(e.target.value)}
            hint="Notación de dado (ej: 2d6, 1d8+3)"
          />

          <Field
            label="Tipo de daño"
            as="select"
            value={damageType}
            onChange={(e) => setDamageType(e.target.value)}
          >
            {DAMAGE_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {dt}
              </option>
            ))}
          </Field>
        </div>

        <div className="dice-modal__actions">
          <Button type="submit" disabled={!name.trim()}>
            Añadir ataque
          </Button>
        </div>
      </form>
    </div>
  );
}
