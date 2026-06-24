import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiceRoller } from './DiceRoller';

describe('DiceRoller', () => {
  it('shows an empty prompt with no roll', () => {
    render(<DiceRoller latestRoll={null} />);
    expect(screen.getByText(/tira para empezar/i)).toBeInTheDocument();
  });

  it('reveals the total and a crit marker after the roll animation', async () => {
    render(
      <DiceRoller
        latestRoll={{
          id: 'r1',
          total: 20,
          tone: 'crit',
          notation: '1d20',
          breakdown: '20',
          byLabel: 'Lyra',
        }}
      />,
    );
    // The die spins first ("Tirando…"), then reveals the result.
    expect(await screen.findByText(/¡crítico!/i, {}, { timeout: 1500 })).toBeInTheDocument();
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
  });
});
