import type { ClassDTO } from '../../net/http';
import { SelectableCard } from './SelectableCard';
import { abilityLabel } from './labels';

export interface StepClaseProps {
  classes: ClassDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Step 1 — pick a class. The choice drives later steps (skills, spells). */
export function StepClase({ classes, selectedId, onSelect }: StepClaseProps) {
  return (
    <div className="cp-cards" role="list">
      {classes.map((c) => (
        <div role="listitem" key={c.id}>
          <SelectableCard
            title={c.name}
            description={c.description}
            selected={c.id === selectedId}
            onSelect={() => onSelect(c.id)}
          >
            <span className="cp-card__detail">Dado de golpe d{c.hitDie}</span>
            <span className="cp-card__detail">
              Característica principal: {abilityLabel(c.primaryAbility)}
            </span>
            <span className="cp-card__detail">
              Salvaciones: {c.savingThrows.map(abilityLabel).join(', ')}
            </span>
          </SelectableCard>
        </div>
      ))}
    </div>
  );
}
