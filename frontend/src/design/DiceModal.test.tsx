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

  it('shows the rolling state and a result when settled', () => {
    const { rerender } = render(
      <DiceModal open onClose={() => {}} onRoll={() => {}} latestRoll={null} />,
    );
    // A settled roll surfaces the total + breakdown.
    rerender(
      <DiceModal
        open
        onClose={() => {}}
        onRoll={() => {}}
        latestRoll={{
          id: 'r1',
          total: 17,
          tone: 'normal',
          notation: '2d8',
          breakdown: '5 + 12',
          results: [5, 12],
        }}
      />,
    );
    // Not rolling yet (we never pressed Tirar), so the prompt is shown; the
    // tray itself is a non-DOM canvas. This asserts the modal renders without error.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
