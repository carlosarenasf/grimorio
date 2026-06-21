/**
 * Curated rules-reference data adapted from the System Reference Document 5.2
 * ("SRD 5.2"), available under the Creative Commons Attribution 4.0
 * International License (CC-BY-4.0): https://creativecommons.org/licenses/by/4.0/
 * SRD 5.2 © Wizards of the Coast LLC. Spanish labels/text are an unofficial
 * fan translation for this project, not an official localisation.
 */
import type { RuleSection } from '../types.js';

/** Quick-reference sections for the DM "Vista Máster" sidebar. */
export const RULES_REFERENCE: RuleSection[] = [
  {
    id: 'economia-acciones',
    title: 'Economía de acciones',
    body:
      'En su turno, una criatura dispone de una Acción, una Acción Adicional (si algo se la concede) y Movimiento hasta su velocidad. ' +
      'También puede usar una Reacción una vez por ronda, en respuesta a un desencadenante (el suyo o el de otra criatura). ' +
      'Interactuar con un objeto del entorno (desenvainar un arma, abrir una puerta) es gratis una vez por turno; usos adicionales consumen la Acción.',
  },
  {
    id: 'clases-dificultad',
    title: 'Clases de dificultad (CD)',
    body:
      'Muy fácil 5 · Fácil 10 · Media 15 · Difícil 20 · Muy difícil 25 · Casi imposible 30. ' +
      'El Máster fija la CD según la dificultad narrativa de la tarea; el jugador suma el modificador de habilidad (y el de competencia, si aplica) a 1d20 e intenta igualar o superar la CD.',
  },
  {
    id: 'cobertura',
    title: 'Cobertura',
    body:
      'Cobertura parcial (la mitad o menos del objetivo está cubierta): +2 a la CA y a las salvaciones de Destreza del objetivo. ' +
      'Cobertura considerable (más de la mitad, p. ej. tras una aspillera): +5 a la CA y a las salvaciones de Destreza. ' +
      'Cobertura total (completamente oculto): no puede ser objetivo directo de un ataque o conjuro.',
  },
  {
    id: 'salvaciones-muerte',
    title: 'Salvaciones de muerte',
    body:
      'Al llegar a 0 PV sin morir al instante, la criatura queda inconsciente y, al inicio de cada uno de sus turnos, tira 1d20: ' +
      '10 o más es un éxito, menos de 10 es un fallo. Tres éxitos estabilizan a la criatura (en 1 PV, sigue inconsciente); tres fallos la matan. ' +
      'Un 20 natural recupera 1 PV de inmediato; un 1 natural cuenta como dos fallos. Recibir daño mientras está a 0 PV cuenta como un fallo (dos si el golpe es crítico), y el daño masivo puede matar de inmediato.',
  },
  {
    id: 'descansos',
    title: 'Descansos corto y largo',
    body:
      'Descanso corto: al menos 1 hora de actividad ligera; la criatura puede gastar Dados de Golpe para recuperar PV (1d_+ mod. de Constitución cada uno). ' +
      'Descanso largo: al menos 8 horas, de las cuales puede dormir o hacer actividad ligera durante un máximo de 2; recupera todos los PV y la mitad de sus Dados de Golpe totales (mínimo 1). ' +
      'Solo se puede beneficiar de un descanso largo una vez cada 24 horas, y requiere al menos 1 PV al empezarlo.',
  },
];
