import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionEconomy } from './ActionEconomy';
import { makeYouCharacter } from './fixture';

describe('ActionEconomy', () => {
  it('lists the 8 actions', () => {
    render(<ActionEconomy you={makeYouCharacter()} send={vi.fn()} isYourTurn />);
    for (const label of [
      'Atacar',
      'Conjuro',
      'Esquivar',
      'Esprintar',
      'Destrabarse',
      'Esconderse',
      'Ayudar',
      'Preparar',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('choosing Atacar lists weapon attacks, each with a Lanzar button; clicking it sends RollAttack', async () => {
    const send = vi.fn();
    render(<ActionEconomy you={makeYouCharacter()} send={send} isYourTurn />);

    await userEvent.click(screen.getByRole('button', { name: 'Atacar' }));

    expect(screen.getByText('Espada corta')).toBeInTheDocument();
    expect(screen.queryByText('Rayo de escarcha')).not.toBeInTheDocument();

    const lanzarButtons = screen.getAllByRole('button', { name: /^lanzar/i });
    await userEvent.click(lanzarButtons[0]);

    expect(send).toHaveBeenCalledWith({
      type: 'RollAttack',
      name: 'Espada corta',
      toHitBonus: 5,
      damage: '1d6+3',
      visibility: 'public',
    });
  });

  it('choosing Conjuro lists spell attacks with a Lanzar button; clicking it sends RollAttack', async () => {
    const send = vi.fn();
    render(<ActionEconomy you={makeYouCharacter()} send={send} isYourTurn />);

    await userEvent.click(screen.getByRole('button', { name: 'Conjuro' }));

    expect(screen.getByText('Rayo de escarcha')).toBeInTheDocument();
    expect(screen.queryByText('Espada corta')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^lanzar/i }));

    expect(send).toHaveBeenCalledWith({
      type: 'RollAttack',
      name: 'Rayo de escarcha',
      toHitBonus: 4,
      damage: '1d8',
      visibility: 'public',
    });
  });

  it('choosing a simple action shows its SRD description and a Confirmar button that ends the turn', async () => {
    const send = vi.fn();
    render(<ActionEconomy you={makeYouCharacter()} send={send} isYourTurn />);

    await userEvent.click(screen.getByRole('button', { name: 'Esquivar' }));
    expect(screen.getByText(/desventaja/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(send).toHaveBeenCalledWith({ type: 'EndMyTurn' });
  });

  it('disables action buttons when it is not your turn', () => {
    render(<ActionEconomy you={makeYouCharacter()} send={vi.fn()} isYourTurn={false} />);
    expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
  });
});
