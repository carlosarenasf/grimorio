import { Button, Field, StatNumber } from '../../design';
import { ABILITIES } from './abilities';
import type { AbilityKey, AbilityScores } from './abilities';
import {
  POINT_BUY_BUDGET,
  totalCost,
  isOverBudget,
  canStepInBuy,
  rollScores,
} from './pointbuy';
import { abilityMod } from './derived';
import { STANDARD_ARRAY } from './wizard';
import type { GenMethod } from './wizard';
import { abilityLabel } from './labels';

export interface StepCaracteristicasProps {
  method: GenMethod;
  scores: AbilityScores;
  /** Class primary ability key, highlighted as a hint. */
  primaryAbility: string | undefined;
  onChangeMethod: (method: GenMethod) => void;
  onChangeScores: (scores: AbilityScores) => void;
}

function fmtMod(score: number): string {
  const m = abilityMod(score);
  return `${m >= 0 ? '+' : ''}${m}`;
}

/**
 * Step 4 — assign ability scores via one of three methods: 27-point buy,
 * standard array [15..8], or a 4d6 client roll. The class's primary ability is
 * highlighted so the player knows where to place the high score.
 */
export function StepCaracteristicas({
  method,
  scores,
  primaryAbility,
  onChangeMethod,
  onChangeScores,
}: StepCaracteristicasProps) {
  const pointsUsed = totalCost(scores);
  const overBudget = isOverBudget(scores);

  function setScore(key: AbilityKey, value: number) {
    onChangeScores({ ...scores, [key]: value });
  }

  function stepBuy(key: AbilityKey, delta: number) {
    if (!canStepInBuy(scores, key, delta)) return;
    setScore(key, scores[key] + delta);
  }

  // Standard array: a value can be assigned to at most one ability. The select
  // for each ability offers the array values, disabling ones already taken.
  function valueTaken(value: number, exceptKey: AbilityKey): boolean {
    return ABILITIES.some((a) => a.key !== exceptKey && scores[a.key] === value);
  }

  return (
    <div className="cp-caracteristicas">
      <div className="cp-method" role="group" aria-label="Método de generación">
        <Button
          variant={method === 'buy' ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={method === 'buy'}
          onClick={() => onChangeMethod('buy')}
        >
          Compra de puntos (27)
        </Button>
        <Button
          variant={method === 'standard' ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={method === 'standard'}
          onClick={() => onChangeMethod('standard')}
        >
          Reparto estándar
        </Button>
        <Button
          variant={method === 'roll' ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={method === 'roll'}
          onClick={() => onChangeMethod('roll')}
        >
          Tirar 4d6
        </Button>
      </div>

      {method === 'buy' ? (
        <p
          className={`cp-pointbuy ${overBudget ? 'cp-pointbuy--over' : ''}`}
          data-over={overBudget || undefined}
          aria-live="polite"
        >
          Puntos:{' '}
          <span className="tabular-nums">
            {pointsUsed} / {POINT_BUY_BUDGET}
          </span>
          {overBudget ? ' — fuera de presupuesto' : ''}
        </p>
      ) : null}

      {method === 'standard' ? (
        <p className="cp-hint">
          Reparto estándar: asigna {STANDARD_ARRAY.join(', ')} a las
          características.
        </p>
      ) : null}

      {method === 'roll' ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChangeScores(rollScores())}
        >
          Volver a tirar
        </Button>
      ) : null}

      <ul className="cp-abilities">
        {ABILITIES.map((a) => {
          const score = scores[a.key];
          const isPrimary = a.key === primaryAbility;
          return (
            <li
              key={a.key}
              className="cp-ability"
              data-testid={`ability-${a.key}`}
              data-primary={isPrimary || undefined}
            >
              <span className="eyebrow cp-ability__name">
                {a.label}
                {isPrimary ? ' · principal' : ''}
              </span>

              {method === 'standard' ? (
                <Field
                  as="select"
                  label={`Puntuación de ${a.label}`}
                  value={String(score)}
                  onChange={(e) => setScore(a.key, Number(e.target.value))}
                >
                  {STANDARD_ARRAY.map((v) => (
                    <option key={v} value={v} disabled={valueTaken(v, a.key)}>
                      {v} ({v >= 10 ? '+' : ''}
                      {abilityMod(v)})
                    </option>
                  ))}
                  {/* Allow an "unassigned" placeholder when not yet picked from the array. */}
                  {!STANDARD_ARRAY.includes(score as (typeof STANDARD_ARRAY)[number]) ? (
                    <option value={String(score)}>{score}</option>
                  ) : null}
                </Field>
              ) : (
                <span className="cp-ability__score">
                  <StatNumber value={score} label={`Puntuación de ${a.label}`} />
                  <span
                    className="cp-ability__mod tabular-nums"
                    aria-label={`Modificador de ${a.label}`}
                  >
                    ({fmtMod(score)})
                  </span>
                  {method === 'buy' ? (
                    <span className="cp-stepper" role="group" aria-label={`puntuación de ${a.label}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Reducir puntuación de ${a.label}`}
                        disabled={!canStepInBuy(scores, a.key, -1)}
                        onClick={() => stepBuy(a.key, -1)}
                      >
                        −
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Aumentar puntuación de ${a.label}`}
                        disabled={!canStepInBuy(scores, a.key, +1)}
                        onClick={() => stepBuy(a.key, +1)}
                      >
                        +
                      </Button>
                    </span>
                  ) : null}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {primaryAbility ? (
        <p className="cp-hint">
          Pon tu puntuación más alta en {abilityLabel(primaryAbility)} (tu
          característica principal).
        </p>
      ) : null}
    </div>
  );
}
