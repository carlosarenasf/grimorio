export interface TurnBannerProps {
  /** Whether the active combatant on the table is the viewer's own character. */
  isYourTurn: boolean;
  /** Display name of the currently active combatant, or null if none. */
  activeName: string | null;
  round: number;
  combatActive: boolean;
}

/**
 * Turn banner (DESIGN_SPEC.md §5/§6): "El turno es el rey" — at all times it
 * must be unmistakable whose turn it is. "Es tu turno" glows arcane; "Turno
 * de X" is the neutral state for everyone else's turn.
 */
export function TurnBanner({ isYourTurn, activeName, round, combatActive }: TurnBannerProps) {
  const status = !combatActive
    ? 'Sin combate'
    : isYourTurn
      ? 'Es tu turno'
      : activeName
        ? `Turno de ${activeName}`
        : 'Esperando combate';

  return (
    <header
      className={[
        'vj-turn-banner',
        isYourTurn ? 'vj-turn-banner--yours' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      <span className="vj-turn-banner__status font-display">{status}</span>
      {combatActive ? (
        <span className="vj-turn-banner__round tabular-nums">Ronda {round}</span>
      ) : null}
    </header>
  );
}
