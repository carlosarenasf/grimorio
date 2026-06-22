/**
 * TS mirror of the key color tokens defined in tokens.css (DESIGN_SPEC.md §3).
 * Keep hex values in sync with tokens.css manually — there is no build-time
 * extraction step for this small token set.
 */

export const colors = {
  void: '#14121C',
  surface: '#1E1B2A',
  raised: '#2A2640',
  parchment: '#E8E2D0',
  arcane: '#C9A227',
  ember: '#B4452E',
  sage: '#7C9A82',
  frost: '#5E84A6',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Semantic roles used across the app (DESIGN_SPEC.md §3, §6):
 * - active  -> arcane: turno activo / acción primaria / crítico.
 * - dm_only -> frost: información visible solo para el máster.
 * - damage  -> ember: daño, HP bajo, peligro.
 * - heal    -> sage: curación, estados positivos.
 */
export type ColorRole = 'active' | 'dm_only' | 'damage' | 'heal';

const roleToColor: Record<ColorRole, string> = {
  active: colors.arcane,
  dm_only: colors.frost,
  damage: colors.ember,
  heal: colors.sage,
};

/** Resolve a semantic UI role (active/dm_only/damage/heal) to its hex token. */
export function getRoleColor(role: ColorRole): string {
  return roleToColor[role];
}
