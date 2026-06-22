import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '../../design';
import type { CampaignDTO } from '../../net';

export interface InviteModalProps {
  campaign: CampaignDTO;
  /** Base URL used to build the copyable invite link, e.g. window.location.origin. */
  origin?: string;
  onClose: () => void;
}

function inviteLink(origin: string, joinCode: string): string {
  return `${origin}/unirse/${joinCode}`;
}

/**
 * Invite modal (DESIGN_SPEC.md §4.b Campañas): copyable link + big join
 * code. Used both right after creating a campaign and from a card's
 * "Invitar" action. Focuses the copy button on open; Escape closes.
 */
export function InviteModal({
  campaign,
  origin = 'https://grimorio.app',
  onClose,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const link = inviteLink(origin, campaign.joinCode);

  useEffect(() => {
    linkInputRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="modal-card">
        <h2 id="invite-modal-title" className="font-display modal-title">
          Invitar a {campaign.name}
        </h2>
        <p className="modal-subtitle">
          Comparte este enlace o el código para que se unan a la partida.
        </p>

        <div className="invite-code" data-testid="invite-code">
          {campaign.joinCode}
        </div>

        <label className="eyebrow invite-link-label" htmlFor="invite-link-input">
          Enlace de invitación
        </label>
        <div className="invite-link-row">
          <input
            id="invite-link-input"
            ref={linkInputRef}
            className="field__control invite-link-input"
            value={link}
            readOnly
          />
          <Button type="button" variant="secondary" onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
