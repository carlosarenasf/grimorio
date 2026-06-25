import type { BackgroundDTO } from '../../net/http';
import { Field } from '../../design';
import { SelectableCard } from './SelectableCard';
import { skillLabel, abilityLabel } from './labels';

export interface StepTrasfondoProps {
  backgrounds: BackgroundDTO[];
  selectedId: string | null;
  selectedAbility: string | null;
  onSelect: (id: string) => void;
  onSelectAbility: (ability: string) => void;
}

/**
 * Step 3 — pick a background. In 2024 the background grants the listed skill
 * proficiencies automatically and offers an ability boost the player assigns.
 */
export function StepTrasfondo({
  backgrounds,
  selectedId,
  selectedAbility,
  onSelect,
  onSelectAbility,
}: StepTrasfondoProps) {
  const selected = backgrounds.find((b) => b.id === selectedId);

  return (
    <div className="cp-trasfondo">
      <div className="cp-cards" role="list">
        {backgrounds.map((b) => (
          <div role="listitem" key={b.id}>
            <SelectableCard
              title={b.name}
              description={b.description}
              selected={b.id === selectedId}
              onSelect={() => onSelect(b.id)}
            >
              <span className="cp-card__detail">
                Competencias: {b.skills.map(skillLabel).join(', ')}
              </span>
              <span className="cp-card__detail">
                Mejora una de: {b.abilityOptions.map(abilityLabel).join(', ')}
              </span>
            </SelectableCard>
          </div>
        ))}
      </div>

      {selected ? (
        <Field
          as="select"
          label="Característica a mejorar (+1)"
          value={selectedAbility ?? ''}
          onChange={(e) => onSelectAbility(e.target.value)}
        >
          <option value="" disabled>
            Elige una característica
          </option>
          {selected.abilityOptions.map((a) => (
            <option key={a} value={a}>
              {abilityLabel(a)}
            </option>
          ))}
        </Field>
      ) : null}
    </div>
  );
}
