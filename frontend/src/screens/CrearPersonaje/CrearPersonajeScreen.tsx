import { useEffect, useMemo, useState } from 'react';
import { Button, Panel } from '../../design';
import '../../design/tokens.css';
import '../../design/components.css';
import './crear-personaje.css';
import type { ApiClient, CharacterDTO } from '../../net';
import type {
  ClassDTO,
  SpeciesDTO,
  BackgroundDTO,
  SpellDTO,
} from '../../net/http';
import { ApiError } from '../../net';
import type { AbilityScores } from './abilities';
import { BUY_BASELINE_SCORES, ABILITY_KEYS } from './abilities';
import { isLegalPointBuy } from './pointbuy';
import { abilityMod } from './derived';
import { canonicalSkillKey } from './labels';
import {
  stepsFor,
  isStepValid,
  findById,
  STANDARD_ARRAY,
} from './wizard';
import type { WizardState, GenMethod } from './wizard';
import { StepClase } from './StepClase';
import { StepEspecie } from './StepEspecie';
import { StepTrasfondo } from './StepTrasfondo';
import { StepCaracteristicas } from './StepCaracteristicas';
import { StepCompetencias } from './StepCompetencias';
import { StepConjuros } from './StepConjuros';
import { StepResumen } from './StepResumen';
import { SummaryCard } from './SummaryCard';

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
  /** Pre-fills the name when re-creating from an existing sheet. */
  initialSheet?: CharacterDTO;
}

/** Standard array assigned highest-first to abilities in canonical order. */
function standardArrayScores(): AbilityScores {
  const out = {} as AbilityScores;
  ABILITY_KEYS.forEach((key, i) => {
    out[key] = STANDARD_ARRAY[i] ?? 10;
  });
  return out;
}

function initialWizardState(initialSheet?: CharacterDTO): WizardState {
  return {
    classId: null,
    speciesId: null,
    backgroundId: null,
    backgroundAbility: null,
    method: 'buy',
    scores: { ...BUY_BASELINE_SCORES },
    classSkills: [],
    cantrips: [],
    level1Spells: [],
    name: initialSheet?.name ?? '',
    notes: initialSheet?.notes ?? '',
  };
}

/**
 * Guided "Crear personaje" wizard (D&D 2024 order). One decision per step;
 * Siguiente is disabled until the step is valid. The Conjuros step only appears
 * for casters. The server returns the canonical sheet on save.
 */
