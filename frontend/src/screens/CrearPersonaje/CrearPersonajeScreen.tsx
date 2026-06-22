import { useMemo, useState } from 'react';
import { Button, Field, Panel, StatNumber } from '../../design';
import '../../design/tokens.css';
import '../../design/components.css';
import type { ApiClient, CharacterDTO } from '../../net';
import { ApiError } from '../../net';
import { ABILITIES } from './abilities';
import type { AbilityKey, AbilityScores } from './abilities';
import { BUY_BASELINE_SCORES } from './abilities';
import { SKILLS } from './skills';
import {
  POINT_BUY_BUDGET,
  totalCost,
  isOverBudget,
  canStepInBuy,
  rollScores,
  BUY_MIN,
  BUY_MAX,
} from './pointbuy';
import {
  abilityMod,
  proficiencyBonus,
  skillModifier,
} from './derived';
import { SummaryCard } from './SummaryCard';
import { AttacksEditor } from './AttacksEditor';
import type { AttackRow } from './AttacksEditor';
import { makeAttack } from './AttacksEditor';

type Method = 'buy' | 'roll';

export interface CrearPersonajeScreenProps {
  /** Injected API client. */
  api: ApiClient;
  /** Campaign this character belongs to. */
  campaignId: string;
  /** User id of the owning player. */
  ownerId: string;
  /** Called with the server-returned sheet after a successful save. */
  onSaved?: (sheet: CharacterDTO) => void;
  /** Called when the user presses "Volver". */
  onBack?: () => void;
  /** When provided, the screen runs in edit mode (PATCH instead of POST). */
  initialSheet?: CharacterDTO;
}

interface FormState {
  name: string;
  species: string;
  className: string;
  background: string;
  level: number;
  method: Method;
  scores: AbilityScores;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  proficientSkills: string[];
  attacks: AttackRow[];
  notes: string;
}

function scoresFrom(dto: CharacterDTO | undefined, fallback: AbilityScores): AbilityScores {
  if (!dto) return fallback;
  return { ...fallback, ...dto.scores };
}

function attacksFrom(dto: CharacterDTO | undefined): AttackRow[] {
  const raw = dto?.attacks;
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>).map((a) => ({
    id: String(a.id ?? makeAttack().id),
    name: String(a.name ?? ''),
    kind:
      a.kind === 'spell' || a.kind === 'save' ? (a.kind as AttackRow['kind']) : 'weapon',
    bonus: a.bonus === null || a.bonus === undefined ? 0 : Number(a.bonus),
    damage: a.damage === null || a.damage === undefined ? '' : String(a.damage),
  }));
}

function initialState(initialSheet?: CharacterDTO): FormState {
  return {
    name: initialSheet?.name ?? '',
    species: initialSheet?.species ?? '',
    className: initialSheet?.className ?? '',
    background: initialSheet?.background ?? '',
    level: initialSheet?.level ?? 1,
    method: 'buy',
    // In a fresh sheet, buy mode starts at the cheapest legal baseline (all 8s,
    // 0/27). An edit keeps the persisted scores.
    scores: scoresFrom(initialSheet, BUY_BASELINE_SCORES),
    maxHp: initialSheet?.maxHp ?? 10,
    currentHp: initialSheet?.currentHp ?? 10,
    armorClass: initialSheet?.armorClass ?? 10,
    speed: initialSheet?.speed ?? 9,
    proficientSkills: initialSheet?.proficientSkills ?? [],
    attacks: attacksFrom(initialSheet),
    notes: initialSheet?.notes ?? '',
  };
}

const STEPS = [
  'Identidad',
  'Características',
  'Combate',
  'Competencias',
  'Ataques y conjuros',
  'Rasgos',
] as const;

/**
 * Stepper button pair shared by the numeric controls. Each control is a real
 * <button> with an aria-label (DESIGN_SPEC §8 — keyboard + a11y).
 */
function Stepper({
  label,
  value,
  onStep,
  canDecrement = true,
  canIncrement = true,
  signed = false,
}: {
  label: string;
  value: number;
  onStep: (delta: number) => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  signed?: boolean;
}) {
  return (
    <div className="cp-stepper" role="group" aria-label={label}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Reducir ${label}`}
        disabled={!canDecrement}
        onClick={() => onStep(-1)}
      >
        −
      </Button>
      <StatNumber value={value} label={label} signed={signed} />
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Aumentar ${label}`}
        disabled={!canIncrement}
        onClick={() => onStep(+1)}
      >
        +
      </Button>
    </div>
  );
}

/**
 * Crear Personaje (DESIGN_SPEC §4.b): a 6-step 5e sheet with a live summary
 * card. Self-contained — deps are injected via props; nothing imports the app
 * router. All math shown is a client preview; the server returns the canonical
 * sheet on save.
 */
