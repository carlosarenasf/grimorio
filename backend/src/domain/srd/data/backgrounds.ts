/**
 * Curated SRD 5.2 (D&D 2024) backgrounds. CC-BY-4.0 — Wizards of the Coast SRD 5.2.
 * In 2024 the background grants the ability score increases (pick +2/+1 among
 * abilityOptions) plus skill proficiencies. Skill keys match the 18-skill list.
 */
import type { BackgroundDef } from '../types.js';

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'acolyte',
    name: 'Acólito',
    description: 'Serviste en un templo. Conoces ritos, plegarias y a quién acudir.',
    abilityOptions: ['int', 'wis', 'cha'],
    skills: ['insight', 'medicine'],
  },
  {
    id: 'soldier',
    name: 'Soldado',
    description: 'Te formaste para la guerra: disciplina, armas y jerarquía.',
    abilityOptions: ['str', 'dex', 'con'],
    skills: ['athletics', 'intimidation'],
  },
  {
    id: 'sage',
    name: 'Sabio',
    description: 'Pasaste años entre libros. Sabes dónde buscar respuestas.',
    abilityOptions: ['con', 'int', 'wis'],
    skills: ['arcana', 'history'],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    description: 'Viviste fuera de la ley. Contactos turbios y manos rápidas.',
    abilityOptions: ['dex', 'con', 'int'],
    skills: ['deception', 'stealth'],
  },
  {
    id: 'wayfarer',
    name: 'Forastero',
    description: 'Criado en los caminos y las tierras salvajes.',
    abilityOptions: ['dex', 'wis', 'cha'],
    skills: ['perception', 'survival'],
  },
  {
    id: 'noble',
    name: 'Noble',
    description: 'Naciste con privilegios, modales y peso político.',
    abilityOptions: ['str', 'int', 'cha'],
    skills: ['history', 'persuasion'],
  },
  {
    id: 'artisan',
    name: 'Artesano',
    description: 'Aprendiste un oficio con tus manos y tu ingenio.',
    abilityOptions: ['str', 'dex', 'int'],
    skills: ['investigation', 'persuasion'],
  },
  {
    id: 'entertainer',
    name: 'Animador',
    description: 'Vives del escenario: música, acrobacias y aplausos.',
    abilityOptions: ['str', 'dex', 'cha'],
    skills: ['acrobatics', 'performance'],
  },
];
