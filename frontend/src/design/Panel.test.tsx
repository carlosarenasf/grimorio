import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Panel } from './Panel';

describe('Panel', () => {
  it('renders the eyebrow and title', () => {
    render(
      <Panel eyebrow="Combate" title="Combatientes">
        <p>contenido</p>
      </Panel>,
    );

    expect(screen.getByText('Combatientes')).toBeInTheDocument();
    expect(screen.getByText('Combate')).toBeInTheDocument();
  });

  it('renders the body content', () => {
    render(
      <Panel title="Bestiario">
        <p>Garras y colmillos</p>
      </Panel>,
    );

    expect(screen.getByText('Garras y colmillos')).toBeInTheDocument();
  });

  it('renders the actions slot in the header', async () => {
    const onAction = vi.fn();
    render(
      <Panel
        title="Dados"
        actions={<button onClick={onAction}>Tirar</button>}
      >
        <p>contenido</p>
      </Panel>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows the dmOnly lock/frost affordance when dmOnly is set', () => {
    render(
      <Panel title="Notas del máster" dmOnly>
        <p>secreto</p>
      </Panel>,
    );

    expect(screen.getByTestId('panel-lock-icon')).toBeInTheDocument();
    expect(screen.getByLabelText(/solo.*máster/i)).toBeInTheDocument();
  });

  it('does not show the lock affordance when dmOnly is false', () => {
    render(
      <Panel title="Inventario">
        <p>contenido</p>
      </Panel>,
    );

    expect(screen.queryByTestId('panel-lock-icon')).not.toBeInTheDocument();
  });

  it('renders the empty state slot when provided and no children are passed', () => {
    render(
      <Panel
        title="Historial"
        empty={<p>Aún no hay tiradas. Lanza los dados para empezar.</p>}
      />,
    );

    expect(
      screen.getByText('Aún no hay tiradas. Lanza los dados para empezar.'),
    ).toBeInTheDocument();
  });

  it('prefers children over the empty slot when both are given', () => {
    render(
      <Panel title="Historial" empty={<p>vacío</p>}>
        <p>una tirada</p>
      </Panel>,
    );

    expect(screen.getByText('una tirada')).toBeInTheDocument();
    expect(screen.queryByText('vacío')).not.toBeInTheDocument();
  });
});