export function CrearPersonajeScreen({
  api,
  campaignId,
  ownerId,
  onSaved,
  onBack,
  initialSheet,
}: CrearPersonajeScreenProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialState(initialSheet));
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEdit = initialSheet !== undefined;
  const prof = proficiencyBonus(form.level);
  const pointsUsed = totalCost(form.scores);
  const overBudget = isOverBudget(form.scores);

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function setScore(key: AbilityKey, value: number) {
    patch({ scores: { ...form.scores, [key]: value } });
  }

  function stepScore(key: AbilityKey, delta: number) {
    if (form.method === 'buy') {
      if (!canStepInBuy(form.scores, key, delta)) return;
      setScore(key, form.scores[key] + delta);
    } else {
      const next = Math.max(3, Math.min(20, form.scores[key] + delta));
      setScore(key, next);
    }
  }

  function setMethod(method: Method) {
    if (method === 'buy') {
      patch({ method, scores: BUY_BASELINE_SCORES });
    } else {
      patch({ method });
    }
  }

  function rollAll() {
    patch({ method: 'roll', scores: rollScores() });
  }

  function toggleSkill(key: string) {
    const has = form.proficientSkills.includes(key);
    patch({
      proficientSkills: has
        ? form.proficientSkills.filter((k) => k !== key)
        : [...form.proficientSkills, key],
    });
  }

  async function handleSave() {
    setError(null);
    setSavedName(null);
    setSaving(true);
    try {
      let result: CharacterDTO;
      if (isEdit && initialSheet) {
        result = await api.updateCharacter(initialSheet.id, {
          type: 'UpdateCharacter',
          characterId: initialSheet.id,
          patch: {
            name: form.name,
            species: form.species,
            className: form.className,
            background: form.background,
            level: form.level,
            scores: form.scores,
            maxHp: form.maxHp,
            currentHp: form.currentHp,
            armorClass: form.armorClass,
            speed: form.speed,
            proficientSkills: form.proficientSkills,
            notes: form.notes,
          },
        });
      } else {
        result = await api.createCharacter({
          type: 'CreateCharacter',
          campaignId,
          ownerId,
          name: form.name,
          species: form.species,
          className: form.className,
          background: form.background,
          level: form.level,
          method: form.method,
          scores: form.scores,
        } as Parameters<ApiClient['createCharacter']>[0]);
      }
      setSavedName(result.name);
      onSaved?.(result);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.code === 'IllegalPointBuy') {
          setError('La compra de puntos no es válida.');
        } else {
          setError(err.message || 'No se pudo guardar el personaje.');
        }
      } else {
        setError('No se pudo guardar el personaje.');
      }
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(
    () => (
      <SummaryCard
        name={form.name}
        species={form.species}
        className={form.className}
        level={form.level}
        scores={form.scores}
        maxHp={form.maxHp}
        armorClass={form.armorClass}
        speed={form.speed}
        attacks={form.attacks}
      />
    ),
    [form],
  );

  return (
    <div className="cp-screen">
      <header className="cp-header">
        <Button variant="ghost" onClick={() => onBack?.()}>
          Volver
        </Button>
        <h1 className="font-display cp-header__title">
          {isEdit ? 'Editar personaje' : 'Crear personaje'}
        </h1>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </header>

      {savedName ? (
        <p className="cp-saved" role="status">
          Personaje «{savedName}» guardado.
        </p>
      ) : null}
      {error ? (
        <p className="cp-error" role="alert">
          {error}
        </p>
      ) : null}

      <nav className="cp-steps" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <Button
            key={label}
            variant={i === step ? 'primary' : 'ghost'}
            size="sm"
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </Button>
        ))}
      </nav>

      <div className="cp-layout">
        <main className="cp-main">
          {step === 0 ? (
            <Panel eyebrow={`Paso 1 de ${STEPS.length}`} title="Identidad">
              <Field
                label="Nombre"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <Field
                label="Especie"
                value={form.species}
                onChange={(e) => patch({ species: e.target.value })}
              />
              <Field
                label="Clase"
                value={form.className}
                onChange={(e) => patch({ className: e.target.value })}
              />
              <Field
                label="Trasfondo"
                value={form.background}
                onChange={(e) => patch({ background: e.target.value })}
              />
              <div className="field">
                <span className="eyebrow field__label" id="cp-level-label">
                  Nivel
                </span>
                <Stepper
                  label="Nivel"
                  value={form.level}
                  canDecrement={form.level > 1}
                  canIncrement={form.level < 20}
                  onStep={(d) =>
                    patch({
                      level: Math.max(1, Math.min(20, form.level + d)),
                    })
                  }
                />
              </div>
            </Panel>
          ) : null}

          {step === 1 ? (
            <Panel eyebrow={`Paso 2 de ${STEPS.length}`} title="Características">
              <div className="cp-method" role="group" aria-label="Método de generación">
                <Button
                  variant={form.method === 'buy' ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={form.method === 'buy'}
                  onClick={() => setMethod('buy')}
                >
                  Compra de puntos
                </Button>
                <Button
                  variant={form.method === 'roll' ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={form.method === 'roll'}
                  onClick={rollAll}
                >
                  Tirar 4d6
                </Button>
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
              </div>

              <ul className="cp-abilities">
                {ABILITIES.map((a) => {
                  const score = form.scores[a.key];
                  const mod = abilityMod(score);
                  const buyMode = form.method === 'buy';
                  const canDec = buyMode
                    ? canStepInBuy(form.scores, a.key, -1)
                    : score > 3;
                  const canInc = buyMode
                    ? canStepInBuy(form.scores, a.key, +1)
                    : score < 20;
                  return (
                    <li key={a.key} className="cp-ability" data-testid={`ability-${a.key}`}>
                      <span className="eyebrow cp-ability__name">{a.label}</span>
                      <span className="cp-ability__score">
                        <StatNumber value={score} label={`Puntuación de ${a.label}`} />
                        <span
                          className="cp-ability__mod tabular-nums"
                          aria-label={`Modificador de ${a.label}`}
                        >
                          ({mod >= 0 ? '+' : ''}
                          {mod})
                        </span>
                      </span>
                      <Stepper
                        label={`puntuación de ${a.label}`}
                        value={score}
                        canDecrement={canDec}
                        canIncrement={canInc}
                        onStep={(d) => stepScore(a.key, d)}
                      />
                    </li>
                  );
                })}
              </ul>
              {form.method === 'buy' ? (
                <p className="cp-hint">
                  En compra de puntos cada característica va de {BUY_MIN} a {BUY_MAX}.
                </p>
              ) : null}
            </Panel>
          ) : null}

          {step === 2 ? (
            <Panel eyebrow={`Paso 3 de ${STEPS.length}`} title="Combate">
              <div className="cp-combat">
                <div className="field">
                  <span className="eyebrow field__label">Puntos de vida (PV)</span>
                  <Stepper
                    label="puntos de vida"
                    value={form.maxHp}
                    canDecrement={form.maxHp > 0}
                    onStep={(d) =>
                      patch({
                        maxHp: Math.max(0, form.maxHp + d),
                        currentHp: Math.max(0, form.maxHp + d),
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="eyebrow field__label">Clase de armadura (CA)</span>
                  <Stepper
                    label="clase de armadura"
                    value={form.armorClass}
                    canDecrement={form.armorClass > 0}
                    onStep={(d) =>
                      patch({ armorClass: Math.max(0, form.armorClass + d) })
                    }
                  />
                </div>
                <div className="field">
                  <span className="eyebrow field__label">Velocidad</span>
                  <Stepper
                    label="velocidad"
                    value={form.speed}
                    canDecrement={form.speed > 0}
                    onStep={(d) => patch({ speed: Math.max(0, form.speed + d) })}
                  />
                </div>
              </div>
            </Panel>
          ) : null}

          {step === 3 ? (
            <Panel eyebrow={`Paso 4 de ${STEPS.length}`} title="Competencias">
              <p className="cp-hint">
                Bono de competencia actual:{' '}
                <span className="tabular-nums">+{prof}</span>
              </p>
              <ul className="cp-skills">
                {SKILLS.map((s) => {
                  const on = form.proficientSkills.includes(s.key);
                  const mod = skillModifier(s.key, form.scores, form.level, on);
                  return (
                    <li key={s.key} className="cp-skill">
                      <label className="cp-skill__label">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleSkill(s.key)}
                          aria-label={`Competente en ${s.label}`}
                        />
                        <span>{s.label}</span>
                      </label>
                      <span
                        className="cp-skill__mod tabular-nums"
                        data-testid={`skill-mod-${s.key}`}
                        aria-label={`Modificador de ${s.label}`}
                      >
                        {mod >= 0 ? '+' : ''}
                        {mod}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          {step === 4 ? (
            <Panel eyebrow={`Paso 5 de ${STEPS.length}`} title="Ataques y conjuros">
              <AttacksEditor
                attacks={form.attacks}
                onChange={(attacks) => patch({ attacks })}
              />
            </Panel>
          ) : null}

          {step === 5 ? (
            <Panel eyebrow={`Paso 6 de ${STEPS.length}`} title="Rasgos">
              <Field
                as="textarea"
                label="Rasgos, personalidad y vínculos"
                rows={8}
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </Panel>
          ) : null}
        </main>

        <aside className="cp-aside" aria-label="Resumen del personaje">
          {summary}
        </aside>
      </div>
    </div>
  );
}
