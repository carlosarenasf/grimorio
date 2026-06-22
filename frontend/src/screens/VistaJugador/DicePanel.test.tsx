import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DicePanel } from './DicePanel';

describe('DicePanel', () => {
  it('a quick dice button sends RollDice with that notation, public', async () => {
    const send = vi.fn();
    render(<DicePanel send={send} />);

    await userEvent.click(screen.getByRole('button', { name: /tirar 1d6/i }));

    expect(send).toHaveBeenCalledWith({
      type: 'RollDice',
      notation: '1d6',
      visibility: 'public',
    });
  });

  it('a custom notation can be rolled too', async () => {
    const send = vi.fn();
    render(<DicePanel send={send} />);

    const input = screen.getByLabelText(/notación/i);
    await userEvent.clear(input);
    await userEvent.type(input, '2d6+3');
    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));

    expect(send).toHaveBeenCalledWith({
      type: 'RollDice',
      notation: '2d6+3',
      visibility: 'public',
    });
  });
});
