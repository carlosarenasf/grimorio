import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCampaignModal } from './CreateCampaignModal';
import type { ApiClient, CampaignDTO } from '../../net';

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    listCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    invite: vi.fn(),
    joinByCode: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    getSnapshot: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

const CAMPAIGN: CampaignDTO = {
  id: 'c1',
  ownerId: 'u1',
  name: 'Nueva Aventura',
  tagline: '',
  status: 'planning',
  joinCode: 'CODE01',
  members: [{ userId: 'u1', role: 'dm' }],
  characterIds: [],
  sessionCount: 0,
  createdAt: new Date().toISOString(),
};

describe('CreateCampaignModal', () => {
  it('focuses the name field on open', () => {
    const api = makeApi();
    render(
      <CreateCampaignModal api={api} onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    expect(screen.getByLabelText('Nombre')).toHaveFocus();
  });

  it('keeps submit disabled until a name is entered', async () => {
    const api = makeApi();
    render(
      <CreateCampaignModal api={api} onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    const submit = screen.getByRole('button', { name: 'Crear campaña' });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Nombre'), 'Nueva Aventura');
    expect(submit).toBeEnabled();
  });

  it('calls api.createCampaign with name and tagline, then onCreated', async () => {
    const createCampaign = vi.fn().mockResolvedValue(CAMPAIGN);
    const api = makeApi({ createCampaign });
    const onCreated = vi.fn();

    render(
      <CreateCampaignModal api={api} onClose={vi.fn()} onCreated={onCreated} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Nombre'), 'Nueva Aventura');
    await user.type(
      screen.getByLabelText('Lema (opcional)'),
      'Una historia por contar',
    );
    await user.click(screen.getByRole('button', { name: 'Crear campaña' }));

    await waitFor(() => {
      expect(createCampaign).toHaveBeenCalledWith({
        name: 'Nueva Aventura',
        tagline: 'Una historia por contar',
      });
    });
    expect(onCreated).toHaveBeenCalledWith(CAMPAIGN);
  });

  it('calls onClose when Escape is pressed', async () => {
    const api = makeApi();
    const onClose = vi.fn();
    render(
      <CreateCampaignModal api={api} onClose={onClose} onCreated={vi.fn()} />,
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const api = makeApi();
    const onClose = vi.fn();
    render(
      <CreateCampaignModal api={api} onClose={onClose} onCreated={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error message if createCampaign rejects', async () => {
    const createCampaign = vi.fn().mockRejectedValue(new Error('boom'));
    const api = makeApi({ createCampaign });

    render(
      <CreateCampaignModal api={api} onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    await userEvent.type(screen.getByLabelText('Nombre'), 'Nueva Aventura');
    await userEvent.click(screen.getByRole('button', { name: 'Crear campaña' }));

    expect(
      await screen.findByText(/no se ha podido crear la campaña/i),
    ).toBeInTheDocument();
  });
});
