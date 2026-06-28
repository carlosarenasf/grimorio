import { useState } from 'react';
import { Panel } from '../../design';
import type { CharacterTrait, TraitSource } from './types';

export interface TraitsPanelProps {
  traits: CharacterTrait[];
}

const SOURCE_LABELS: Record<TraitSource, string> = {
  species: 'Raza',
  class: 'Clase',
  background: 'Trasfondo',
  other: 'Otro',
};

const SOURCE_ICONS: Record<TraitSource, string> = {
  species: '🧬',
  class: '⚔️',
  background: '📜',
  other: '✨',
};

/**
 * Rasgos y Habilidades: displays racial, class, and background traits with
 * visual badges indicating their source.
 */
export function TraitsPanel({ traits }: TraitsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (traits.length === 0) {
    return null;
  }

  const displayed = expanded ? traits : traits.slice(0, 3);
  const hasMore = traits.length > 3;

  return (
    <Panel eyebrow="Rasgos" title="Rasgos y Habilidades">
      <div className="vj-traits">
        <ul className="vj-traits__list" aria-label="Rasgos y habilidades">
          {displayed.map((trait) => (
            <li key={trait.id} className="vj-traits__item">
              <div className="vj-traits__header">
                <span className="vj-traits__icon" aria-hidden="true">
                  {SOURCE_ICONS[trait.source]}
                </span>
                <span className="vj-traits__name">{trait.name}</span>
                <span className="vj-traits__badge">{SOURCE_LABELS[trait.source]}</span>
              </div>
              <p className="vj-traits__desc">{trait.description}</p>
            </li>
          ))}
        </ul>
        {hasMore ? (
          <button
            type="button"
            className="vj-traits__toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? 'Ver menos' : `Ver ${traits.length - 3} rasgos más`}
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
