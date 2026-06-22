import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RulesPanel } from './RulesPanel';

describe('RulesPanel', () => {
  it('shows the default rules in read mode', () => {
    render(<RulesPanel />);
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('toggling edit mode reveals add/remove controls, and adding a rule appends it', async () => {
    render(<RulesPanel />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    const input = screen.getByLabelText(/nueva norma/i);
    await userEvent.type(input, 'La cámara no puede atacar dos veces');
    await userEvent.click(screen.getByRole('button', { name: /añadir/i }));

    expect(screen.getByText('La cámara no puede atacar dos veces')).toBeInTheDocument();
  });

  it('removing a rule in edit mode takes it out of the list', async () => {
    render(<RulesPanel />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    const items = screen.getAllByRole('listitem');
    const firstText = items[0].textContent;
    const removeButtons = screen.getAllByRole('button', { name: /quitar norma/i });
    await userEvent.click(removeButtons[0]);

    expect(screen.queryByText(firstText ?? '')).not.toBeInTheDocument();
  });

  it('toggling back to read mode hides the editing controls', async () => {
    render(<RulesPanel />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    await userEvent.click(screen.getByRole('button', { name: /listo|guardar/i }));

    expect(screen.queryByLabelText(/nueva norma/i)).not.toBeInTheDocument();
  });
});
