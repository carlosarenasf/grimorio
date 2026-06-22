import { useId, useState } from 'react';
import { Button, Panel } from '../../design';

export interface RulesPanelProps {
  /** Seed list, overridable in tests; defaults to a small SRD-flavoured starter set. */
  initialRules?: string[];
}

const DEFAULT_RULES = [
  'Ventaja/desventaja: tira 2d20, quédate con el más alto (ventaja) o el más bajo (desventaja).',
  'Una acción, una acción adicional y movimiento por turno (más reacciones fuera de turno).',
  'Inspiración: gástala para repetir una tirada antes de saber el resultado.',
  'Muerte a 0 PV: tiradas de salvación de muerte cuando no estás estabilizado.',
];

/**
 * Normas básicas (DESIGN_SPEC.md §5): editable reference list, local state.
 * Read mode is a plain list; edit mode adds remove buttons per rule plus an
 * "Añadir" form. Persisting the list is out of scope.
 */
export function RulesPanel({ initialRules = DEFAULT_RULES }: RulesPanelProps) {
  const [rules, setRules] = useState<string[]>(initialRules);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputId = useId();

  function addRule() {
    const value = draft.trim();
    if (!value) return;
    setRules((prev) => [...prev, value]);
    setDraft('');
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Panel
      eyebrow="Referencia"
      title="Normas básicas"
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Listo' : 'Editar'}
        </Button>
      }
    >
      <div className="vj-rules">
        <ul className="vj-rules__list">
          {rules.map((rule, index) => (
            <li key={`${index}-${rule}`} className="vj-rules__item">
              <span>{rule}</span>
              {editing ? (
                <button
                  type="button"
                  className="vj-rules__remove"
                  aria-label="Quitar norma"
                  onClick={() => removeRule(index)}
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        {editing ? (
          <div className="vj-rules__add">
            <label className="eyebrow" htmlFor={inputId}>
              Nueva norma
            </label>
            <div className="vj-rules__add-row">
              <input
                id={inputId}
                className="field__control vj-rules__add-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRule();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addRule}>
                Añadir
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
