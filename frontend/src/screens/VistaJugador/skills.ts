import type { AbilityKey } from './types';

export interface Skill {
  key: string;
  name: string;
  ability: AbilityKey;
}

/**
 * D&D 2024 skills mapped to their governing ability.
 * Based on the 2024 Player's Handbook skill list.
 */
export const SKILLS: readonly Skill[] = [
  // Strength
  { key: 'athletics', name: 'Atletismo', ability: 'str' },
  
  // Dexterity
  { key: 'acrobatics', name: 'Acrobacias', ability: 'dex' },
  { key: 'sleight_of_hand', name: 'Juego de manos', ability: 'dex' },
  { key: 'stealth', name: 'Sigilo', ability: 'dex' },
  
  // Intelligence
  { key: 'arcana', name: 'Arcano', ability: 'int' },
  { key: 'history', name: 'Historia', ability: 'int' },
  { key: 'investigation', name: 'Investigación', ability: 'int' },
  { key: 'nature', name: 'Naturaleza', ability: 'int' },
  { key: 'religion', name: 'Religión', ability: 'int' },
  
  // Wisdom
  { key: 'animal_handling', name: 'Trato con animales', ability: 'wis' },
  { key: 'insight', name: 'Perspicacia', ability: 'wis' },
  { key: 'medicine', name: 'Medicina', ability: 'wis' },
  { key: 'perception', name: 'Percepción', ability: 'wis' },
  { key: 'survival', name: 'Supervivencia', ability: 'wis' },
  
  // Charisma
  { key: 'deception', name: 'Engaño', ability: 'cha' },
  { key: 'intimidation', name: 'Intimidación', ability: 'cha' },
  { key: 'performance', name: 'Interpretación', ability: 'cha' },
  { key: 'persuasion', name: 'Persuasión', ability: 'cha' },
] as const;

/** Group skills by their governing ability for display purposes. */
export function groupSkillsByAbility(): Record<AbilityKey, Skill[]> {
  const grouped: Record<AbilityKey, Skill[]> = {
    str: [],
    dex: [],
    con: [],
    int: [],
    wis: [],
    cha: [],
  };
  
  for (const skill of SKILLS) {
    grouped[skill.ability].push(skill);
  }
  
  return grouped;
}
