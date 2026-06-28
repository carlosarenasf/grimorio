import type { SpeciesDTO } from '../../net/http';
import { SelectableCard } from './SelectableCard';

export interface StepEspecieProps {
  species: SpeciesDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Step 2 — pick a species (size, speed, a couple of traits). */
export function StepEspecie({ species, selectedId, onSelect }: StepEspecieProps) {
  return (
    <div className="cp-cards" role="list">
      {species.map((s) => (
        <div role="listitem" key={s.id}>
          <SelectableCard
            title={s.name}
            meta={`${s.size} · ${s.speed} m`}
            description={s.description}
            selected={s.id === selectedId}
            onSelect={() => onSelect(s.id)}
          >
            {s.traits.length > 0 ? (
              <span className="cp-card__detail">
                Rasgos: {s.traits.slice(0, 2).map((t) => t.name).join(', ')}
              </span>
            ) : null}
          </SelectableCard>
        </div>
      ))}
    </div>
  );
}
