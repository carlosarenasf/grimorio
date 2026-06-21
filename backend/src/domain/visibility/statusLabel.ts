/**
 * Derives the public HP status label shown to players for combatants whose
 * real HP is hidden (`hpVisibility === 'dm_only'`). Never reveals the
 * underlying numbers — only a coarse bucket of the current/max ratio.
 */
import type { HpStatusLabel } from '@grimorio/shared/wire';

export function hpStatusLabel(currentHp: number, maxHp: number): HpStatusLabel {
  const ratio = currentHp / maxHp;
  if (ratio <= 0) return 'Caído';
  if (ratio <= 0.33) return 'Malherido';
  if (ratio <= 0.66) return 'Herido';
  return 'Intacto';
}
