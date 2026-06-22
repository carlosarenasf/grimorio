import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VistaMasterScreen } from './VistaMasterScreen';
import { makeMasterSnapshot, makeSrdSource } from './fixture';

function setup(snapshotOverrides = {}) {
  const send = vi.fn();
  const snapshot = makeMasterSnapshot(snapshotOverrides);
  const srd = makeSrdSource();
  render(<VistaMasterScreen snapshot={snapshot} send={send} srd={srd} />);
  return { send, snapshot, srd };
}

describe('VistaMasterScreen', () => {
  it('shows the session bar with round and the active combatant turn', () => {
    setup();
    expect(screen.getByText(/ronda 2/i)).toBeInTheDocument();
    expect(screen.getByText(/turno de lyra/i)).toBeInTheDocument();
    expect(screen.getByText(/vista de máster/i)).toBeInTheDocument();
  });

  it('renders the initiative rail with the active combatant marked aria-current', () => {
    setup();
    const rail = screen.getByRole('list', { name: /tira de iniciativa/i });
    const active = within(rail).getByText('Lyra').closest('[role="listitem"]');
    expect(active).toHaveAttribute('aria-current', 'true');
  });

  it('"Siguiente turno" sends a NextTurn command', async () => {
    const { send } = setup();
    await userEvent.click(screen.getByRole('button', { name: /siguiente turno/i }));
    expect(send).toHaveBeenCalledWith({ type: 'NextTurn' });
  });

  it('"Anterior" sends a PrevTurn command', async () => {
    const { send } = setup();
    await userEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(send).toHaveBeenCalledWith({ type: 'PrevTurn' });
  });

  it('entering an amount and clicking Daño sends ApplyDamage with amount + target', async () => {
    const { send } = setup();
    const amount = screen.getByLabelText(/cantidad de pv/i);
    await userEvent.clear(amount);
    await userEvent.type(amount, '7');
    await userEvent.click(screen.getByRole('button', { name: /^daño$/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'ApplyDamage',
      combatantId: 'pc-1',
      amount: 7,
    });
  });

  it('clicking Curar sends ApplyHealing with the entered amount + target', async () => {
    const { send } = setup();
    const amount = screen.getByLabelText(/cantidad de pv/i);
    await userEvent.clear(amount);
    await userEvent.type(amount, '5');
    await userEvent.click(screen.getByRole('button', { name: /^curar$/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'ApplyHealing',
      combatantId: 'pc-1',
      amount: 5,
    });
  });

  it('the hidden-roll button sends a RollHidden command', async () => {
    const { send } = setup();
    const notation = screen.getByLabelText(/notación/i);
    await userEvent.clear(notation);
    await userEvent.type(notation, '1d20');
    await userEvent.click(screen.getByRole('button', { name: /tirada oculta/i }));
    expect(send).toHaveBeenCalledWith({ type: 'RollHidden', notation: '1d20' });
  });

  it('a dice button sends a RollDice command', async () => {
    const { send } = setup();
    const quick = screen.getByRole('group', { name: /dados rápidos/i });
    await userEvent.click(within(quick).getByRole('button', { name: /tirar 1d20/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'RollDice',
      notation: '1d20',
      visibility: 'public',
    });
  });

  it('bestiary "+" sends AddCombatantFromBestiary', async () => {
    const { send } = setup();
    const search = screen.getByLabelText(/buscar en el bestiario/i);
    await userEvent.type(search, 'orco');
    await userEvent.click(screen.getByRole('button', { name: /añadir orco/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'AddCombatantFromBestiary',
      monsterId: 'orc',
      hpVisibility: 'dm_only',
    });
  });

  it('marks a private roll in the log as private', () => {
    setup();
    const rolls = screen.getByRole('list', { name: /^tiradas$/i });
    // The private roll's row carries the private marker; the public one does not.
    const privateRow = within(rolls).getByText('1d20').closest('li');
    expect(privateRow).toHaveTextContent(/privada/i);
    const publicRow = within(rolls).getByText('1d20+5').closest('li');
    expect(publicRow).not.toHaveTextContent(/privada/i);
  });

  it('editing the dm notes and blurring sends AppendDmNote', async () => {
    const { send } = setup();
    const notes = screen.getByLabelText(/notas del máster/i);
    await userEvent.click(notes);
    await userEvent.type(notes, ' Cuidado.');
    await userEvent.tab();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AppendDmNote' }),
    );
    const lastCall = send.mock.calls.at(-1)?.[0];
    expect(lastCall.notes).toMatch(/Cuidado\.$/);
  });
});
