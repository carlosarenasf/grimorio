import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapasScreen } from './MapasScreen';
import type { ApiClient, MapDTO } from '../../net';

vi.mock('react-konva', () => import('./__mocks__/react-konva'));
vi.mock('use-image', () => ({
  default: () => [undefined, 'loaded'],
}));

function makeMap(overrides: Partial<MapDTO> = {}): MapDTO {
  return {
    id: 'm1',
    campaignId: 'c1',
    name: 'Bosque Oscuro',
    type: 'exterior',
    environment: 'bosque',
    width: 20,
    height: 15,
    gridSize: 32,
    layers: [
      {
        id: 'lay1',
        name: 'Suelo',
        visible: true,
        elements: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listCampaigns: vi.fn().mockResolvedValue([
      {
        id: 'c1',
        ownerId: 'u1',
        name: 'La Cripta',
        tagline: '',
        status: 'active',
        joinCode: 'AB12CD',
        members: [],
        characterIds: [],
        sessionCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]),
    listMaps: vi.fn().mockResolvedValue([]),
    getMap: vi.fn(),
    createMap: vi.fn(),
    updateMap: vi.fn(),
    deleteMap: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

describe('MapasScreen', () => {
  it('muestra el estado de carga y luego la biblioteca vacía', async () => {
    const api = makeApi();
    render(<MapasScreen api={api} campaignId="c1" onBack={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);

    expect(await screen.findByText(/no hay mapas/i)).toBeInTheDocument();
    expect(api.listMaps).toHaveBeenCalledWith('c1');
  });

  it('muestra los mapas existentes como tarjetas', async () => {
    const m1 = makeMap({ id: 'm1', name: 'Bosque Oscuro', type: 'exterior' });
    const m2 = makeMap({ id: 'm2', name: 'Dungeon Nivel 1', type: 'interior' });
    const api = makeApi({ listMaps: vi.fn().mockResolvedValue([m1, m2]) });

    render(<MapasScreen api={api} campaignId="c1" onBack={vi.fn()} />);

    expect(await screen.findByText('Bosque Oscuro')).toBeInTheDocument();
    expect(screen.getByText('Dungeon Nivel 1')).toBeInTheDocument();
  });

  it('muestra el botón "Crear nuevo mapa"', async () => {
    const api = makeApi();
    render(<MapasScreen api={api} campaignId="c1" onBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /crear nuevo mapa/i })).toBeInTheDocument();
  });

  it('al hacer click en "Crear nuevo" abre el formulario y al confirmar crea el mapa', async () => {
    const user = userEvent.setup();
    const created = makeMap({ id: 'm9', name: 'Castillo Sombrío', type: 'exterior' });
    const createMap = vi.fn().mockResolvedValue(created);
    const api = makeApi({ createMap });

    render(<MapasScreen api={api} campaignId="c1" onBack={vi.fn()} />);

    await screen.findByText(/no hay mapas/i);
    await user.click(screen.getByRole('button', { name: /crear nuevo mapa/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), 'Castillo Sombrío');

    await user.click(screen.getByRole('button', { name: 'Crear mapa' }));

    await waitFor(() => {
      expect(createMap).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Castillo Sombrío' }));
    });
  });

  it('al hacer click en una tarjeta de mapa abre el editor', async () => {
    const user = userEvent.setup();
    const m1 = makeMap({ id: 'm-open', name: 'Mazmorra Test' });
    const api = makeApi({ listMaps: vi.fn().mockResolvedValue([m1]) });

    render(<MapasScreen api={api} campaignId="c1" onBack={vi.fn()} />);

    const cardLink = await screen.findByText('Mazmorra Test');
    const card = cardLink.closest('[data-testid="map-card"]') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: /abrir/i }));

    expect(await screen.findByTestId('map-editor')).toBeInTheDocument();
  });

  it('el botón "Volver" llama a onBack', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const api = makeApi();

    render(<MapasScreen api={api} campaignId="c1" onBack={onBack} />);

    await screen.findByText(/no hay mapas/i);
    await user.click(screen.getByRole('button', { name: /volver/i }));

    expect(onBack).toHaveBeenCalled();
  });
});