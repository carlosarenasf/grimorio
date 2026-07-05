import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapTopBar } from './MapTopBar';
import type { MapDTO } from '../../net';

function makeMap(overrides: Partial<MapDTO> = {}): MapDTO {
  return {
    id: 'm1',
    campaignId: 'c1',
    name: 'Bosque',
    type: 'exterior',
    environment: 'bosque',
    width: 20,
    height: 15,
    gridSize: 32,
    layers: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('MapTopBar', () => {
  it('muestra los tres modos de edición (seleccionar/pintar/borrar)', () => {
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="select"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={vi.fn()}
        onChangeMode={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /seleccionar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pintar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /borrar/i })).toBeInTheDocument();
  });

  it('el modo activo se marca con aria-pressed y clase de activo', () => {
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="paint"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={vi.fn()}
        onChangeMode={vi.fn()}
      />,
    );

    const paintBtn = screen.getByRole('button', { name: /pintar/i });
    expect(paintBtn).toHaveAttribute('aria-pressed', 'true');
    expect(paintBtn.className).toMatch(/map-mode-btn--active/);
  });

  it('al clickar un modo llama a onChangeMode con ese id', async () => {
    const user = userEvent.setup();
    const onChangeMode = vi.fn();
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="select"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={vi.fn()}
        onChangeMode={onChangeMode}
      />,
    );

    await user.click(screen.getByRole('button', { name: /borrar/i }));
    expect(onChangeMode).toHaveBeenCalledWith('erase');
  });

  it('cambiar el input de ancho dispara onChangeSize', async () => {
    const onChangeSize = vi.fn();
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="select"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={onChangeSize}
        onChangeMode={vi.fn()}
      />,
    );

    const widthInput = screen.getByLabelText(/ancho del mapa en celdas/i);
    fireEvent.change(widthInput, { target: { value: '30' } });
    expect(onChangeSize).toHaveBeenLastCalledWith(30, 15);
  });

  it('cambiar el input de alto dispara onChangeSize', () => {
    const onChangeSize = vi.fn();
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="select"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={onChangeSize}
        onChangeMode={vi.fn()}
      />,
    );

    const heightInput = screen.getByLabelText(/alto del mapa en celdas/i);
    fireEvent.change(heightInput, { target: { value: '22' } });
    expect(onChangeSize).toHaveBeenLastCalledWith(20, 22);
  });

  it('al clickar "Guardar" estando dirty llama a onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <MapTopBar
        map={makeMap()}
        dirty
        paintMode="select"
        onBack={vi.fn()}
        onSave={onSave}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={vi.fn()}
        onChangeMode={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('Guardar está desactivado cuando no hay cambios', () => {
    render(
      <MapTopBar
        map={makeMap()}
        dirty={false}
        paintMode="select"
        onBack={vi.fn()}
        onSave={vi.fn()}
        onExportPNG={vi.fn()}
        onRename={vi.fn()}
        onChangeSize={vi.fn()}
        onChangeMode={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });
});