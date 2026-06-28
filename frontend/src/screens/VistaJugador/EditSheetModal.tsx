import { useState } from 'react';
import { Button, Field } from '../../design';
import { ABILITY_LABELS, ABILITY_ORDER } from './derived';
import type { AbilityKey, AttackDef, InventoryItem, YouCharacter } from './types';

export interface EditSheetModalProps {
  you: YouCharacter;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

function uid(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function EditSheetModal({ you, onSave, onClose }: EditSheetModalProps) {
  const [name, setName] = useState(you.name);
  const [species, setSpecies] = useState(you.species);
  const [className, setClassName] = useState(you.className);
  const [background, setBackground] = useState(you.background);
  const [scores, setScores] = useState({ ...you.scores });
  const [currentHp, setCurrentHp] = useState(you.currentHp);
  const [notes, setNotes] = useState(you.notes);
  const [attacks, setAttacks] = useState<AttackDef[]>([...you.attacks]);
  const [inventory, setInventory] = useState<InventoryItem[]>([...you.inventory]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateScore(key: AbilityKey, value: string) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 30) {
      setScores((prev) => ({ ...prev, [key]: n }));
    }
  }

  function addAttack() {
    setAttacks((prev) => [
      ...prev,
      { id: uid(), name: '', kind: 'weapon', bonus: null, damage: null },
    ]);
  }

  function updateAttack(id: string, field: string, value: string | number | null) {
    setAttacks((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  }

  function removeAttack(id: string) {
    setAttacks((prev) => prev.filter((a) => a.id !== id));
  }

  function addInventoryItem() {
    setInventory((prev) => [
      ...prev,
      { id: uid(), name: '', note: '', qty: 1, equipped: false },
    ]);
  }

  function updateInventoryItem(id: string, field: string, value: string | number | boolean) {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  }

  function removeInventoryItem(id: string) {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        species,
        className,
        background,
        scores,
        currentHp,
        notes,
        attacks: attacks.map((a) => ({
          id: a.id,
          name: a.name,
          kind: a.kind,
          bonus: a.bonus,
          damage: a.damage,
          damageType: '',
        })),
        inventory: inventory.map((i) => ({
          id: i.id,
          name: i.name,
          note: i.note,
          qty: i.qty,
          equipped: i.equipped,
        })),
      });
      onClose();
    } catch {
      setError('No se pudo guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="esm__backdrop" onClick={onClose}>
      <div
        className="esm"
        role="dialog"
        aria-modal="true"
        aria-label="Editar ficha"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="esm__head">
          <div>
            <p className="esm__eyebrow">Editar ficha</p>
            <h2 className="esm__title">{you.name}</h2>
          </div>
          <button
            type="button"
            className="esm__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="esm__body">
          {error ? (
            <p className="esm__error" role="alert">
              {error}
            </p>
          ) : null}

          <section className="esm__section">
            <h3 className="esm__section-title">Identidad</h3>
            <div className="esm__grid">
              <Field label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
              <Field label="Especie" value={species} onChange={(e) => setSpecies(e.target.value)} />
              <Field label="Clase" value={className} onChange={(e) => setClassName(e.target.value)} />
              <Field label="Trasfondo" value={background} onChange={(e) => setBackground(e.target.value)} />
            </div>
          </section>

          <section className="esm__section">
            <h3 className="esm__section-title">Características</h3>
            <div className="esm__scores">
              {ABILITY_ORDER.map((key) => (
                <Field
                  key={key}
                  label={ABILITY_LABELS[key]}
                  type="number"
                  min={1}
                  max={30}
                  value={scores[key]}
                  onChange={(e) => updateScore(key, e.target.value)}
                />
              ))}
            </div>
          </section>

          <section className="esm__section">
            <h3 className="esm__section-title">Puntos de vida</h3>
            <Field
              label="PV actuales"
              type="number"
              min={0}
              max={you.maxHp}
              value={currentHp}
              onChange={(e) => setCurrentHp(Math.max(0, Number(e.target.value) || 0))}
              hint={`Máximo: ${you.maxHp} PV`}
            />
          </section>

          <section className="esm__section">
            <h3 className="esm__section-title">Ataques</h3>
            <ul className="esm__attacks">
              {attacks.map((atk) => (
                <li key={atk.id} className="esm__attack-row">
                  <div className="esm__attack-fields">
                    <Field
                      label="Nombre"
                      value={atk.name}
                      onChange={(e) => updateAttack(atk.id, 'name', e.target.value)}
                    />
                    <div className="esm__attack-sub">
                      <Field
                        as="select"
                        label="Tipo"
                        value={atk.kind}
                        onChange={(e) =>
                          updateAttack(atk.id, 'kind', e.target.value)
                        }
                      >
                        <option value="weapon">Arma</option>
                        <option value="spell">Conjuro</option>
                        <option value="save">Salvación</option>
                      </Field>
                      <Field
                        label="Bonus"
                        type="number"
                        value={atk.bonus ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateAttack(atk.id, 'bonus', v === '' ? null : Number(v));
                        }}
                      />
                      <Field
                        label="Daño"
                        value={atk.damage ?? ''}
                        onChange={(e) =>
                          updateAttack(atk.id, 'damage', e.target.value || null)
                        }
                        placeholder="1d8+3"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="esm__remove-btn"
                    aria-label={`Quitar ${atk.name || 'ataque'}`}
                    onClick={() => removeAttack(atk.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" onClick={addAttack}>
              + Añadir ataque
            </Button>
          </section>

          <section className="esm__section">
            <h3 className="esm__section-title">Inventario</h3>
            <ul className="esm__inventory">
              {inventory.map((item) => (
                <li key={item.id} className="esm__inv-row">
                  <div className="esm__inv-fields">
                    <Field
                      label="Nombre"
                      value={item.name}
                      onChange={(e) =>
                        updateInventoryItem(item.id, 'name', e.target.value)
                      }
                    />
                    <div className="esm__inv-sub">
                      <Field
                        label="Nota"
                        value={item.note}
                        onChange={(e) =>
                          updateInventoryItem(item.id, 'note', e.target.value)
                        }
                      />
                      <Field
                        label="Cant."
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) =>
                          updateInventoryItem(
                            item.id,
                            'qty',
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                      />
                      <label className="esm__equip">
                        <input
                          type="checkbox"
                          checked={item.equipped}
                          onChange={(e) =>
                            updateInventoryItem(item.id, 'equipped', e.target.checked)
                          }
                        />
                        <span className="esm__equip-label">Equipado</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="esm__remove-btn"
                    aria-label={`Quitar ${item.name || 'objeto'}`}
                    onClick={() => removeInventoryItem(item.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" onClick={addInventoryItem}>
              + Añadir objeto
            </Button>
          </section>

          <section className="esm__section">
            <h3 className="esm__section-title">Notas</h3>
            <Field
              as="textarea"
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </section>
        </div>

        <footer className="esm__footer">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
