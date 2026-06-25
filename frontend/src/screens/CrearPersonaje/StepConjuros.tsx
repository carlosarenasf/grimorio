import type { SpellDTO } from '../../net/http';
import { MAX_CANTRIPS, MAX_LEVEL1_SPELLS } from './wizard';

export interface StepConjurosProps {
  spells: SpellDTO[];
  loading: boolean;
  cantrips: string[];
  level1Spells: string[];
  onToggleCantrip: (id: string) => void;
  onToggleLevel1: (id: string) => void;
}

function SpellList({
  title,
  spells,
  selected,
  max,
  onToggle,
  testidPrefix,
}: {
  title: string;
  spells: SpellDTO[];
  selected: string[];
  max: number;
  onToggle: (id: string) => void;
  testidPrefix: string;
}) {
  const atCap = selected.length >= max;
  return (
    <section>
      <p className="eyebrow" aria-live="polite">
        {title} — elige hasta {max} ({selected.length}/{max})
      </p>
      {spells.length === 0 ? (
        <p className="cp-hint">No hay opciones disponibles.</p>
      ) : (
        <ul className="cp-spells">
          {spells.map((s) => {
            const on = selected.includes(s.id);
            const disabled = !on && atCap;
            return (
              <li key={s.id} className="cp-spell" data-testid={`${testidPrefix}-${s.id}`}>
                <label className="cp-spell__label">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => onToggle(s.id)}
                    aria-label={`Elegir ${s.name}`}
                  />
                  <span className="cp-spell__name">{s.name}</span>
                </label>
                <span className="cp-spell__school eyebrow">{s.school}</span>
                <span className="cp-spell__desc">{s.description}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Step 6 (casters only) — pick cantrips and level-1 spells from the class list.
 * Caps are enforced via disabled checkboxes once the limit is reached.
 */
export function StepConjuros({
  spells,
  loading,
  cantrips,
  level1Spells,
  onToggleCantrip,
  onToggleLevel1,
}: StepConjurosProps) {
  if (loading) {
    return <p className="cp-hint">Cargando conjuros…</p>;
  }

  const cantripOptions = spells.filter((s) => s.level === 0);
  const level1Options = spells.filter((s) => s.level === 1);

  return (
    <div className="cp-conjuros">
      <SpellList
        title="Trucos"
        spells={cantripOptions}
        selected={cantrips}
        max={MAX_CANTRIPS}
        onToggle={onToggleCantrip}
        testidPrefix="cantrip"
      />
      <SpellList
        title="Nivel 1"
        spells={level1Options}
        selected={level1Spells}
        max={MAX_LEVEL1_SPELLS}
        onToggle={onToggleLevel1}
        testidPrefix="spell1"
      />
    </div>
  );
}
