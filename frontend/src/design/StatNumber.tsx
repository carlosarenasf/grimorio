import type { ColorRole } from './tokens';

export interface StatNumberProps {
  /** The numeric value to display (HP, initiative, ability modifiers...). */
  value: number;
  /** Accessible label, e.g. "HP", "Iniciativa", "MOD Fuerza". */
  label: string;
  /** Show an explicit +/- sign (typical for ability modifiers). */
  signed?: boolean;
  /** Optional semantic color role (active/dm_only/damage/heal), §3/§6. */
  role?: ColorRole;
  className?: string;
}

/**
 * Tabular-nums monospace number for HP/initiative/modifiers (DESIGN_SPEC.md
 * §3/§8): numbers that change live must align and never "jump".
 */
export function StatNumber({
  value,
  label,
  signed = false,
  role,
  className,
}: StatNumberProps) {
  const display = signed && value > 0 ? `+${value}` : String(value);

  const classes = [
    'tabular-nums',
    'stat-number',
    role ? `stat-number--${role}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-label={label}>
      {display}
    </span>
  );
}
