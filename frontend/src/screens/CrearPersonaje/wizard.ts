// Wizard step model for the guided "Crear personaje" flow. One decision per
// step, in D&D 2024 order. The Conjuros step is only present for casters.

import type { AbilityScores } from './abilities';
import type { ClassDTO, SpeciesDTO, BackgroundDTO, SpellDTO } from '../../net/http';

export type GenMethod = 'buy' | 'standard' | 'roll';

/** Standard array, highest-first, assignable to abilities. */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/** Caps for level-1 spell selection. */
export const MAX_CANTRIPS = 2;
export const MAX_LEVEL1_SPELLS = 2;

export type StepId =
  | 'clase'
  | 'especie'
  | 'trasfondo'
  | 'caracteristicas'
  | 'competencias'
  | 'conjuros'
  | 'resumen';

export interface StepDef {
  id: StepId;
  title: string;
}

const ALL_STEPS: readonly StepDef[] = [
  { id: 'clase', title: 'Clase' },
  { id: 'especie', title: 'Especie' },
  { id: 'trasfondo', title: 'Trasfondo' },
  { id: 'caracteristicas', title: 'Características' },
  { id: 'competencias', title: 'Competencias' },
  { id: 'conjuros', title: 'Conjuros' },
  { id: 'resumen', title: 'Detalles y resumen' },
];

/** The visible steps for the current build: Conjuros only when the class casts. */
export function stepsFor(selectedClass: ClassDTO | undefined): StepDef[] {
  const caster = selectedClass !== undefined && selectedClass.spellcasting !== 'none';
  return ALL_STEPS.filter((s) => s.id !== 'conjuros' || caster);
}

/** The whole wizard's working state. */
export interface WizardState {
  classId: string | null;
  speciesId: string | null;
  backgroundId: string | null;
  /** Which ability the chosen background boost goes to (from abilityOptions). */
  backgroundAbility: string | null;
  method: GenMethod;
  scores: AbilityScores;
  /** Class skill picks (canonical keys); background skills are separate/locked. */
  classSkills: string[];
  cantrips: string[];
  level1Spells: string[];
  name: string;
  notes: string;
}

/** Whether a given step is complete enough to advance from. */
export function isStepValid(
  step: StepId,
  state: WizardState,
  selectedClass: ClassDTO | undefined,
): boolean {
  switch (step) {
    case 'clase':
      return state.classId !== null;
    case 'especie':
      return state.speciesId !== null;
    case 'trasfondo':
      return state.backgroundId !== null && state.backgroundAbility !== null;
    case 'caracteristicas':
      // Any assigned spread is acceptable as a preview; the server validates.
      return true;
    case 'competencias':
      return state.classSkills.length === (selectedClass?.skillChoices ?? 0);
    case 'conjuros':
      // Optional picks; nothing is forced.
      return true;
    case 'resumen':
      return state.name.trim().length > 0;
    default:
      return false;
  }
}

export function findById<T extends { id: string }>(
  list: T[],
  id: string | null,
): T | undefined {
  if (id === null) return undefined;
  return list.find((x) => x.id === id);
}

export type { ClassDTO, SpeciesDTO, BackgroundDTO, SpellDTO };
