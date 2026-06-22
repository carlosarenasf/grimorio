import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';

describe('ActionBar', () => {
  it('"Tirar d20" sends a RollDice 1d20 command', async () => {
    const send = vi.fn();
    render(<ActionBar send={send} isYourTurn={false} />);
    await userEvent.click(screen.getByRole('button', { name: /tirar d20/i }));
    expect(send).toHaveBeenCalledWith({
      type: 'RollDice',
      notation: '1d20',
      visibility: 'public',
    });
  });

  it('"Terminar turno" is enabled and sends EndMyTurn when it is your turn', async () => {
    const send = vi.fn();
    render(<ActionBar send={send} isYourTurn />);
    const endTurn = screen.getByRole('button', { name: /terminar turno/i });
    expect(endTurn).toBeEnabled();
    await userEvent.click(endTurn);
    expect(send).toHaveBeenCalledWith({ type: 'EndMyTurn' });
  });

  it('"Terminar turno" is not present/enabled when it is not your turn', () => {
    render(<ActionBar send={vi.fn()} isYourTurn={false} />);
    const endTurn = screen.queryByRole('button', { name: /terminar turno/i });
    if (endTurn) {
      expect(endTurn).toBeDisabled();
    } else {
      expect(endTurn).not.toBeInTheDocument();
    }
  });
});
