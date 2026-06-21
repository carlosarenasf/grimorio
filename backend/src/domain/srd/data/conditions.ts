/**
 * Curated condition data adapted from the System Reference Document 5.2
 * ("SRD 5.2"), available under the Creative Commons Attribution 4.0
 * International License (CC-BY-4.0): https://creativecommons.org/licenses/by/4.0/
 * SRD 5.2 © Wizards of the Coast LLC. Spanish labels/text are an unofficial
 * fan translation for this project, not an official localisation.
 */
import type { Condition } from '../../types.js';

/** Canonical D&D 5e (2024) condition set, in SRD order. */
export const CONDITIONS: Condition[] = [
  { key: 'cegado', label: 'Cegado', color: '#6b7280' },
  { key: 'hechizado', label: 'Hechizado', color: '#a855f7' },
  { key: 'ensordecido', label: 'Ensordecido', color: '#9ca3af' },
  { key: 'asustado', label: 'Asustado', color: '#f59e0b' },
  { key: 'apresado', label: 'Apresado', color: '#78716c' },
  { key: 'incapacitado', label: 'Incapacitado', color: '#ef4444' },
  { key: 'invisible', label: 'Invisible', color: '#38bdf8' },
  { key: 'paralizado', label: 'Paralizado', color: '#dc2626' },
  { key: 'petrificado', label: 'Petrificado', color: '#57534e' },
  { key: 'envenenado', label: 'Envenenado', color: '#22c55e' },
  { key: 'derribado', label: 'Derribado', color: '#d97706' },
  { key: 'restringido', label: 'Restringido', color: '#92400e' },
  { key: 'aturdido', label: 'Aturdido', color: '#eab308' },
  { key: 'inconsciente', label: 'Inconsciente', color: '#1e293b' },
  { key: 'agotamiento', label: 'Agotamiento', color: '#7c2d12' },
];

/** Short rules-text per condition key, for tooltips/cards. */
export const CONDITION_EFFECTS: Record<string, string> = {
  cegado:
    'No puede ver y falla automáticamente cualquier prueba que requiera vista. Las tiradas de ataque contra la criatura tienen ventaja; sus tiradas de ataque tienen desventaja.',
  hechizado:
    'No puede atacar ni dirigir efectos dañinos contra el hechizador, que tiene ventaja en pruebas de Carisma para interactuar socialmente con ella.',
  ensordecido: 'No puede oír y falla automáticamente cualquier prueba que requiera oído.',
  asustado:
    'Tiene desventaja en pruebas de habilidad y tiradas de ataque mientras la fuente de su miedo esté a la vista; no puede acercarse voluntariamente a ella.',
  apresado:
    'Velocidad 0 (sin bonificadores); las tiradas de ataque contra la criatura tienen ventaja; tiene desventaja en tiradas de salvación de Destreza. Termina si quien la apresa queda incapacitado o si un efecto la aleja.',
  incapacitado:
    'No puede realizar acciones, acciones adicionales ni reacciones; no puede conjurar conjuros con componentes verbales.',
  invisible:
    'No puede ser vista sin magia o sentidos especiales. A efectos de esconderse se considera oscuridad fuerte. Las tiradas de ataque contra ella tienen desventaja; las suyas, ventaja.',
  paralizado:
    'Incapacitado y no puede moverse ni hablar; falla automáticamente las salvaciones de Fuerza y Destreza; las tiradas de ataque contra ella tienen ventaja; cualquier golpe que la alcance es crítico si el atacante está a 1,5 m.',
  petrificado:
    'Transformada junto a objetos no mágicos que lleve en sustancia inorgánica solida (normalmente piedra); peso x10; deja de envejecer; incapacitada, no puede moverse ni hablar y desconoce su entorno; las tiradas de ataque contra ella tienen ventaja; falla automáticamente las salvaciones de Fuerza y Destreza; resistencia a todo el daño; inmune a venenos y enfermedades.',
  envenenado: 'Tiene desventaja en tiradas de ataque y en pruebas de habilidad.',
  derribado:
    'Su único movimiento posible es levantarse, terminando la condición; tiene desventaja en tiradas de ataque; las tiradas de ataque contra ella tienen ventaja si el atacante está a 1,5 m, y desventaja en otro caso.',
  restringido:
    'Velocidad 0 (sin bonificadores); las tiradas de ataque contra la criatura tienen ventaja; sus tiradas de ataque tienen desventaja; tiene desventaja en salvaciones de Destreza.',
  aturdido:
    'Incapacitado, no puede moverse y solo puede hablar entrecortadamente; falla automáticamente las salvaciones de Fuerza y Destreza; las tiradas de ataque contra ella tienen ventaja.',
  inconsciente:
    'Incapacitada, no puede moverse ni hablar y desconoce su entorno; suelta lo que sostenga y cae derribada; falla automáticamente las salvaciones de Fuerza y Destreza; las tiradas de ataque contra ella tienen ventaja; cualquier golpe que la alcance es crítico si el atacante está a 1,5 m.',
  agotamiento:
    'Niveles acumulativos (1-6); cada nivel impone una penalización creciente (desventaja en pruebas, reducción de velocidad, etc.) hasta la muerte en el nivel 6. Un descanso largo con comida y agua reduce el nivel en 1.',
};
