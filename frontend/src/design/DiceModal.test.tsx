import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiceModal } from './DiceModal';

describe('DiceModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <DiceModal open={false} onClose={() => {}} onRoll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('builds a notation from die type + count + modifier and rolls it', async () => {
    const user = userEvent.setup();
    const onRoll = vi.fn();
    render(<DiceModal open onClose={() => {}} onRoll={onRoll} />);

    // default is 1d20
    expect(screen.getByLabelText('Notación')).toHaveTextContent('1d20');

    await user.click(screen.getByRole('button', { name: 'd8' }));
    await user.click(screen.getByRole('button', { name: 'Más dados' })); // 2 dice
    await user.click(screen.getByRole('button', { name: 'Más modificador' })); // +1

    expect(screen.getByLabelText('Notación')).toHaveTextContent('2d8+1');

    await user.click(screen.getByRole('button', { name: /tirar 2d8\+1/i }));
    expect(onRoll).toHaveBeenCalledWith('2d8+1');
  });

  it('renders one die per count in the tray', () => {
    render(<DiceModal open onClose={() => {}} onRoll={() => {}} />);
    // default count 1 → one die
    expect(screen.getAllByLabelText(/^d20/).length).toBe(1);
  });
});
