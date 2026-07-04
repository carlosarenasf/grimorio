import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapLayersPanel } from './MapLayersPanel';
import type { MapLayerDTO } from '../../net';

function makeLayer(overrides: Partial<MapLayerDTO> = {}): MapLayerDTO {
  return {
    id: 'lay1',
    name: 'Suelo',
    visible: true,
    elements: [],
    ...overrides,
  };
}

describe('MapLayersPanel', () => {
  it('muestra las capas con su nombre', () => {
    const layers = [makeLayer({ id: 'l1', name: 'Suelo' }), makeLayer({ id: 'l2', name: 'Objetos' })];
    render(
      <MapLayersPanel
        layers={layers}
        selectedElementId={null}
        onToggleVisible={vi.fn()}
        onAddLayer={vi.fn()}
        onDeleteLayer={vi.fn()}
      />,
    );

    expect(screen.getByText('Suelo')).toBeInTheDocument();
    expect(screen.getByText('Objetos')).toBeInTheDocument();
  });

  it('al clickar el toggle de visibilidad llama a onToggleVisible con el id', async () => {
    const user = userEvent.setup();
    const onToggleVisible = vi.fn();
    render(
      <MapLayersPanel
        layers={[makeLayer({ id: 'l1', name: 'Suelo', visible: true })]}
        selectedElementId={null}
        onToggleVisible={onToggleVisible}
        onAddLayer={vi.fn()}
        onDeleteLayer={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('switch', { name: /suelo/i }));

    expect(onToggleVisible).toHaveBeenCalledWith('l1');
  });

  it('el botón "Añadir capa" llama a onAddLayer', async () => {
    const user = userEvent.setup();
    const onAddLayer = vi.fn();
    render(
      <MapLayersPanel
        layers={[makeLayer()]}
        selectedElementId={null}
        onToggleVisible={vi.fn()}
        onAddLayer={onAddLayer}
        onDeleteLayer={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /añadir capa/i }));

    expect(onAddLayer).toHaveBeenCalled();
  });
});