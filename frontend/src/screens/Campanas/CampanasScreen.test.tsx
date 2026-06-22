import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampanasScreen } from './CampanasScreen';
import type { ApiClient, CampaignDTO } from '../../net';

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    listCampaigns: vi.fn().mockResolvedValue([]),
    createCampaign: vi.fn(),
    invite: vi.fn(),
    joinByCode: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    getSnapshot: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

function makeCampaign(overrides: Partial<CampaignDTO> = {}): CampaignDTO {
  return {
    id: 'c1',
    ownerId: 'u1',
    name: 'La Cripta de Ashryn',
    tagline: 'Una incursión en las ruinas olvidadas',
    status: 'active',
    joinCode: 'AB12CD',
    members: [
      { userId: 'u1', role: 'dm' },
      { userId: 'u2', role: 'player' },
    ],
    characterIds: [],
    sessionCount: 3,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('CampanasScreen', () => {
  it('shows a loading state, then the fetched cards', async () => {
    const campaign = makeCampaign();
    const api = makeApi({ listCampaigns: vi.fn().mockResolvedValue([campaign]) });

    render(<CampanasScreen api={api} onEnter={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);

    expect(await screen.findByText('La Cripta de Ashryn')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.getByText('AB12CD')).toBeInTheDocument();
  });

  it('shows the empty-state invitation to create a campaign when the list is empty', async () => {
    const api = makeApi({ listCampaigns: vi.fn().mockResolvedValue([]) });
    render(<CampanasScreen api={api} onEnter={vi.fn()} />);

    expect(
      await screen.findByText(/aún no tienes campañas/i),
    ).toBeInTheDocument();
    // Two "+ Nueva campaña" buttons can coexist (top bar + empty state CTA).
    expect(
      screen.getAllByRole('button', { name: /\+ nueva campaña/i }).length,
    ).toBeGreaterThan(0);
  });

  it('renders players and sessions counters for a card', async () => {
    const campaign = makeCampaign({ sessionCount: 5 });
    const api = makeApi({ listCampaigns: vi.fn().mockResolvedValue([campaign]) });
    render(<CampanasScreen api={api} onEnter={vi.fn()} />);

    const card = await screen.findByText('La Cripta de Ashryn');
    const cardEl = card.closest('li') as HTMLElement;
    expect(within(cardEl).getByText('2')).toBeInTheDocument(); // members
    expect(within(cardEl).getByText('5')).toBeInTheDocument(); // sessions
  });

  it('calls onEnter with the campaign id when "Entrar" is clicked', async () => {
    const campaign = makeCampaign();
    const api = makeApi({ listCampaigns: vi.fn().mockResolvedValue([campaign]) });
    const onEnter = vi.fn();
    render(<CampanasScreen api={api} onEnter={onEnter} />);

    await screen.findByText('La Cripta de Ashryn');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onEnter).toHaveBeenCalledWith('c1');
  });

  it('opens the create modal and runs the create -> invite flow', async () => {
    const api = makeApi({ listCampaigns: vi.fn().mockResolvedValue([]) });
    const created = makeCampaign({ id: 'c2', name: 'Ecos de Valgard', joinCode: 'ZZ99XX' });
    (api.createCampaign as ReturnType<typeof vi.fn>).mockResolvedValue(created);

    render(<CampanasScreen api={api} onEnter={vi.fn()} />);

    await screen.findByText(/aún no tienes campañas/i);
    const user = userEvent.setup();
    await user.click(
      screen.getAllByRole('button', { name: /\+ nueva campaña/i })[0],
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), 'Ecos de Valgard');
    await user.click(screen.getByRole('button', { name: 'Crear campaña' }));

    await waitFor(() => {
      expect(api.createCampaign).toHaveBeenCalledWith({
        name: 'Ecos de Valgard',
        tagline: undefined,
      });
    });

    expect(await screen.findByTestId('invite-code')).toHaveTextContent('ZZ99XX');
  });

  it('opens the invite modal showing the existing code when "Invitar" is clicked', async () => {
    const campaign = makeCampaign({ joinCode: 'JOIN01' });
    const api = makeApi({
      listCampaigns: vi.fn().mockResolvedValue([campaign]),
      invite: vi.fn().mockResolvedValue(campaign),
    });

    render(<CampanasScreen api={api} onEnter={vi.fn()} />);
    await screen.findByText('La Cripta de Ashryn');

    await userEvent.click(screen.getByRole('button', { name: 'Invitar' }));

    expect(await screen.findByTestId('invite-code')).toHaveTextContent('JOIN01');
  });
});
