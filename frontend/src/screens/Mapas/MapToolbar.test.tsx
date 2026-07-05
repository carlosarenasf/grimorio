import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapToolbar } from './MapToolbar';
import type { TileDef } from './tiles';

const sampleTiles: TileDef[] = [
  {
    id: 'test_tree',
    name: 'Árbol',
    category: 'bosque',
    svg: '<svg viewBox="0 0 32 32"></svg>',
    width: 32,
    height: 32,
  },
  {
    id: 'test_rock',
    name: 'Roca',
    category: 'bosque',
    svg: '<svg viewBox="0 0 32 32"></svg>',
    width: 32,
    height: 32,
  },
  {
    id: 'test_door',
    name: 'Puerta',
    category: 'dungeon',
    svg: '<svg viewBox="0 0 32 32"></svg>',
    width: 32,
    height: 32,
  },
];

describe('MapToolbar', () => {
  it('muestra las categorías como cabeceras colapsables', () => {
    render(<MapToolbar tiles={sampleTiles} onSelectTile={vi.fn()} />);
    expect(screen.getByRole('button', { name: /bosque/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dungeon/i })).toBeInTheDocument();
  });

  it('al clickar una categoría se expanden sus tiles', async () => {
    const user = userEvent.setup();
    render(<MapToolbar tiles={sampleTiles} onSelectTile={vi.fn()} />);

    // Inicialmente colapsado: los tiles no aparecen como draggable
    expect(screen.queryByRole('img', { name: 'Árbol' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /bosque/i }));

    expect(screen.getByRole('img', { name: 'Árbol' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Roca' })).toBeInTheDocument();
    // La otra categoría sigue colapsada
    expect(screen.queryByRole('img', { name: 'Puerta' })).not.toBeInTheDocument();
  });

  it('el buscador filtra tiles por nombre en todas las categorías', async () => {
    const user = userEvent.setup();
    render(<MapToolbar tiles={sampleTiles} onSelectTile={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/buscar tile/i), 'puer');

    expect(screen.getByRole('img', { name: 'Puerta' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Árbol' })).not.toBeInTheDocument();
  });

  it('al clickar un tile llama a onSelectTile con el tile', async () => {
    const user = userEvent.setup();
    const onSelectTile = vi.fn();
    render(<MapToolbar tiles={sampleTiles} onSelectTile={onSelectTile} />);

    await user.click(screen.getByRole('button', { name: /bosque/i }));
    await user.click(screen.getByRole('img', { name: 'Árbol' }));

    expect(onSelectTile).toHaveBeenCalledWith(sampleTiles[0]);
  });

  it('el tile seleccionado se marca con aria-pressed y clase de activo', async () => {
    const user = userEvent.setup();
    render(<MapToolbar tiles={sampleTiles} selectedTileId="test_tree" onSelectTile={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /bosque/i }));
    const treeBtn = screen.getByRole('button', { name: 'Árbol' });
    expect(treeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(treeBtn.className).toMatch(/map-tile-item--selected/);
  });
});