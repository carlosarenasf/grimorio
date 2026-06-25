import type { ClassDTO, BackgroundDTO } from '../../net/http';
import { canonicalSkillKey, skillLabel } from './labels';

export interface StepCompetenciasProps {
  selectedClass: ClassDTO | undefined;
  selectedBackground: BackgroundDTO | undefined;
  /** Currently chosen class skills (canonical keys). */
  classSkills: string[];
  onToggleClassSkill: (key: string) => void;
}

/**
 * Step 5 — competencies. The background grants its skills automatically (shown
 * locked). The player picks exactly `class.skillChoices` from
 * `class.skillOptions`; the count is enforced (toggles past the cap are blocked
 * by the disabled state).
 */
export function StepCompetencias({
  selectedClass,
  selectedBackground,
  classSkills,
  onToggleClassSkill,
}: StepCompetenciasProps) {
  const grantedKeys = (selectedBackground?.skills ?? []).map(canonicalSkillKey);
  const choices = selectedClass?.skillChoices ?? 0;
  const options = (selectedClass?.skillOptions ?? []).map(canonicalSkillKey);
  const picked = classSkills.length;
  const atCap = picked >= choices;

  return (
    <div className="cp-competencias">
      <section>
        <p className="eyebrow">Otorgadas por el trasfondo</p>
        {grantedKeys.length === 0 ? (
          <p className="cp-hint">El trasfondo no otorga competencias.</p>
        ) : (
          <ul className="cp-skills">
            {grantedKeys.map((key) => (
              <li key={key} className="cp-skill" data-testid={`granted-skill-${key}`}>
                <span>{skillLabel(key)}</span>
                <span className="cp-skill__granted eyebrow">Otorgada</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="eyebrow" aria-live="polite">
          Competencias de clase — elige {choices} ({picked}/{choices})
        </p>
        <ul className="cp-skills">
          {options.map((key) => {
            const on = classSkills.includes(key);
            const alsoGranted = grantedKeys.includes(key);
            const disabled = alsoGranted || (!on && atCap);
            return (
              <li key={key} className="cp-skill">
                <label className="cp-skill__label">
                  <input
                    type="checkbox"
                    checked={on || alsoGranted}
                    disabled={disabled}
                    onChange={() => onToggleClassSkill(key)}
                    aria-label={`Competente en ${skillLabel(key)}`}
                  />
                  <span>{skillLabel(key)}</span>
                </label>
                {alsoGranted ? (
                  <span className="cp-skill__granted eyebrow">Ya otorgada</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
