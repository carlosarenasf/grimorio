import type { MasterSnapshot } from './types';

export interface SessionBarProps {
  snapshot: MasterSnapshot;
  activeName: string | null;
}

/**
 * Top session bar (DESIGN_SPEC.md §5/§6): room/round on the left, the
 * always-visible turn indicator ("Turno de X") and the "Vista de máster" badge.
 */
export function SessionBar({ snapshot, activeName }: SessionBarProps) {
  const { combat } = snapshot;
  return (
    <header className="vm-session-bar" aria-label="Barra de sesión">
      <div className="vm-session-bar__room">
        <p className="eyebrow">Sala</p>
        <p className="vm-session-bar__room-name font-display">
          {snapshot.campaignId}
        </p>
      </div>
      <div className="vm-session-bar__turn" aria-live="polite">
        <span className="tabular-nums vm-session-bar__round">
          {combat.active ? `Ronda ${combat.round}` : 'Sin combate'}
        </span>
        {activeName ? (
          <span className="vm-session-bar__active-turn">Turno de {activeName}</span>
        ) : (
          <span className="vm-session-bar__active-turn">Esperando combate</span>
        )}
      </div>
      <span className="vm-session-bar__badge" aria-label="Vista de máster">
        Vista de máster
      </span>
    </header>
  );
}
