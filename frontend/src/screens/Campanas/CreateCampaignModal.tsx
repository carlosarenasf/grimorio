import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Button, Field } from '../../design';
import type { ApiClient, CampaignDTO } from '../../net';

export interface CreateCampaignModalProps {
  api: ApiClient;
  onClose: () => void;
  /** Called once the campaign has been created successfully. */
  onCreated: (campaign: CampaignDTO) => void;
}

/**
 * Create-campaign modal (DESIGN_SPEC.md §4.b Campañas): name (required) +
 * tagline (optional). Focuses the name field on open; Escape closes.
 */
export function CreateCampaignModal({
  api,
  onClose,
  onCreated,
}: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const nameValid = name.trim().length > 0;

  useEffect(() => {
    const firstField = formRef.current?.querySelector<HTMLElement>(
      'input, textarea, select',
    );
    firstField?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nameValid || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const campaign = await api.createCampaign({
        name: name.trim(),
        tagline: tagline.trim() || undefined,
      });
      onCreated(campaign);
    } catch {
      setError('No se ha podido crear la campaña. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-campaign-title"
      onKeyDown={handleKeyDown}
    >
      <div className="modal-card">
        <h2 id="create-campaign-title" className="font-display modal-title">
          Nueva campaña
        </h2>

        <form onSubmit={handleSubmit} ref={formRef}>
          <Field
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Field
            label="Lema (opcional)"
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            hint="Una frase corta que describa la partida."
          />

          {error ? (
            <p className="modal-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!nameValid || submitting}>
              {submitting ? 'Creando…' : 'Crear campaña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
