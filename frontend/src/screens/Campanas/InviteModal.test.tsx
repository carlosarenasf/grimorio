import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteModal } from './InviteModal';
import type { CampaignDTO } from '../../net';

const CAMPAIGN: CampaignDTO = {
  id: 'c1',
  ownerId: 'u1',
  name: 'La Cripta de Ashryn',
  tagline: '',
  status: 'active',
  joinCode: 'AB12CD',
  members: [{ userId: 'u1', role: 'dm' }],
  characterIds: [],
  sessionCount: 1,
  createdAt: new Date().toISOString(),
};

describe('InviteModal', () => {
  it('shows the big join code and a copyable link', () => {
    render(
      <InviteModal
        campaign={CAMPAIGN}
        origin="https://grimorio.app"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('invite-code')).toHaveTextContent('AB12CD');
    expect(screen.getByLabelText('Enlace de invitación')).toHaveValue(
      'https://grimorio.app/unirse/AB12CD',
    );
  });

  it('focuses the first field (the link input) on open', () => {
    render(
      <InviteModal campaign={CAMPAIGN} onClose={vi.fn()} />,
    );
    expect(screen.getByLabelText('Enlace de invitación')).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<InviteModal campaign={CAMPAIGN} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cerrar is clicked', async () => {
    const onClose = vi.fn();
    render(<InviteModal campaign={CAMPAIGN} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('copies the invite link to the clipboard when Copiar is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <InviteModal
        campaign={CAMPAIGN}
        origin="https://grimorio.app"
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(writeText).toHaveBeenCalledWith('https://grimorio.app/unirse/AB12CD');
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument();
  });
});
