/**
 * The action economy (DESIGN_SPEC.md §5): "¿Qué haces?" lists the 8 actions a
 * PC can take on their turn. Atacar/Conjuro are "reveal" actions — choosing
 * them lists the character's attacks/spells, each with a "Lanzar" button.
 * The rest are "simple" actions: SRD 5.2 text + a "Confirmar" that (per
 * design) may end the turn.
 */

export type ActionKey =
  | 'atacar'
  | 'conjuro'
  | 'esquivar'
  | 'esprintar'
  | 'destrabarse'
  | 'esconderse'
  | 'ayudar'
  | 'preparar';

export interface ActionDef {
  key: ActionKey;
  label: string;
  /** True for Atacar/Conjuro: reveal the character's attack list instead of SRD text. */
  reveals: 'attacks' | 'spells' | null;
  /** SRD 5.2 description shown for simple actions (null for reveal actions). */
  description: string | null;
  /** Whether confirming this action ends the current turn. */
  endsTurn: boolean;
}

export const ACTIONS: readonly ActionDef[] = [
  {
    key: 'atacar',
    label: 'Atacar',
    reveals: 'attacks',
    description: null,
    endsTurn: true,
  },
  {
    key: 'conjuro',
    label: 'Conjuro',
    reveals: 'spells',
    description: null,
    endsTurn: true,
  },
  {
    key: 'esquivar',
    label: 'Esquivar',
    reveals: null,
    description:
      'Hasta el inicio de tu próximo turno, cualquier ataque tiene desventaja contra ti si puedes ver al atacante, y tienes ventaja en las tiradas de salvación de Destreza.',
    endsTurn: true,
  },
  {
    key: 'esprintar',
    label: 'Esprintar',
    reveals: null,
    description:
      'Ganas movimiento extra para este turno igual a tu velocidad, sin contar el coste extra por terreno difícil.',
    endsTurn: true,
  },
  {
    key: 'destrabarse',
    label: 'Destrabarse',
    reveals: null,
    description:
      'Tu movimiento no provoca ataques de oportunidad durante el resto del turno.',
    endsTurn: true,
  },
  {
    key: 'esconderse',
    label: 'Esconderse',
    reveals: null,
    description:
      'Haces una prueba de Destreza (Sigilo) para intentar esconderte. Si tienes éxito, ganas la condición Oculto.',
    endsTurn: true,
  },
  {
    key: 'ayudar',
    label: 'Ayudar',
    reveals: null,
    description:
      'Ayudas a otra criatura en una tarea: esa criatura tiene ventaja en la siguiente prueba de habilidad que haga para la tarea, o concedes ventaja a su próximo ataque contra una criatura a 1,5 m de ti.',
    endsTurn: true,
  },
  {
    key: 'preparar',
    label: 'Preparar',
    reveals: null,
    description:
      'Eliges una acción y un disparador. Cuando el disparador ocurre antes del inicio de tu próximo turno, puedes usar tu reacción para realizar esa acción.',
    endsTurn: true,
  },
];

export function getAction(key: ActionKey): ActionDef {
  const found = ACTIONS.find((a) => a.key === key);
  if (!found) throw new Error(`Acción desconocida: ${key}`);
  return found;
}
