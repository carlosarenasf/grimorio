import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VistaJugadorScreen } from './VistaJugadorScreen';
import { makePlayerSnapshot, makeYouCharacter } from './fixture';

function setup(snapshotOverrides = {}, youOverrides = {}) {
  const send = vi.fn();
  const snapshot = makePlayerSnapshot(snapshotOverrides);
  const you = makeYouCharacter(youOverrides);
  render(<VistaJugadorScreen snapshot={snapshot} you={you} send={send} />);
  return { send, snapshot, you };
}

describe('VistaJugadorScreen', () => {
  it('shows "Es tu turno" and an enabled "Terminar turno" that sends EndMyTurn when it is your turn', async () => {
    const { send } = setup(); // fixture: pc-1 (Lyra, you) is active
    expect(screen.getByText(/es tu turno/i)).toBeInTheDocument();

    const endTurn = screen.getByRole('button', { name: /terminar turno/i });
    expect(endTurn).toBeEnabled();
    await userEvent.click(endTurn);
    expect(send).toHaveBeenCalledWith({ type: 'EndMyTurn' });
  });

  it('shows "Turno de X" and hides "Terminar turno" when it is NOT your turn', () => {
    setup({
      combat: { active: true, round: 2, order: ['pc-1', 'mon-1', 'pc-2'], currentTurnIndex: 1 },
    });

    expect(screen.getByText(/turno de dragón joven/i)).toBeInTheDocument();
    expect(screen.queryByText(/es tu turno/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /terminar turno/i }),
    ).not.toBeInTheDocument();
  });

  it('choosing Atacar then Lanzar sends RollAttack', async () => {
    const { send } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Atacar' }));
    await userEvent.click(screen.getByRole('button', { name: /^lanzar espada corta/i }));

    expect(send).toHaveBeenCalledWith({
      type: 'RollAttack',
      name: 'Espada corta',
      toHitBonus: 5,
      damage: '1d6+3',
      visibility: 'public',
    });
  });

  it('a monster row in the rail shows its statusLabel and never a numeric HP', () => {
    setup();
    const rail = screen.getByRole('list', { name: /tira de iniciativa/i });
    const monsterRow = within(rail)
      .getByText('Dragón joven')
      .closest('[role="listitem"]') as HTMLElement;

    expect(within(monsterRow).getByText('Herido')).toBeInTheDocument();
    expect(within(monsterRow).queryByText(/\bPV\b/i)).not.toBeInTheDocument();
  });

  it('an inventory qty stepper updates the local count', async () => {
    setup();
    const row = screen.getByText('Antorcha').closest('li') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /aumentar/i }));
    expect(within(row).getByText('4')).toBeInTheDocument();
  });

  it('"Tirar d20" sends a RollDice 1d20 command', async () => {
    const { send } = setup();
    await userEvent.click(screen.getByRole('button', { name: /tirar d20/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'RollDice',
      notation: '1d20',
      visibility: 'public',
    });
  });

  it('renders TU FICHA with HP, the 6 ability mods, and CA/Vel/Comp/Init', () => {
    setup();
    expect(screen.getByLabelText(/pv actuales/i)).toHaveTextContent('24');
    expect(screen.getByLabelText(/mod destreza/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^ca$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/velocidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/competencia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^iniciativa$/i)).toBeInTheDocument();
  });
});
