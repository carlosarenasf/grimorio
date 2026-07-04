import { useState } from 'react';
import { Button } from '../../design';
import type { CampaignDTO } from '../../net';
import { InviteModal } from '../Campanas/InviteModal';
import type { MasterSnapshot } from './types';

export interface SessionBarProps {
  snapshot: MasterSnapshot;
  activeName: string | null;
  /** The campaign (with join code) — enables the "Invitar" button. */
  campaign?: CampaignDTO;
  /** Abre el módulo de mapas; si está ausente el botón no se muestra. */
  onOpenMap?: () => void;
}

/**
 * Top session bar (DESIGN_SPEC.md §5/§6): room/round on the left, the
 * always-visible turn indicator ("Turno de X"), an Invitar button and the
 * "Vista de máster" badge.
 */
export function SessionBar({ snapshot, activeName, campaign, onOpenMap }: SessionBarProps) {
  const { combat } = snapshot;
  const [inviteOpen, setInviteOpen] = useState(false);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://grimorio.app';

  return (
    <header className="vm-session-bar" aria-label="Barra de sesión">
      <div className="vm-session-bar__room">
        <p className="eyebrow">Sala</p>
        <p className="vm-session-bar__room-name font-display">
          {campaign?.name ?? snapshot.campaignId}
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
      <div className="vm-session-bar__actions">
        {onOpenMap ? (
          <Button variant="secondary" size="sm" onClick={onOpenMap}>
            🗺️ Mapas
          </Button>
        ) : null}
        {campaign ? (
          <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
            🔗 Invitar
          </Button>
        ) : null}
        <span className="vm-session-bar__badge" aria-label="Vista de máster">
          Vista de máster
        </span>
      </div>

      {inviteOpen && campaign ? (
        <InviteModal campaign={campaign} origin={origin} onClose={() => setInviteOpen(false)} />
      ) : null}
    </header>
  );
}
