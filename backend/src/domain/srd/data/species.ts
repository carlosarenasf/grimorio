/**
 * Curated SRD 5.2 (D&D 2024) species. CC-BY-4.0 — Wizards of the Coast SRD 5.2.
 * Speeds in metres (30 ft ≈ 9 m, 25 ft ≈ 7,5 m, 35 ft ≈ 10,5 m).
 */
import type { SpeciesDef } from '../types.js';

export const SPECIES: SpeciesDef[] = [
  {
    id: 'human',
    name: 'Humano',
    size: 'Mediano',
    speed: 9,
    description: 'Versátiles y ambiciosos. Una dote extra y competencia adicional al empezar.',
    traits: ['Ingenioso (dote de origen)', 'Hábil (competencia en una habilidad)'],
  },
  {
    id: 'elf',
    name: 'Elfo',
    size: 'Mediano',
    speed: 9,
    description: 'Gráciles y longevos, con afinidad por la magia y los sentidos agudos.',
    traits: ['Visión en la oscuridad', 'Linaje feérico (ventaja contra hechizado)', 'Trance'],
  },
  {
    id: 'dwarf',
    name: 'Enano',
    size: 'Mediano',
    speed: 9,
    description: 'Resistentes y tenaces, forjados bajo la montaña.',
    traits: ['Visión en la oscuridad', 'Resistencia enana (a veneno)', 'Sentido de la piedra'],
  },
  {
    id: 'halfling',
    name: 'Mediano',
    size: 'Pequeño',
    speed: 7.5,
    description: 'Pequeños, afortunados y difíciles de asustar.',
    traits: ['Suerte (repite el 1 natural)', 'Valiente (ventaja contra miedo)', 'Sigiloso'],
  },
  {
    id: 'dragonborn',
    name: 'Dracónido',
    size: 'Mediano',
    speed: 9,
    description: 'Herederos de la sangre de dragón, con un aliento elemental.',
    traits: ['Arma de aliento', 'Resistencia al daño de su linaje', 'Alas dracónicas (nivel 5)'],
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    size: 'Pequeño',
    speed: 7.5,
    description: 'Curiosos e inventivos, con una mente difícil de doblegar.',
    traits: ['Visión en la oscuridad', 'Astucia gnoma (ventaja en salv. mentales)'],
  },
  {
    id: 'orc',
    name: 'Orco',
    size: 'Mediano',
    speed: 9,
    description: 'Fuertes y incansables, capaces de aguantar el castigo.',
    traits: ['Visión en la oscuridad', 'Embate adrenalínico', 'Aguante implacable'],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    size: 'Mediano',
    speed: 9,
    description: 'Marcados por un legado infernal, con dones arcanos innatos.',
    traits: ['Visión en la oscuridad', 'Resistencia (según linaje)', 'Legado arcano'],
  },
  {
    id: 'goliath',
    name: 'Goliath',
    size: 'Mediano',
    speed: 10.5,
    description: 'Descendientes de gigantes, enormes y de poderosa zancada.',
    traits: ['Constitución de gigante', 'Acarreo poderoso', 'Zancada larga'],
  },
];
