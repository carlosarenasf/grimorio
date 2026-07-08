import { StatNumber } from '../../design';
import type { Monster } from './types';

export interface MonsterSheetModalProps {
  monster: Monster;
  onClose: () => void;
}

const ABILITY_LABEL: Record<string, string> = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

const mod = (score: number): string => {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};

/**
 * MonsterSheetModal displays the full stat block of a monster from the SRD.
 * Shows all abilities, traits, actions, resistances, and other details.
 */
export function MonsterSheetModal({ monster, onClose }: MonsterSheetModalProps) {
  return (
    <div className="csm__backdrop" onClick={onClose}>
      <div
        className="csm msm"
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${monster.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="csm__head msm__head">
          <div className="msm__head-info">
            {monster.imageUrl ? (
              <img
                src={monster.imageUrl}
                alt={`Retrato de ${monster.name}`}
                className="msm__portrait"
              />
            ) : null}
            <div>
              <p className="eyebrow">Ficha de monstruo</p>
              <h2 className="font-display csm__title">{monster.name}</h2>
              <p className="csm__sub">
                {monster.meta} · VD {monster.cr}
              </p>
            </div>
          </div>
          <div className="msm__head-actions">
            {monster.externalUrl ? (
              <a
                href={monster.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="msm__external-link"
                aria-label={`Ver ${monster.name} en 5e.tools`}
              >
                Ver en 5e.tools ↗
              </a>
            ) : null}
            <button
              type="button"
              className="csm__close"
              aria-label="Cerrar"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </header>

        <div className="csm__body msm__body">
          {/* Core stats */}
          <div className="csm__combat msm__core">
            <div>
              <span className="eyebrow">CA</span>
              <StatNumber value={monster.ac} label="Clase de Armadura" />
            </div>
            <div>
              <span className="eyebrow">PV</span>
              <StatNumber value={monster.hp} label="Puntos de Vida" />
            </div>
            <div>
              <span className="eyebrow">Vel</span>
              <span className="msm__speed">{monster.speed}</span>
            </div>
          </div>

          {/* Ability scores */}
          {monster.abilities ? (
            <ul className="csm__abilities msm__abilities">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
                const score = monster.abilities![key];
                return (
                  <li key={key}>
                    <span className="eyebrow">{ABILITY_LABEL[key]}</span>
                    <strong className="tabular-nums">{score}</strong>
                    <span className="csm__mod tabular-nums">{mod(score)}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {/* Saving throws */}
          {monster.savingThrows && monster.savingThrows.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Salvaciones</p>
              <p className="csm__list">{monster.savingThrows.join(', ')}</p>
            </section>
          ) : null}

          {/* Skills */}
          {monster.skills && monster.skills.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Habilidades</p>
              <p className="csm__list">{monster.skills.join(', ')}</p>
            </section>
          ) : null}

          {/* Damage resistances */}
          {monster.damageResistances && monster.damageResistances.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Resistencias</p>
              <p className="csm__list">{monster.damageResistances.join(', ')}</p>
            </section>
          ) : null}

          {/* Damage immunities */}
          {monster.damageImmunities && monster.damageImmunities.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Inmunidades</p>
              <p className="csm__list">{monster.damageImmunities.join(', ')}</p>
            </section>
          ) : null}

          {/* Condition immunities */}
          {monster.conditionImmunities && monster.conditionImmunities.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Inmunidades a condiciones</p>
              <p className="csm__list">{monster.conditionImmunities.join(', ')}</p>
            </section>
          ) : null}

          {/* Senses */}
          {monster.senses && monster.senses.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Sentidos</p>
              <p className="csm__list">{monster.senses.join(', ')}</p>
            </section>
          ) : null}

          {/* Languages */}
          {monster.languages && monster.languages.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Idiomas</p>
              <p className="csm__list">{monster.languages.join(', ')}</p>
            </section>
          ) : null}

          {/* Traits */}
          {monster.traits && monster.traits.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Rasgos</p>
              <ul className="csm__items msm__traits">
                {monster.traits.map((trait, i) => (
                  <li key={i} className="msm__trait">
                    <strong>{trait.name}</strong>
                    <p className="msm__trait-desc">{trait.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Actions */}
          {monster.actions && monster.actions.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Acciones</p>
              <ul className="csm__items msm__actions">
                {monster.actions.map((action, i) => (
                  <li key={i} className="msm__action">
                    <div className="msm__action-header">
                      <strong>{action.name}</strong>
                      {action.attack ? (
                        <span className="msm__action-stats tabular-nums">
                          +{action.attack.bonus} · {action.attack.damage} {action.attack.damageType}
                        </span>
                      ) : null}
                    </div>
                    <p className="msm__action-desc">{action.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Reactions */}
          {monster.reactions && monster.reactions.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Reacciones</p>
              <ul className="csm__items msm__actions">
                {monster.reactions.map((reaction, i) => (
                  <li key={i} className="msm__action">
                    <div className="msm__action-header">
                      <strong>{reaction.name}</strong>
                    </div>
                    <p className="msm__action-desc">{reaction.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Legendary Actions */}
          {monster.legendaryActions && monster.legendaryActions.length > 0 ? (
            <section className="csm__section">
              <p className="eyebrow">Acciones legendarias</p>
              <ul className="csm__items msm__actions">
                {monster.legendaryActions.map((action, i) => (
                  <li key={i} className="msm__action">
                    <div className="msm__action-header">
                      <strong>{action.name}</strong>
                    </div>
                    <p className="msm__action-desc">{action.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
