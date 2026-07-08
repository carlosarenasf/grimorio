/**
 * Curated SRD 5.2 (D&D 2024) species, extended with classic D&D races from
 * the 5e.tools community compilation.
 *
 * SRD content: CC-BY-4.0 — Wizards of the Coast SRD 5.2.
 * Additional classic races: each entry links to 5e.tools for the full stat
 * block and licensing details.
 *
 * Speeds in metres (30 ft ≈ 9 m, 25 ft ≈ 7,5 m, 35 ft ≈ 10,5 m).
 */
import type { SpeciesDef } from '../types.js';
import { FIVE_ETOOLS } from '../srdLinks.js';

export const SPECIES: SpeciesDef[] = [
  // ---------- SRD 5.2 core ----------
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
    externalUrl: FIVE_ETOOLS.species('human'),
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
    externalUrl: FIVE_ETOOLS.species('elf'),
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
    externalUrl: FIVE_ETOOLS.species('dwarf'),
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
    externalUrl: FIVE_ETOOLS.species('halfling'),
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
    externalUrl: FIVE_ETOOLS.species('dragonborn'),
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
    externalUrl: FIVE_ETOOLS.species('gnome'),
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
    externalUrl: FIVE_ETOOLS.species('orc'),
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
    externalUrl: FIVE_ETOOLS.species('tiefling'),
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
    externalUrl: FIVE_ETOOLS.species('goliath'),
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
    externalUrl: FIVE_ETOOLS.species('aasimar'),
  },

  // ---------- SRD 5.2 expanded (2024) ----------
  {
    id: 'changeling',
    name: 'Cambiaformas',
    size: 'Mediano',
    speed: 9,
    description: 'Cambiantes de forma natural con la habilidad de adoptar cualquier apariencia.',
    traits: [
      { name: 'Cambiaformas', description: 'Como acción, puedes cambiar tu apariencia y tu voz. Tienes ventaja en pruebas de Engaño para hacerte pasar por otra persona.' },
      { name: 'Instinto de supervivencia', description: 'Tienes competencia en dos habilidades a elegir entre Perspicacia, Engaño e Intimidación.' },
    ],
    externalUrl: FIVE_ETOOLS.species('changeling'),
  },
  {
    id: 'kalashtar',
    name: 'Kalashtar',
    size: 'Mediano',
    speed: 9,
    description: 'Unión de humano y espíritu dreamed, con poderes psíquicos innatos.',
    traits: [
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Vínculo espiritual', description: 'Ventaja en salvaciones contra ser asustado, encantado o poseído.' },
      { name: 'Mente dual', description: 'Puedes lanzar el truco Descarga mental sin gastar espacio de conjuro. Carisma es tu aptitud mágica.' },
    ],
    externalUrl: FIVE_ETOOLS.species('kalashtar'),
  },
  {
    id: 'minotaur',
    name: 'Minotauro',
    size: 'Mediano',
    speed: 9,
    description: 'Imponente híbrido con cuernos que carga a través del campo de batalla.',
    traits: [
      { name: 'Cuernos', description: 'Ataque cuerpo a cuerpo natural: 1d6 perforante.' },
      { name: 'Carga de toro', description: 'Como acción adicional, puedes cargar y luego hacer un ataque de cuernos. Si el objetivo es Mediano o menor, lo empuja 3 m.' },
      { name: 'Laberíntico', description: 'Puedes repetir una prueba de Inteligencia (Investigación) o Sabiduría (Supervivencia) para encontrar el camino. Una vez por descanso corto o largo.' },
    ],
    externalUrl: FIVE_ETOOLS.species('minotaur'),
  },
  {
    id: 'shifter',
    name: 'Cambiante',
    size: 'Mediano',
    speed: 9,
    description: 'Humanoides con un bestia interior que aflora en combate.',
    traits: [
      { name: 'Cambio', description: 'Como acción adicional, puedes cambiar bestialmente hasta 1 minuto. Obtienes 1d6 de daño temporal y ventaja en pruebas de Fuerza y Constitución.' },
      { name: 'Sentidos salvajes', description: 'Ventaja en pruebas de Sabiduría (Percepción) basadas en el olfato.' },
    ],
    externalUrl: FIVE_ETOOLS.species('shifter'),
  },

  // ---------- D&D classics (5e.tools community compilation) ----------
  {
    id: 'drow',
    name: 'Drow',
    size: 'Mediano',
    speed: 9,
    description: 'Elfos oscuros del Subterráneo, con afinidad por la magia y la traición.',
    traits: [
      { name: 'Visión en la oscuridad superior', description: 'Puedes ver en la oscuridad hasta 36 m.' },
      { name: 'Magia drow', description: 'Conoces el trucoDescarga de fuego. Carisma es tu aptitud mágica para él.' },
      { name: 'Sensibilidad a la luz solar', description: 'Tienes desventaja en ataques y pruebas de Sabiduría (Percepción) que dependan de la vista cuando tú o tu objetivo estáis bajo la luz directa del sol.' },
    ],
    externalUrl: FIVE_ETOOLS.species('drow'),
  },
  {
    id: 'half-elf',
    name: 'Semielfo',
    size: 'Mediano',
    speed: 9,
    description: 'Puente entre humanos y elfos, valorados por su diplomacia y carisma.',
    traits: [
      { name: 'Versatilidad de habilidades', description: 'Obtienes competencia en dos habilidades a elegir.' },
      { name: 'Visión en la oscuridad', description: 'Puedes ver en la oscuridad hasta 18 m.' },
      { name: 'Lenguas élficas', description: 'Conoces el idioma élfico y un idioma extra a elegir.' },
    ],
    externalUrl: FIVE_ETOOLS.species('half-elf'),
  },
  {
    id: 'half-orc',
    name: 'Semiorco',
    size: 'Mediano',
    speed: 9,
    description: 'Mezcla de humano y orco, con la fiereza de sus ancestros.',
    traits: [
      { name: 'Ataques salvajes', description: 'Cuando sacas un crítico en un ataque de arma cuerpo a cuerpo, tiras un dado de daño adicional del mismo tipo.' },
      { name: 'Resistente', description: 'Cuando reduces a 0 PG pero no mueres, puedes repetir un dado de PG y usarlo como puntos de golpe restantes.' },
    ],
    externalUrl: FIVE_ETOOLS.species('half-orc'),
  },
  {
    id: 'genasi-air',
    name: 'Genasi (Aire)',
    size: 'Mediano',
    speed: 9,
    description: 'Descendiente de elementales del aire, con la respiración del viento.',
    traits: [
      { name: 'Linaje elemental', description: 'Tus ancestros elementales te otorgan un don: un truco de viento, fuego, tierra o agua.' },
      { name: 'Sopor de los elementales', description: 'No necesitas dormir; meditas 4 horas para obtener los beneficios de un descanso largo.' },
    ],
    externalUrl: FIVE_ETOOLS.species('genasi-air'),
  },
  {
    id: 'genasi-fire',
    name: 'Genasi (Fuego)',
    size: 'Mediano',
    speed: 9,
    description: 'Descendiente de efreet, con la piel humeante y un corazón ardiente.',
    traits: [
      { name: 'Linaje elemental', description: 'Conoces el truco Producir llama. Constitución es tu aptitud mágica para él.' },
      { name: 'Resistencia al fuego', description: 'Resistencia al daño de fuego.' },
    ],
    externalUrl: FIVE_ETOOLS.species('genasi-fire'),
  },
  {
    id: 'genasi-earth',
    name: 'Genasi (Tierra)',
    size: 'Mediano',
    speed: 9,
    description: 'Descendiente de dao, con la solidez de la piedra en su piel.',
    traits: [
      { name: 'Linaje elemental', description: 'Conoces el truco Puñetazo con la mano de piedra. Constitución es tu aptitud mágica para él.' },
      { name: 'Pies firmes', description: 'Consideras terreno difícil como terreno normal para tus movimientos.' },
    ],
    externalUrl: FIVE_ETOOLS.species('genasi-earth'),
  },
  {
    id: 'genasi-water',
    name: 'Genasi (Agua)',
    size: 'Mediano',
    speed: 9,
    description: 'Descendiente de marid, con sangre fría y un vínculo con el mar.',
    traits: [
      { name: 'Linaje elemental', description: 'Conoces el truco Conformar agua. Constitución es tu aptitud mágica para él.' },
      { name: 'Resistencia al ácido', description: 'Resistencia al daño de ácido.' },
      { name: 'Nadador', description: 'Puedes respirar bajo el agua y tienes velocidad de nado igual a tu velocidad andando.' },
    ],
    externalUrl: FIVE_ETOOLS.species('genasi-water'),
  },
  {
    id: 'githyanki',
    name: 'Githyanki',
    size: 'Mediano',
    speed: 9,
    description: 'Guerreros esqueléticos de las estrellas, en eterna guerra con los illithid.',
    traits: [
      { name: 'Decreto de gith', description: 'Conoces los trucos Descarga mágica y Mano de mago. Inteligencia es tu aptitud mágica.' },
      { name: 'Conocimiento de la senda astral', description: 'No necesitas dormir; meditas 4 horas para obtener los beneficios de un descanso largo.' },
      { name: 'Endurecidos por la guerra', description: 'Competencia con espadas largas y espadas cortas.' },
    ],
    externalUrl: FIVE_ETOOLS.species('githyanki'),
  },
  {
    id: 'githzerai',
    name: 'Githzerai',
    size: 'Mediano',
    speed: 9,
    description: 'Monjes disciplinados del caos, en eterna guerra con los illithid.',
    traits: [
      { name: 'Decreto de gith', description: 'Conoces los trucos Descarga mágica y Mano de mago. Sabiduría es tu aptitud mágica.' },
      { name: 'Defensa monástica', description: 'Mientras no lleves armadura ni escudo, tu CA es 10 + mod. DES + mod. SAB.' },
      { name: 'Resistencia psíquica', description: 'Ventaja en salvaciones contra encantamiento y efectos psíquicos.' },
    ],
    externalUrl: FIVE_ETOOLS.species('githzerai'),
  },
  {
    id: 'kenku',
    name: 'Kenku',
    size: 'Mediano',
    speed: 9,
    description: 'Cuervos humanoides con la habilidad de imitar cualquier sonido.',
    traits: [
      { name: 'Mimetismo experto', description: 'Puedes imitar sonidos que hayas oído (ventaja en Engaño para hacerse pasar por otra persona).' },
      { name: 'Mente cuervo', description: 'Competencia en Percepción y Engaño.' },
    ],
    externalUrl: FIVE_ETOOLS.species('kenku'),
  },
  {
    id: 'tabaxi',
    name: 'Tabaxi',
    size: 'Mediano',
    speed: 9,
    description: 'Felinos humanoides curiosos, con garras afiladas y un amor por las historias.',
    traits: [
      { name: 'Garras', description: 'Ataque desarmado natural: 1d4 cortante.' },
      { name: 'Instinto felino', description: 'Tienes ventaja en pruebas de Destreza (Sigilo) y Sabiduría (Percepción).' },
      { name: 'Curiosidad felina', description: 'Tienes competencia en una habilidad a elegir entre Perspicacia, Investigación, Persuasión o Rendimiento.' },
    ],
    externalUrl: FIVE_ETOOLS.species('tabaxi'),
  },
  {
    id: 'tortle',
    name: 'Tortle',
    size: 'Mediano',
    speed: 9,
    description: 'Humanoides tortuga con un caparazón natural que les sirve de armadura.',
    traits: [
      { name: 'CA natural', description: 'Mientras no lleves armadura, tu CA es 17 (caparazón).' },
      { name: 'Resistencia', description: 'Tus PG máximos aumentan en 1 por cada nivel.' },
      { name: 'Vida larga', description: 'No envejeces normalmente hasta los 50 años.' },
    ],
    externalUrl: FIVE_ETOOLS.species('tortle'),
  },
  {
    id: 'aarakocra',
    name: 'Aarakocra',
    size: 'Mediano',
    speed: 9,
    description: 'Humanoides con alas de pájaro, habitantes de los picos más altos.',
    traits: [
      { name: 'Vuelo', description: 'Tienes velocidad de vuelo igual a tu velocidad andando. No puedes volar con armadura media o pesada.' },
      { name: 'Garras', description: 'Ataque desarmado natural: 1d4 cortante.' },
      { name: 'Visión aguda', description: 'Visión en la oscuridad hasta 18 m.' },
    ],
    externalUrl: FIVE_ETOOLS.species('aarakocra'),
  },
  {
    id: 'firbolg',
    name: 'Firbolg',
    size: 'Mediano',
    speed: 9,
    description: 'Gigantes pacíficos del bosque, con afinidad por la naturaleza y la magia.',
    traits: [
      { name: 'Magia firbolg', description: 'Puedes lanzar Detectar magia y Disipar magia una vez al día cada uno, usando Sabiduría.' },
      { name: 'Habla de bestias y hojas', description: 'Puedes comunicarte con bestias y plantas.' },
      { name: 'Fuerza de los gigantes', description: 'Puedes añadir un dado de PG a las cargas que levantes.' },
    ],
    externalUrl: FIVE_ETOOLS.species('firbolg'),
  },
];
