import { useEffect, useState } from 'react';
import { Button, Field } from '../../design';
import type { SpellDTO } from '../../net/http';

export interface AddSpellModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (spell: SpellDTO) => void;
  /** Fetch spells from the SRD, optionally filtered by class. */
  fetchSpells: (classId?: string) => Promise<SpellDTO[]>;
  /** Character's class name for filtering (e.g. "Mago", "Clérigo"). */
  className?: string;
  /** Spell IDs already known — shown as disabled. */
  existingSpellIds?: string[];
}

/**
 * Modal para buscar y añadir conjuros del SRD. Filtra por clase del personaje
 * y permite seleccionar un conjuro para añadirlo a la ficha.
 */
export function AddSpellModal({
  open,
  onClose,
  onAdd,
  fetchSpells,
  className,
  existingSpellIds = [],
}: AddSpellModalProps) {
  const [spells, setSpells] = useState<SpellDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchSpells(className)
      .then((list) => {
        setSpells(list);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los conjuros.');
        setLoading(false);
      });
  }, [open, fetchSpells, className]);

  if (!open) return null;

  const filtered = spells.filter((s) => {
    const matchesSearch =
      !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevel === null || s.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  function handleSelect(spell: SpellDTO) {
    onAdd(spell);
    onClose();
  }

  return (
    <div className="dice-modal__backdrop" onClick={onClose}>
      <div
        className="dice-modal vj-add-spell-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Añadir conjuro"
      >
        <div className="dice-modal__head">
          <h2 className="dice-modal__title">Añadir conjuro</h2>
          <button
            type="button"
            className="dice-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="vj-add-spell-modal__filters">
          <Field
            label="Buscar"
            placeholder="Nombre del conjuro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Field
            label="Nivel"
            as="select"
            value={selectedLevel === null ? '' : String(selectedLevel)}
            onChange={(e) =>
              setSelectedLevel(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">Todos</option>
            <option value="0">Trucos</option>
            <option value="1">Nivel 1</option>
            <option value="2">Nivel 2</option>
            <option value="3">Nivel 3</option>
            <option value="4">Nivel 4</option>
            <option value="5">Nivel 5</option>
            <option value="6">Nivel 6</option>
            <option value="7">Nivel 7</option>
            <option value="8">Nivel 8</option>
            <option value="9">Nivel 9</option>
          </Field>
        </div>

        <div className="vj-add-spell-modal__list">
          {loading ? (
            <p className="vj-empty">Cargando conjuros…</p>
          ) : error ? (
            <p className="vj-empty">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="vj-empty">No se encontraron conjuros.</p>
          ) : (
            <ul className="vj-add-spell-modal__results">
              {filtered.map((spell) => {
                const isKnown = existingSpellIds.includes(spell.id);
                return (
                  <li key={spell.id} className="vj-add-spell-modal__row">
                    <div className="vj-add-spell-modal__info">
                      <span className="vj-add-spell-modal__name">{spell.name}</span>
                      <span className="vj-add-spell-modal__meta">
                        {spell.level === 0 ? 'Truco' : `Nivel ${spell.level}`} · {spell.school}
                        {spell.damage ? ` · ${spell.damage}` : ''}
                      </span>
                      <span className="vj-add-spell-modal__desc">{spell.description}</span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isKnown}
                      onClick={() => handleSelect(spell)}
                    >
                      {isKnown ? 'Conocido' : 'Añadir'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
