/**
 * Curated SRD 5.2 (D&D 2024) spells — cantrips (level 0) and level-1 spells for
 * the spellcasting classes. CC-BY-4.0 — Wizards of the Coast SRD 5.2.
 * `classes` are class ids; `damage` is the dice the spell rolls (null = utility).
 */
import type { SpellDef } from '../types.js';

export const SPELLS: SpellDef[] = [
  // ---------- Cantrips (level 0) ----------
  { id: 'fire-bolt', name: 'Descarga de fuego', level: 0, school: 'Evocación', classes: ['wizard', 'sorcerer'], damage: '1d10', description: 'Ataque a distancia: 1d10 de fuego.' },
  { id: 'ray-of-frost', name: 'Rayo de escarcha', level: 0, school: 'Evocación', classes: ['wizard', 'sorcerer'], damage: '1d8', description: 'Ataque a distancia: 1d8 de frío y reduce la velocidad.' },
  { id: 'sacred-flame', name: 'Llama sagrada', level: 0, school: 'Evocación', classes: ['cleric'], damage: '1d8', description: 'Salv. DES o 1d8 radiante (ignora cobertura).' },
  { id: 'eldritch-blast', name: 'Descarga sobrenatural', level: 0, school: 'Evocación', classes: ['warlock'], damage: '1d10', description: 'Ataque a distancia: 1d10 de fuerza. El cantrip estrella del brujo.' },
  { id: 'vicious-mockery', name: 'Burla cruel', level: 0, school: 'Encantamiento', classes: ['bard'], damage: '1d6', description: 'Salv. SAB o 1d6 psíquico y desventaja en su próximo ataque.' },
  { id: 'poison-spray', name: 'Rociada venenosa', level: 0, school: 'Necromancia', classes: ['wizard', 'sorcerer', 'druid', 'warlock'], damage: '1d12', description: 'Salv. CON o 1d12 de veneno a corta distancia.' },
  { id: 'guidance', name: 'Orientación', level: 0, school: 'Adivinación', classes: ['cleric', 'druid'], damage: '1d4', description: 'Un aliado suma 1d4 a una prueba de característica.' },
  { id: 'light', name: 'Luz', level: 0, school: 'Evocación', classes: ['cleric', 'wizard', 'sorcerer', 'bard'], damage: null, description: 'Un objeto emite luz brillante en 6 m.' },
  { id: 'mage-hand', name: 'Mano de mago', level: 0, school: 'Conjuración', classes: ['wizard', 'sorcerer', 'bard', 'warlock'], damage: null, description: 'Una mano espectral manipula objetos a distancia.' },
  { id: 'prestidigitation', name: 'Prestidigitación', level: 0, school: 'Transmutación', classes: ['wizard', 'sorcerer', 'bard', 'warlock'], damage: null, description: 'Pequeños trucos mágicos de utilidad.' },
  { id: 'message', name: 'Mensaje', level: 0, school: 'Transmutación', classes: ['wizard', 'sorcerer', 'bard'], damage: null, description: 'Susurra un mensaje a una criatura a distancia.' },
  { id: 'druidcraft', name: 'Truco de druida', level: 0, school: 'Transmutación', classes: ['druid'], damage: null, description: 'Efectos menores de la naturaleza.' },

  // ---------- Level 1 ----------
  { id: 'magic-missile', name: 'Proyectil mágico', level: 1, school: 'Evocación', classes: ['wizard', 'sorcerer'], damage: '3d4+3', description: 'Tres dardos que impactan sin fallar: 1d4+1 de fuerza cada uno.' },
  { id: 'cure-wounds', name: 'Curar heridas', level: 1, school: 'Abjuración', classes: ['cleric', 'druid', 'bard', 'paladin', 'ranger'], damage: '2d8', description: 'Toca a una criatura y cura 2d8 + mod. de lanzamiento.' },
  { id: 'healing-word', name: 'Palabra de curación', level: 1, school: 'Abjuración', classes: ['cleric', 'druid', 'bard'], damage: '2d4', description: 'Cura 2d4 + mod. a distancia, como acción adicional.' },
  { id: 'burning-hands', name: 'Manos ardientes', level: 1, school: 'Evocación', classes: ['wizard', 'sorcerer'], damage: '3d6', description: 'Cono de fuego: 3d6 (salv. DES por la mitad).' },
  { id: 'shield', name: 'Escudo', level: 1, school: 'Abjuración', classes: ['wizard', 'sorcerer'], damage: null, description: 'Reacción: +5 a la CA hasta tu próximo turno.' },
  { id: 'mage-armor', name: 'Armadura de mago', level: 1, school: 'Abjuración', classes: ['wizard', 'sorcerer'], damage: null, description: 'CA base 13 + DES durante 8 horas.' },
  { id: 'detect-magic', name: 'Detectar magia', level: 1, school: 'Adivinación', classes: ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'paladin', 'ranger'], damage: null, description: 'Percibe la magia en 9 m (ritual).' },
  { id: 'bless', name: 'Bendición', level: 1, school: 'Encantamiento', classes: ['cleric', 'paladin'], damage: null, description: 'Hasta 3 aliados suman 1d4 a ataques y salvaciones.' },
  { id: 'faerie-fire', name: 'Fuego feérico', level: 1, school: 'Evocación', classes: ['druid', 'bard'], damage: null, description: 'Ilumina a los objetivos: ventaja a los ataques contra ellos.' },
  { id: 'thunderwave', name: 'Onda atronadora', level: 1, school: 'Evocación', classes: ['wizard', 'sorcerer', 'druid', 'bard'], damage: '2d8', description: 'Cubo de 4,5 m: 2d8 trueno y empuje (salv. CON).' },
  { id: 'charm-person', name: 'Encantar persona', level: 1, school: 'Encantamiento', classes: ['wizard', 'sorcerer', 'bard', 'druid', 'warlock'], damage: null, description: 'Salv. SAB o el objetivo te considera amistoso.' },
  { id: 'speak-with-animals', name: 'Hablar con los animales', level: 1, school: 'Adivinación', classes: ['druid', 'bard', 'ranger'], damage: null, description: 'Comprende y habla con bestias (ritual).' },
  { id: 'hex', name: 'Maleficio', level: 1, school: 'Encantamiento', classes: ['warlock'], damage: '1d6', description: 'Daño necrótico extra (1d6) y desventaja en una característica.' },
  { id: 'identify', name: 'Identificar', level: 1, school: 'Adivinación', classes: ['wizard', 'bard'], damage: null, description: 'Conoce las propiedades de un objeto mágico (ritual).' },
];
