// The 18 standard 5e skills, each tied to its governing ability, with Spanish
// labels. `key` is a stable identifier persisted in `proficientSkills`.

import type { AbilityKey } from './abilities';

export interface SkillDef {
  key: string;
  /** Spanish skill name, e.g. "Atletismo". */
  label: string;
  /** Governing ability key. */
  ability: AbilityKey;
}

export const SKILLS: readonly SkillDef[] = [
  { key: 'acrobatics', label: 'Acrobacias', ability: 'dex' },
  { key: 'animal-handling', label: 'Trato con animales', ability: 'wis' },
  { key: 'arcana', label: 'Conocimiento arcano', ability: 'int' },
  { key: 'athletics', label: 'Atletismo', ability: 'str' },
  { key: 'deception', label: 'Engaño', ability: 'cha' },
  { key: 'history', label: 'Historia', ability: 'int' },
  { key: 'insight', label: 'Perspicacia', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidación', ability: 'cha' },
  { key: 'investigation', label: 'Investigación', ability: 'int' },
  { key: 'medicine', label: 'Medicina', ability: 'wis' },
  { key: 'nature', label: 'Naturaleza', ability: 'int' },
  { key: 'perception', label: 'Percepción', ability: 'wis' },
  { key: 'performance', label: 'Interpretación', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasión', ability: 'cha' },
  { key: 'religion', label: 'Religión', ability: 'int' },
  { key: 'sleight-of-hand', label: 'Juego de manos', ability: 'dex' },
  { key: 'stealth', label: 'Sigilo', ability: 'dex' },
  { key: 'survival', label: 'Supervivencia', ability: 'wis' },
] as const;
