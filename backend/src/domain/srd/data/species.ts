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
    traits: [
      { name: 'Ingenioso', description: 'Obtienes una dote de origen al empezar.' },
      { name: 'Hábil', description: 'Competencia en una habilidad a elegir.' },
    ],
  },
  {
    id: 'elf',
    name: 'Elfo',
    size: 'Mediano',
    speed: 9,
    description: 'Gráciles y longevos, con afinidad por la magia y los sentidos agudos.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Ancestro (Trance)', description: 'No necesitas dormir; meditas durante 4 horas.' },
      { name: 'Sentidos agudos', description: 'Competencia en la habilidad de Percepción.' },
    ],
  },
  {
    id: 'dwarf',
    name: 'Enano',
    size: 'Mediano',
    speed: 9,
    description: 'Resistentes y tenaces, forjados bajo la montaña.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Resistencia enana', description: 'Ventaja en salvaciones contra veneno y resistencia al daño por veneno.' },
      { name: 'Entrenamiento con armas', description: 'Competencia con hachas de batalla, hachas manuales, mazas ligeras y mazas de guerra.' },
    ],
  },
  {
    id: 'halfling',
    name: 'Mediano',
    size: 'Pequeño',
    speed: 7.5,
    description: 'Pequeños, afortunados y difíciles de asustar.',
    traits: [
      { name: 'Suerte', description: 'Cuando sacas un 1 natural en una tirada de ataque, prueba de característica o salvación, puedes repetir el dado.' },
      { name: 'Valentía', description: 'Ventaja en salvaciones contra la condición de aterrado.' },
      { name: 'Agilidad de mediano', description: 'Puedes moverte a través del espacio de una criatura grande o mediana.' },
    ],
  },
  {
    id: 'dragonborn',
    name: 'Dracónido',
    size: 'Mediano',
    speed: 9,
    description: 'Herederos de la sangre de dragón, con un aliento elemental.',
    traits: [
      { name: 'Aliento de dragón', description: 'Como acción, exhalas un cono o línea de energía elemental. Salvación para reducir el daño.' },
      { name: 'Resistencia al daño', description: 'Resistencia al tipo de daño asociado con tu linaje dracónico.' },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    size: 'Pequeño',
    speed: 7.5,
    description: 'Curiosos e inventivos, con una mente difícil de doblegar.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Astucia gnómica', description: 'Ventaja en todas las salvaciones de Inteligencia, Sabiduría y Carisma contra la magia.' },
    ],
  },
  {
    id: 'orc',
    name: 'Orco',
    size: 'Mediano',
    speed: 9,
    description: 'Fuertes y incansables, capaces de aguantar el castigo.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Embate adrenalínico', description: 'Como acción adicional, puedes avanzar hasta tu velocidad hacia un enemigo hostil.' },
      { name: 'Aguante implacable', description: 'Cuando reduces a 0 PG pero no mueres de forma instantánea, puedes caer a 1 PG en su lugar.' },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    size: 'Mediano',
    speed: 9,
    description: 'Marcados por un legado infernal, con dones arcanos innatos.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Herencia infernal', description: 'Resistencia al daño de fuego.' },
    ],
  },
  {
    id: 'goliath',
    name: 'Goliath',
    size: 'Mediano',
    speed: 10.5,
    description: 'Descendientes de gigantes, enormes y de poderosa zancada.',
    traits: [
      { name: 'Constitución de gigante', description: 'Tu máximo de PG aumenta en 1 por cada nivel que tengas.' },
      { name: 'Acarreo poderoso', description: 'Tu capacidad de carga se considera una categoría de tamaño mayor.' },
      { name: 'Zancada larga', description: 'Tu velocidad aumenta 3 m.' },
    ],
  },
  {
    id: 'aasimar',
    name: 'Aasimar',
    size: 'Mediano',
    speed: 9,
    description: 'Tocados por el poder celestial, con una luz interior que brilla contra la oscuridad.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Herencia celestial', description: 'Resistencia al daño necrótico y al daño radiante.' },
    ],
  },
];
