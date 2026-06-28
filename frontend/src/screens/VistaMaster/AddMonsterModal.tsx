import { useEffect, useState } from 'react';
import { Button, Field } from '../../design';
import type { Monster, MonsterSummary, Send } from './types';

export interface AddMonsterModalProps {
  monster: MonsterSummary;
  send: Send;
  onClose: () => void;
  getMonster?: (id: string) => Promise<Monster | null>;
}

interface AttackDraft {
  name: string;
  bonus: string;
  damage: string;
  damageType: string;
}

/**
 * Modal to edit monster stats before adding to combat. Pre-fills with SRD data
 * but allows the DM to customize name, AC, HP, speed, initiative, and attacks.
 */
export function AddMonsterModal({ monster, send, onClose, getMonster }: AddMonsterModalProps) {
  const [name, setName] = useState(monster.name);
  const [ac, setAc] = useState(monster.hp !== undefined ? 10 : 10);
  const [hp, setHp] = useState(monster.hp ?? 10);
  const [speed, setSpeed] = useState('9 m');
  const [initiative, setInitiative] = useState(10);
  const [attacks, setAttacks] = useState<AttackDraft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getMonster) return;
    setLoading(true);
    getMonster(monster.id).then((full) => {
      if (full) {
        setName(full.name);
        setAc(full.ac);
        setHp(full.hp);
        setSpeed(full.speed);
        if (full.attacks && full.attacks.length > 0) {
          setAttacks(
            full.attacks.map((a) => ({
              name: a.name,
              bonus: a.bonus !== null ? String(a.bonus) : '',
              damage: a.damage ?? '',
              damageType: a.damageType ?? '',
            })),
          );
        }
      }
      setLoading(false);
    });
  }, [getMonster, monster.id]);

  function handleAdd() {
    const parsedAttacks = attacks
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name.trim(),
        bonus: a.bonus !== '' ? Number(a.bonus) : null,
        damage: a.damage || null,
        damageType: a.damageType || '',
      }));

    send({
      type: 'AddManualCombatant',
      name,
      maxHp: Math.max(0, hp),
      initiative,
      combatantType: 'monster',
      hpVisibility: 'dm_only',
      refId: monster.id,
      ac,
      speed,
      attacks: parsedAttacks.length > 0 ? parsedAttacks : undefined,
    });
    onClose();
  }

  function updateAttack(index: number, field: keyof AttackDraft, value: string) {
    setAttacks((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function addAttack() {
    setAttacks((prev) => [...prev, { name: '', bonus: '', damage: '', damageType: '' }]);
  }

  function removeAttack(index: number) {
    setAttacks((prev) => prev.filter((_, i) => i !== index));
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
          {loading ? (
            <p className="amm__hint">Cargando datos del monstruo…</p>
          ) : (
            <>
              <Field
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="amm__stats">
                <Field
                  label="Clase de Armadura"
                  type="number"
                  min={0}
                  value={ac}
                  onChange={(e) => setAc(Math.max(0, Number(e.target.value) || 0))}
                />
                <Field
                  label="Puntos de vida"
                  type="number"
                  min={0}
                  value={hp}
                  onChange={(e) => setHp(Math.max(0, Number(e.target.value) || 0))}
                />
                <Field
                  label="Velocidad"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                />
                <Field
                  label="Iniciativa"
                  type="number"
                  value={initiative}
                  onChange={(e) => setInitiative(Number(e.target.value) || 0)}
                />
              </div>

              <div className="amm__attacks">
                <div className="amm__attacks-header">
                  <span className="eyebrow">Ataques</span>
                  <button
                    type="button"
                    className="amm__attacks-add"
                    onClick={addAttack}
                    aria-label="Añadir ataque"
                  >
                    + Añadir
                  </button>
                </div>
                {attacks.length === 0 ? (
                  <p className="amm__hint">Sin ataques</p>
                ) : (
                  <ul className="amm__attacks-list">
                    {attacks.map((attack, i) => (
                      <li key={i} className="amm__attack-row">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={attack.name}
                          onChange={(e) => updateAttack(i, 'name', e.target.value)}
                          className="amm__attack-input amm__attack-input--name"
                        />
                        <input
                          type="number"
                          placeholder="Bonus"
                          value={attack.bonus}
                          onChange={(e) => updateAttack(i, 'bonus', e.target.value)}
                          className="amm__attack-input amm__attack-input--bonus"
                        />
                        <input
                          type="text"
                          placeholder="Daño"
                          value={attack.damage}
                          onChange={(e) => updateAttack(i, 'damage', e.target.value)}
                          className="amm__attack-input amm__attack-input--damage"
                        />
                        <input
                          type="text"
                          placeholder="Tipo"
                          value={attack.damageType}
                          onChange={(e) => updateAttack(i, 'damageType', e.target.value)}
                          className="amm__attack-input amm__attack-input--type"
                        />
                        <button
                          type="button"
                          className="amm__attack-remove"
                          onClick={() => removeAttack(i)}
                          aria-label={`Quitar ataque ${attack.name || i + 1}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {monster.cr ? (
                <p className="amm__hint">
                  VD: {monster.cr} · PV original: {monster.hp ?? '—'}
                </p>
              ) : null}
            </>
          )}
        </div>

        <footer className="amm__footer">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={loading}>
            Añadir al combate
          </Button>
        </footer>
      </div>
    </div>
  );
}