export function CrearPersonajeScreen({
  api,
  campaignId,
  ownerId,
  onSaved,
  onBack,
  initialSheet,
}: CrearPersonajeScreenProps) {
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [species, setSpecies] = useState<SpeciesDTO[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundDTO[]>([]);
  const [spells, setSpells] = useState<SpellDTO[]>([]);
  const [spellsLoading, setSpellsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>(() =>
    initialWizardState(initialSheet),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load reference data once.
  useEffect(() => {
    let active = true;
    Promise.all([api.getClasses(), api.getSpecies(), api.getBackgrounds()])
      .then(([cls, spc, bg]) => {
        if (!active) return;
        setClasses(cls);
        setSpecies(spc);
        setBackgrounds(bg);
      })
      .catch(() => {
        if (active) setLoadError('No se pudieron cargar los datos de creación.');
      });
    return () => {
      active = false;
    };
  }, [api]);

  const selectedClass = findById(classes, state.classId);
  const selectedSpecies = findById(species, state.speciesId);
  const selectedBackground = findById(backgrounds, state.backgroundId);

  // Fetch spells whenever the chosen caster class changes.
  useEffect(() => {
    if (!selectedClass || selectedClass.spellcasting === 'none') {
      setSpells([]);
      return;
    }
    let active = true;
    setSpellsLoading(true);
    api
      .getSpells(selectedClass.id)
      .then((list) => {
        if (active) setSpells(list);
      })
      .catch(() => {
        if (active) setSpells([]);
      })
      .finally(() => {
        if (active) setSpellsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, selectedClass]);

  const steps = useMemo(() => stepsFor(selectedClass), [selectedClass]);
  // Keep stepIndex in range when the step list shrinks/grows (caster toggle).
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const current = steps[clampedIndex];

  function update(next: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  function selectClass(id: string) {
    // Changing class invalidates class-skill picks and spells.
    update({ classId: id, classSkills: [], cantrips: [], level1Spells: [] });
  }

  function selectSpecies(id: string) {
    update({ speciesId: id });
  }

  function selectBackground(id: string) {
    const bg = backgrounds.find((b) => b.id === id);
    const onlyOption =
      bg && bg.abilityOptions.length === 1 ? bg.abilityOptions[0] : null;
    update({ backgroundId: id, backgroundAbility: onlyOption });
  }

  function changeMethod(method: GenMethod) {
    if (method === 'buy') update({ method, scores: { ...BUY_BASELINE_SCORES } });
    else if (method === 'standard') update({ method, scores: standardArrayScores() });
    else update({ method });
  }

  function toggleClassSkill(key: string) {
    const has = state.classSkills.includes(key);
    update({
      classSkills: has
        ? state.classSkills.filter((k) => k !== key)
        : [...state.classSkills, key],
    });
  }

  function toggleCantrip(id: string) {
    const has = state.cantrips.includes(id);
    update({
      cantrips: has
        ? state.cantrips.filter((c) => c !== id)
        : [...state.cantrips, id],
    });
  }

  function toggleLevel1(id: string) {
    const has = state.level1Spells.includes(id);
    update({
      level1Spells: has
        ? state.level1Spells.filter((c) => c !== id)
        : [...state.level1Spells, id],
    });
  }

  // ---- Derived stats for the summary and the save payload ----
  const grantedSkills = (selectedBackground?.skills ?? []).map(canonicalSkillKey);
  const proficientSkills = useMemo(() => {
    const set = new Set<string>([...grantedSkills, ...state.classSkills]);
    return [...set];
  }, [grantedSkills, state.classSkills]);

  const conMod = abilityMod(state.scores.con);
  const dexMod = abilityMod(state.scores.dex);
  const maxHp = (selectedClass?.hitDie ?? 8) + conMod;
  const armorClass = 10 + dexMod;
  const speed = selectedSpecies?.speed ?? 9;

  const chosenSpellIds = useMemo(
    () => [...state.cantrips, ...state.level1Spells],
    [state.cantrips, state.level1Spells],
  );
  const spellNames = useMemo(
    () =>
      chosenSpellIds
        .map((id) => spells.find((s) => s.id === id)?.name)
        .filter((n): n is string => Boolean(n)),
    [chosenSpellIds, spells],
  );

  const stepValid = current ? isStepValid(current.id, state, selectedClass) : false;
  const isLast = clampedIndex === steps.length - 1;

  function goNext() {
    if (!stepValid) return;
    setStepIndex(Math.min(clampedIndex + 1, steps.length - 1));
  }
  function goBack() {
    setStepIndex(Math.max(clampedIndex - 1, 0));
  }

  async function handleCreate() {
    if (!selectedClass || !selectedSpecies || !selectedBackground) return;
    setError(null);
    setSavedName(null);
    setSaving(true);

    const scores = state.scores;
    const speciesName = selectedSpecies.name;
    const className = selectedClass.name;
    const backgroundName = selectedBackground.name;

    try {
      let result: CharacterDTO;
      // Point-buy that is a legal 27-point spread → method 'buy' with scores.
      // Otherwise (standard array / 4d6, which 'buy' would reject) → create with
      // method 'roll' (server rolls), then PATCH the exact chosen scores back.
      const canBuy = state.method === 'buy' && isLegalPointBuy(scores);

      if (canBuy) {
        result = await api.createCharacter({
          campaignId,
          ownerId,
          name: state.name,
          species: speciesName,
          className,
          background: backgroundName,
          level: 1,
          method: 'buy',
          scores,
          proficientSkills,
          spells: chosenSpellIds,
        } as Parameters<ApiClient['createCharacter']>[0]);
      } else {
        const created = await api.createCharacter({
          campaignId,
          ownerId,
          name: state.name,
          species: speciesName,
          className,
          background: backgroundName,
          level: 1,
          method: 'roll',
          proficientSkills,
          spells: chosenSpellIds,
        } as Parameters<ApiClient['createCharacter']>[0]);
        result = await api.updateCharacter(created.id, {
          scores,
          maxHp,
          currentHp: maxHp,
          armorClass,
        });
      }

      setSavedName(result.name);
      onSaved?.(result);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.code === 'IllegalPointBuy') {
          setError('La compra de puntos no es válida.');
        } else {
          setError(err.message || 'No se pudo crear el personaje.');
        }
      } else {
        setError('No se pudo crear el personaje.');
      }
    } finally {
      setSaving(false);
    }
  }

  const stepNumberLabel = `Paso ${clampedIndex + 1} de ${steps.length} · ${
    current?.title ?? ''
  }`;

  return (
    <div className="cp-screen">
      <header className="cp-header">
        <Button variant="ghost" onClick={() => onBack?.()}>
          Volver
        </Button>
        <h1 className="font-display cp-header__title">Crear personaje</h1>
        <span aria-hidden="true" />
      </header>

      {loadError ? (
        <p className="cp-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {savedName ? (
        <p className="cp-saved" role="status">
          Personaje «{savedName}» creado.
        </p>
      ) : null}
      {error ? (
        <p className="cp-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="cp-layout">
        <main className="cp-main">
          <Panel eyebrow={stepNumberLabel} title={current?.title ?? ''}>
            {current?.id === 'clase' ? (
              <StepClase
                classes={classes}
                selectedId={state.classId}
                onSelect={selectClass}
              />
            ) : null}

            {current?.id === 'especie' ? (
              <StepEspecie
                species={species}
                selectedId={state.speciesId}
                onSelect={selectSpecies}
              />
            ) : null}

            {current?.id === 'trasfondo' ? (
              <StepTrasfondo
                backgrounds={backgrounds}
                selectedId={state.backgroundId}
                selectedAbility={state.backgroundAbility}
                onSelect={selectBackground}
                onSelectAbility={(a) => update({ backgroundAbility: a })}
              />
            ) : null}

            {current?.id === 'caracteristicas' ? (
              <StepCaracteristicas
                method={state.method}
                scores={state.scores}
                primaryAbility={selectedClass?.primaryAbility}
                onChangeMethod={changeMethod}
                onChangeScores={(scores) => update({ scores })}
              />
            ) : null}

            {current?.id === 'competencias' ? (
              <StepCompetencias
                selectedClass={selectedClass}
                selectedBackground={selectedBackground}
                classSkills={state.classSkills}
                onToggleClassSkill={toggleClassSkill}
              />
            ) : null}

            {current?.id === 'conjuros' ? (
              <StepConjuros
                spells={spells}
                loading={spellsLoading}
                cantrips={state.cantrips}
                level1Spells={state.level1Spells}
                onToggleCantrip={toggleCantrip}
                onToggleLevel1={toggleLevel1}
              />
            ) : null}

            {current?.id === 'resumen' ? (
              <StepResumen
                name={state.name}
                notes={state.notes}
                onChangeName={(name) => update({ name })}
                onChangeNotes={(notes) => update({ notes })}
              />
            ) : null}
          </Panel>

          <nav className="cp-nav" aria-label="Navegación de pasos">
            <Button
              variant="secondary"
              onClick={goBack}
              disabled={clampedIndex === 0}
            >
              Atrás
            </Button>
            {isLast ? (
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={saving || !stepValid}
              >
                {saving ? 'Creando…' : 'Crear personaje'}
              </Button>
            ) : (
              <Button variant="primary" onClick={goNext} disabled={!stepValid}>
                Siguiente
              </Button>
            )}
          </nav>
        </main>

        <aside className="cp-aside" aria-label="Resumen del personaje">
          <SummaryCard
            name={state.name}
            species={selectedSpecies?.name ?? ''}
            className={selectedClass?.name ?? ''}
            level={1}
            scores={state.scores}
            maxHp={maxHp}
            armorClass={armorClass}
            speed={speed}
            proficientSkills={proficientSkills}
            spellNames={spellNames}
          />
        </aside>
      </div>
    </div>
  );
}
