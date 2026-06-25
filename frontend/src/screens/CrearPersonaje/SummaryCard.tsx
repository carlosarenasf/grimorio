import { Panel, StatNumber } from '../../design';
import { ABILITIES } from './abilities';
import type { AbilityScores } from './abilities';
import { allModifiers, abilityMod, proficiencyBonus } from './derived';
import { skillLabel } from './labels';

export interface SummaryCardProps {
  name: string;
  species: string;
  className: string;
  level: number;
  scores: AbilityScores;
  maxHp: number;
  armorClass: number;
  speed: number;
  /** Canonical skill keys the character is proficient in. */
  proficientSkills: string[];
  /** Spell names to show (cantrips + level-1). */
  spellNames: string[];
}

/**
 * Live summary card: identity, PV/CA/Init, the six ability modifiers, chosen
 * skills and chosen spells. All previewed client-side; the server returns the
 * canonical sheet on save.
 */
export function SummaryCard({
  name,
  species,
  className,
  level,
  scores,
  maxHp,
  armorClass,
  speed,
  proficientSkills,
  spellNames,
}: SummaryCardProps) {
  const mods = allModifiers(scores);
  const prof = proficiencyBonus(level);
  const initiative = abilityMod(scores.dex);

  return (
    <Panel eyebrow="Resumen" title={name.trim() || 'Personaje sin nombre'}>
      <p className="cp-summary__subtitle">
        {[species, className].filter(Boolean).join(' · ') || 'Sin especie ni clase'}
        {' · '}
        <span className="tabular-nums">Nivel {level}</span>
      </p>

      <dl className="cp-summary__combat">
        <div>
          <dt className="eyebrow">PV</dt>
          <dd>
            <StatNumber value={maxHp} label="Puntos de vida" />
          </dd>
        </div>
        <div>
          <dt className="eyebrow">CA</dt>
          <dd>
            <StatNumber value={armorClass} label="Clase de armadura" />
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Iniciativa</dt>
          <dd>
            <StatNumber value={initiative} label="Iniciativa" signed />
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Velocidad</dt>
          <dd>
            <StatNumber value={speed} label="Velocidad" />
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Competencia</dt>
          <dd>
            <StatNumber value={prof} label="Bono de competencia" signed />
          </dd>
        </div>
      </dl>

      <ul className="cp-summary__abilities">
        {ABILITIES.map((a) => (
          <li key={a.key} className="cp-summary__ability">
            <span className="eyebrow">{a.abbr}</span>
            <StatNumber
              value={mods[a.key]}
              label={`Modificador de ${a.label}`}
              signed
            />
          </li>
        ))}
      </ul>

      <div className="cp-summary__skills">
        <p className="eyebrow">Competencias</p>
        {proficientSkills.length === 0 ? (
          <p className="cp-summary__empty">Ninguna todavía.</p>
        ) : (
          <ul>
            {proficientSkills.map((key) => (
              <li key={key}>{skillLabel(key)}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="cp-summary__spells">
        <p className="eyebrow">Conjuros</p>
        {spellNames.length === 0 ? (
          <p className="cp-summary__empty">Ninguno.</p>
        ) : (
          <ul>
            {spellNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
