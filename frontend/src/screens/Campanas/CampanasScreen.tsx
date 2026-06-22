import { useEffect, useState } from 'react';
import '../../design/tokens.css';
import '../../design/components.css';
import { Button } from '../../design';
import type { ApiClient, CampaignDTO, Principal } from '../../net';
import { CreateCampaignModal } from './CreateCampaignModal';
import { InviteModal } from './InviteModal';
import './campanas.css';

export interface CampanasScreenProps {
  /** Injected API client (no hidden singleton — see screens scope rules). */
  api: ApiClient;
  /** Current principal, shown in the top bar. */
  principal?: Principal | null;
  /** Called with the campaign id when "Entrar" is pressed on a card. */
  onEnter: (campaignId: string) => void;
  /** Called once a new campaign has been created (after the invite modal flow starts). */
  onCreated?: (campaign: CampaignDTO) => void;
  /** Called with a join code the user typed in the "Unirse con código" field. */
  onJoinByCode?: (code: string) => void;
  /** Base URL for invite links, defaults to window.location.origin when available. */
  origin?: string;
}

const STATUS_LABEL: Record<CampaignDTO['status'], string> = {
  active: 'En curso',
  paused: 'En pausa',
  planning: 'Preparando',
};

function defaultOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://grimorio.app';
}

/**
 * Campañas screen (DESIGN_SPEC.md §4.b): top bar with user + "Campañas"
 * title + "+ Nueva campaña", a grid of campaign cards (status chip, join
 * code, players/sessions counters, Entrar/Invitar), create + invite modals.
 */
export function CampanasScreen({
  api,
  principal,
  onEnter,
  onCreated,
  onJoinByCode,
  origin,
}: CampanasScreenProps) {
  const [campaigns, setCampaigns] = useState<CampaignDTO[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCampaign, setInviteCampaign] = useState<CampaignDTO | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const resolvedOrigin = origin ?? defaultOrigin();

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    api
      .listCampaigns()
      .then((list) => {
        if (!cancelled) setCampaigns(list);
      })
      .catch(() => {
        if (!cancelled) {
          setCampaigns([]);
          setLoadError('No se han podido cargar tus campañas.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  function handleCreated(campaign: CampaignDTO) {
    setCampaigns((prev) => (prev ? [campaign, ...prev] : [campaign]));
    setShowCreate(false);
    setInviteCampaign(campaign);
    onCreated?.(campaign);
  }

  async function handleInvite(campaign: CampaignDTO) {
    try {
      const updated = await api.invite(campaign.id);
      setCampaigns((prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
      );
      setInviteCampaign(updated);
    } catch {
      setInviteCampaign(campaign);
    }
  }

  const isLoading = campaigns === null;
  const isEmpty = campaigns !== null && campaigns.length === 0;

  return (
    <div className="campanas-screen">
      <header className="campanas-topbar">
        <span className="campanas-topbar__user">
          {principal ? principal.displayName : 'Invitado'}
        </span>
        <h1 className="font-display campanas-topbar__title">Campañas</h1>
        {onJoinByCode ? (
          <form
            className="campanas-join"
            onSubmit={(e) => {
              e.preventDefault();
              const code = joinCode.trim();
              if (code) onJoinByCode(code.toUpperCase());
            }}
          >
            <input
              className="campanas-join__input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Código de invitación"
              aria-label="Código de invitación"
            />
            <Button type="submit" variant="secondary" disabled={!joinCode.trim()}>
              Unirse
            </Button>
          </form>
        ) : null}
        <Button type="button" onClick={() => setShowCreate(true)}>
          + Nueva campaña
        </Button>
      </header>

      <main className="campanas-body">
        {isLoading ? (
          <p className="campanas-loading" role="status">
            Cargando tus campañas…
          </p>
        ) : isEmpty ? (
          <div className="campanas-empty">
            <p className="campanas-empty__title">
              Aún no tienes campañas. Crea la primera para empezar a jugar.
            </p>
            <Button type="button" onClick={() => setShowCreate(true)}>
              + Nueva campaña
            </Button>
          </div>
        ) : (
          <>
            {loadError ? <p className="campanas-error">{loadError}</p> : null}
            <ul className="campanas-grid">
              {campaigns?.map((campaign) => (
                <li key={campaign.id} className="campaign-card">
                  <div className="campaign-card__header">
                    <h2 className="font-display campaign-card__name">
                      {campaign.name}
                    </h2>
                    <span
                      className={`status-chip status-chip--${campaign.status}`}
                    >
                      {STATUS_LABEL[campaign.status]}
                    </span>
                  </div>

                  {campaign.tagline ? (
                    <p className="campaign-card__tagline">{campaign.tagline}</p>
                  ) : null}

                  <p className="campaign-card__code">
                    Código: <span className="tabular-nums">{campaign.joinCode}</span>
                  </p>

                  <div className="campaign-card__stats">
                    <span>
                      <span className="tabular-nums">{campaign.members.length}</span>{' '}
                      jugadores
                    </span>
                    <span>
                      <span className="tabular-nums">{campaign.sessionCount}</span>{' '}
                      sesiones
                    </span>
                  </div>

                  <div className="campaign-card__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleInvite(campaign)}
                    >
                      Invitar
                    </Button>
                    <Button type="button" onClick={() => onEnter(campaign.id)}>
                      Entrar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {showCreate ? (
        <CreateCampaignModal
          api={api}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      ) : null}

      {inviteCampaign ? (
        <InviteModal
          campaign={inviteCampaign}
          origin={resolvedOrigin}
          onClose={() => setInviteCampaign(null)}
        />
      ) : null}
    </div>
  );
}
