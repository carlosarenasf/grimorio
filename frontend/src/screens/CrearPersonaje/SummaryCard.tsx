import { Panel, StatNumber } from '../../design';
import { ABILITIES } from './abilities';
import type { AbilityScores } from './abilities';
import { allModifiers, abilityMod, proficiencyBonus } from './derived';
import type { AttackRow } from './AttacksEditor';
import { ATTACK_KIND_LABELS } from './AttacksEditor';

export interface SummaryCardProps {
  name: string;
  species: string;
  className: string;
  level: number;
  scores: AbilityScores;
  maxHp: number;
  armorClass: number;
  speed: number;
  attacks: AttackRow[];
}

/**
 * Live summary card (DESIGN_SPEC §4.b): reflects identity, PV/CA/Init, the six
 * ability modifiers, proficiency bonus and the attack list. All previewed
 * client-side; the server returns the canonical sheet on save.
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
  attacks,
}: SummaryCardProps) {
  const mods = allModifiers(scores);
  const prof = proficiencyBonus(level);
  // Initiative preview = Dexterity modifier.
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

      <div className="cp-summary__attacks">
        <p className="eyebrow">Ataques</p>
        {attacks.length === 0 ? (
          <p className="cp-summary__empty">Sin ataques todavía.</p>
        ) : (
          <ul>
            {attacks.map((atk) => (
              <li key={atk.id} className="cp-summary__attack">
                <span>{atk.name || 'Sin nombre'}</span>
                <span className="cp-summary__attack-meta tabular-nums">
                  {ATTACK_KIND_LABELS[atk.kind]}
                  {atk.bonus !== null
                    ? ` · ${atk.bonus >= 0 ? '+' : ''}${atk.bonus}`
                    : ''}
                  {atk.damage ? ` · ${atk.damage}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
